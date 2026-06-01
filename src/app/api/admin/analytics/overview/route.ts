import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { computeCashReceipts } from '@/lib/finance/aggregations'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/analytics/overview - Get overall analytics
//
// La valeur `revenue.total` exposée par cet endpoint correspond aux
// ENCAISSEMENTS sur la période (argent réellement reçu, dé-dupliqué entre flux).
// Voir src/lib/finance/aggregations.ts pour la définition canonique.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow ADMIN, MANAGER, STAFF, TAILOR to access dashboard stats
    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR']
    if (!session || !allowedRoles.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Période d'agrégation : la même borne s'applique à toutes les requêtes
    // (paid orders, factures, receipts, paiements autonomes, RDV…) pour éviter
    // les incohérences temporelles.
    const now = new Date()
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    defaultStart.setHours(0, 0, 0, 0)

    const start = startDateParam ? new Date(startDateParam) : defaultStart
    if (startDateParam) start.setHours(0, 0, 0, 0)
    const end = endDateParam ? new Date(endDateParam) : new Date(now)
    end.setHours(23, 59, 59, 999)

    const dateFilter = { gte: start, lte: end }

    // ─── Encaissements via le helper canonique ──────────────────────────────
    // Plus de double comptage : sum standalone invoice.total + sum standalone
    // InvoicePayment.amount n'existe plus. Voir aggregations.ts.
    const cashReceipts = await computeCashReceipts({ start, end })

    // ─── Données complémentaires (orders, products, items, customers) ───────
    const [orders, paidStandaloneInvoices, customerCount, productCount] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: dateFilter },
        include: {
          items: {
            select: {
              productId: true,
              quantity: true,
              total: true,
            },
          },
        },
      }),
      // Conservé pour exposer le compte de factures autonomes payées dans la
      // période et alimenter les sous-totaux HT/taxe/livraison.
      prisma.invoice.findMany({
        where: {
          orderId: null,
          customOrderId: null,
          status: 'PAID',
          issueDate: dateFilter,
        },
        select: {
          id: true,
          total: true,
          subtotal: true,
          tax: true,
          shippingCost: true,
          discount: true,
          createdAt: true,
          issueDate: true,
        },
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: dateFilter },
      }),
      prisma.product.count({ where: { published: true } }),
    ])

    const paidOrders = orders.filter(order => order.paymentStatus === 'COMPLETED')
    const totalOrders = orders.length
    const paidOrdersCount = paidOrders.length

    // ─── Sous-totaux comptables (HT, taxe, livraison, remise) ───────────────
    // Basés sur les commandes payées + les factures autonomes payées. C'est ce
    // que /admin et /admin/analytics affichent dans le détail.
    const orderSubtotal = paidOrders.reduce((sum, o) => sum + o.subtotal, 0)
    const orderTax = paidOrders.reduce((sum, o) => sum + o.tax, 0)
    const orderShipping = paidOrders.reduce((sum, o) => sum + o.shippingCost, 0)
    const orderDiscount = paidOrders.reduce((sum, o) => sum + o.discount, 0)

    const invoiceSubtotal = paidStandaloneInvoices.reduce((sum, inv) => sum + inv.subtotal, 0)
    const invoiceTax = paidStandaloneInvoices.reduce((sum, inv) => sum + (inv.tax || 0), 0)
    const invoiceShipping = paidStandaloneInvoices.reduce((sum, inv) => sum + (inv.shippingCost || 0), 0)
    const invoiceDiscount = paidStandaloneInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0)

    const totalSubtotal = orderSubtotal + invoiceSubtotal
    const totalTax = orderTax + invoiceTax
    const totalShipping = orderShipping + invoiceShipping
    const totalDiscount = orderDiscount + invoiceDiscount

    // Panier moyen : revenue ORDERS / count ORDERS (et non revenue total)
    const averageOrderValue = paidOrdersCount > 0 ? cashReceipts.breakdown.orders / paidOrdersCount : 0

    // Items vendus
    const totalItemsSold = paidOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Répartitions orders
    const ordersByStatus = orders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
    const ordersByPaymentStatus = orders.reduce((acc: any, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1
      return acc
    }, {})
    const ordersByPaymentMethod = orders.reduce((acc: any, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1
      return acc
    }, {})

    // ─── Revenue par jour ────────────────────────────────────────────────────
    // Pour chaque jour de la période, on calcule l'encaissement via les mêmes
    // règles que computeCashReceipts (sans le helper, pour ne pas faire 30
    // appels Prisma — on charge tout en mémoire et on filtre par jour).

    const [
      dayOrders,
      dayCustomPayments,
      dayStandaloneInvoicePayments,
      dayStandalonePayments,
      dayAppointments,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { paymentStatus: 'COMPLETED', createdAt: dateFilter },
        select: { total: true, createdAt: true },
      }),
      prisma.customOrderPayment.findMany({
        where: { paidAt: dateFilter },
        select: { amount: true, paidAt: true },
      }),
      prisma.invoicePayment.findMany({
        where: {
          paidAt: dateFilter,
          invoice: { orderId: null, customOrderId: null },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.standalonePayment.findMany({
        where: { status: 'COMPLETED', paidAt: dateFilter },
        select: { amount: true, paidAt: true },
      }),
      prisma.appointment.findMany({
        where: {
          paymentStatus: 'PAID',
          paidAmount: { gt: 0 },
          createdAt: dateFilter,
        },
        select: { paidAmount: true, createdAt: true },
      }),
    ])

    const revenueByDay: { date: string; revenue: number; orders: number; invoices: number }[] = []
    const currentDate = new Date(start)
    currentDate.setHours(0, 0, 0, 0)

    while (currentDate <= end) {
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const dayKey = dayStart.toISOString().split('T')[0]
      const within = (d: Date | null | undefined) => {
        if (!d) return false
        const dt = new Date(d)
        return dt >= dayStart && dt <= dayEnd
      }

      const dayOrdersRev = dayOrders.filter(o => within(o.createdAt)).reduce((s, o) => s + o.total, 0)
      const dayCustomRev = dayCustomPayments.filter(p => within(p.paidAt)).reduce((s, p) => s + p.amount, 0)
      const dayStandaloneInvRev = dayStandaloneInvoicePayments.filter(p => within(p.paidAt)).reduce((s, p) => s + p.amount, 0)
      const dayStandaloneRev = dayStandalonePayments.filter(p => within(p.paidAt)).reduce((s, p) => s + p.amount, 0)
      const dayApptRev = dayAppointments.filter(a => within(a.createdAt)).reduce((s, a) => s + a.paidAmount, 0)

      const dayAllOrders = orders.filter(o => within(o.createdAt))
      const dayPaidInvoices = paidStandaloneInvoices.filter(inv => within(inv.issueDate))

      revenueByDay.push({
        date: dayKey,
        revenue: dayOrdersRev + dayCustomRev + dayStandaloneInvRev + dayStandaloneRev + dayApptRev,
        orders: dayAllOrders.length,
        invoices: dayPaidInvoices.length,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // ─── Top products (depuis les commandes payées) ─────────────────────────
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
    for (const order of paidOrders) {
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })
        if (product) {
          const existing = productSales.get(item.productId) || { name: product.name, quantity: 0, revenue: 0 }
          existing.quantity += item.quantity
          existing.revenue += item.total
          productSales.set(item.productId, existing)
        }
      }
    }
    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ─── Comparaison avec la période précédente ─────────────────────────────
    const periodLengthMs = end.getTime() - start.getTime()
    const previousEnd = new Date(start.getTime() - 1)
    const previousStart = new Date(previousEnd.getTime() - periodLengthMs)

    const [previousCashReceipts, previousOrdersCount, previousCustomerCount, previousProductCount] = await Promise.all([
      computeCashReceipts({ start: previousStart, end: previousEnd }),
      prisma.order.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
      prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: previousStart, lte: previousEnd } },
      }),
      prisma.product.count({
        where: { published: true, createdAt: { lte: previousEnd } },
      }),
    ])

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const comparison = {
      revenue: {
        current: cashReceipts.total,
        previous: previousCashReceipts.total,
        change: calculateChange(cashReceipts.total, previousCashReceipts.total),
      },
      orders: {
        current: totalOrders,
        previous: previousOrdersCount,
        change: calculateChange(totalOrders, previousOrdersCount),
      },
      customers: {
        current: customerCount,
        previous: previousCustomerCount,
        change: calculateChange(customerCount, previousCustomerCount),
      },
      products: {
        current: productCount,
        previous: previousProductCount,
        change: calculateChange(productCount, previousProductCount),
      },
    }

    // ─── Réponse ────────────────────────────────────────────────────────────
    // Forme préservée pour back-compat avec les consumers existants
    // (/admin, /admin/analytics, /admin/analytics/revenue, /admin/transactions).
    // `fromInvoicePayments` est conservé pour back-compat mais vaut 0 — sa
    // valeur est désormais incluse dans `fromStandaloneInvoices`.
    return NextResponse.json({
      success: true,
      analytics: {
        revenue: {
          total: cashReceipts.total,
          fromOrders: cashReceipts.breakdown.orders,
          fromStandaloneInvoices: cashReceipts.breakdown.standaloneInvoices,
          fromCustomOrders: cashReceipts.breakdown.customOrders,
          fromStandalonePayments: cashReceipts.breakdown.standalone,
          fromInvoicePayments: 0,
          fromAppointments: cashReceipts.breakdown.appointments,
          subtotal: totalSubtotal,
          tax: totalTax,
          shipping: totalShipping,
          discount: totalDiscount,
        },
        orders: {
          total: totalOrders,
          paid: paidOrdersCount,
          byStatus: ordersByStatus,
          byPaymentStatus: ordersByPaymentStatus,
          byPaymentMethod: ordersByPaymentMethod,
          averageValue: averageOrderValue,
        },
        standaloneInvoices: {
          total: paidStandaloneInvoices.length,
          revenue: cashReceipts.breakdown.standaloneInvoices,
        },
        customOrders: {
          receiptsCount: dayCustomPayments.length,
          revenue: cashReceipts.breakdown.customOrders,
        },
        items: {
          totalSold: totalItemsSold,
        },
        customers: {
          total: customerCount,
        },
        products: {
          total: productCount,
        },
        revenueByDay,
        topProducts,
        comparison,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics' },
      { status: 500 }
    )
  }
}
