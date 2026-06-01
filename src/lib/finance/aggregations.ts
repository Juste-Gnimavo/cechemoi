// Source de vérité unique pour les agrégations financières admin.
// Trois concepts strictement distincts :
//   - Encaissé (cashReceipts)    : argent réellement reçu, dé-dupliqué entre flux
//   - CA réalisé (bookedRevenue) : ventes confirmées (orders payés, custom livrés, factures payées)
//   - Facturé (billed)           : factures émises hors DRAFT/CANCELLED/REFUNDED
//
// Toute page qui affiche un KPI financier doit consommer ces helpers — c'est ce
// qui garantit que les chiffres sont cohérents entre /admin, /admin/invoices,
// /admin/reports, /admin/analytics et /admin/transactions.

import { prisma } from '@/lib/prisma'

export interface DateWindow {
  start: Date
  end: Date
}

// ─── Encaissé ──────────────────────────────────────────────────────────────
// On somme uniquement les FLUX DE PAIEMENT, jamais les totaux de factures ou
// de commandes — c'est la seule façon d'éviter le double comptage. Le bug
// historique additionnait `invoice.total` ET les `InvoicePayment.amount`
// correspondants : une facture standalone payée 100k apparaissait deux fois.

export interface CashReceiptsBreakdown {
  orders: number               // Paiements en ligne (Order paymentStatus=COMPLETED)
  customOrders: number         // CustomOrderPayment (acomptes / soldes sur sur-mesure)
  standaloneInvoices: number   // InvoicePayment sur factures sans order/customOrder
  standalone: number           // StandalonePayment (flow /payer/)
  appointments: number         // Appointment.paidAmount (rendez-vous payés)
}

export interface CashReceipts {
  total: number
  breakdown: CashReceiptsBreakdown
}

export async function computeCashReceipts({ start, end }: DateWindow): Promise<CashReceipts> {
  const window = { gte: start, lte: end }

  const [ordersAgg, customAgg, standaloneInvoicePayments, standaloneAgg, apptAgg] = await Promise.all([
    // 1. Commandes en ligne payées — Order.total sur paymentStatus=COMPLETED.
    // Order.Payment n'est pas systématique (paiement à la livraison, etc.) donc
    // on s'appuie sur paymentStatus côté Order.
    prisma.order.aggregate({
      where: { paymentStatus: 'COMPLETED', createdAt: window },
      _sum: { total: true },
    }),

    // 2. Paiements sur-mesure — somme directe des CustomOrderPayment.
    // Note : certains CustomOrderPayment sont synchronisés avec un InvoicePayment
    // d'une facture custom (invoiceId / customOrderId non null) ; le filtre étape
    // 3 exclut ces InvoicePayments pour éviter le double comptage.
    prisma.customOrderPayment.aggregate({
      where: { paidAt: window },
      _sum: { amount: true },
    }),

    // 3. Factures autonomes encaissées — InvoicePayment uniquement pour les
    // factures sans orderId ET sans customOrderId. Les paiements liés à un
    // order/customOrder sont déjà comptés en (1) ou (2).
    prisma.invoicePayment.findMany({
      where: {
        paidAt: window,
        invoice: { orderId: null, customOrderId: null },
      },
      select: { amount: true },
    }),

    // 4. Paiements autonomes (flow /payer/) — StandalonePayment.
    prisma.standalonePayment.aggregate({
      where: { status: 'COMPLETED', paidAt: window },
      _sum: { amount: true },
    }),

    // 5. Rendez-vous payés — Appointment.paidAmount.
    // L'Appointment n'a pas de paidAt distinct, on s'aligne sur createdAt.
    prisma.appointment.aggregate({
      where: {
        paymentStatus: 'PAID',
        paidAmount: { gt: 0 },
        createdAt: window,
      },
      _sum: { paidAmount: true },
    }),
  ])

  const breakdown: CashReceiptsBreakdown = {
    orders: ordersAgg._sum.total || 0,
    customOrders: customAgg._sum.amount || 0,
    standaloneInvoices: standaloneInvoicePayments.reduce((s, p) => s + p.amount, 0),
    standalone: standaloneAgg._sum.amount || 0,
    appointments: apptAgg._sum.paidAmount || 0,
  }

  const total =
    breakdown.orders +
    breakdown.customOrders +
    breakdown.standaloneInvoices +
    breakdown.standalone +
    breakdown.appointments

  return { total, breakdown }
}

// ─── CA réalisé ─────────────────────────────────────────────────────────────
// Ventes CONFIRMÉES sur la période. Plus strict que l'encaissé : on ne compte
// pas les acomptes partiels ni les paiements anticipés sur un contrat non
// honoré. Utile pour les rapports comptables au sens strict.

export interface BookedRevenueBreakdown {
  orders: { total: number; count: number }
  customOrders: { total: number; count: number }
  standaloneInvoices: { total: number; count: number }
  appointments: { total: number; count: number }
}

export interface BookedRevenue {
  total: number
  breakdown: BookedRevenueBreakdown
}

export async function computeBookedRevenue({ start, end }: DateWindow): Promise<BookedRevenue> {
  const window = { gte: start, lte: end }

  const [ordersAgg, customAgg, invoiceAgg, apptAgg] = await Promise.all([
    // Commandes payées
    prisma.order.aggregate({
      where: { paymentStatus: 'COMPLETED', createdAt: window },
      _sum: { total: true },
      _count: true,
    }),

    // Sur-mesure livrés
    prisma.customOrder.aggregate({
      where: { status: 'DELIVERED', orderDate: window },
      _sum: { totalCost: true },
      _count: true,
    }),

    // Factures autonomes payées
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        orderId: null,
        customOrderId: null,
        issueDate: window,
      },
      _sum: { total: true },
      _count: true,
    }),

    // Rendez-vous honorés
    prisma.appointment.aggregate({
      where: {
        paymentStatus: 'PAID',
        paidAmount: { gt: 0 },
        createdAt: window,
      },
      _sum: { paidAmount: true },
      _count: true,
    }),
  ])

  const breakdown: BookedRevenueBreakdown = {
    orders: { total: ordersAgg._sum.total || 0, count: ordersAgg._count },
    customOrders: { total: customAgg._sum.totalCost || 0, count: customAgg._count },
    standaloneInvoices: { total: invoiceAgg._sum.total || 0, count: invoiceAgg._count },
    appointments: { total: apptAgg._sum.paidAmount || 0, count: apptAgg._count },
  }

  const total =
    breakdown.orders.total +
    breakdown.customOrders.total +
    breakdown.standaloneInvoices.total +
    breakdown.appointments.total

  return { total, breakdown }
}

// ─── Facturé ────────────────────────────────────────────────────────────────
// Total des factures émises (Invoice.total). Exclut DRAFT, CANCELLED, REFUNDED
// par défaut — une facture brouillon n'a juridiquement pas été émise, une
// facture annulée n'est plus due. Le paramètre `source` permet de ventiler
// par origine (en ligne / sur mesure / autonome).

export type InvoiceSource = 'online' | 'custom' | 'standalone'

export interface BilledOptions extends DateWindow {
  source?: InvoiceSource
}

export interface BilledByStatus {
  status: string
  total: number
  count: number
}

export interface BilledBySource {
  online: { total: number; count: number }
  custom: { total: number; count: number }
  standalone: { total: number; count: number }
}

export interface Billed {
  total: number          // Total facturé TTC
  paid: number           // Total encaissé sur ces factures (somme amountPaid)
  outstanding: number    // Reste dû
  count: number
  byStatus: BilledByStatus[]
  bySource: BilledBySource
}

const BILLED_EXCLUDED_STATUSES = ['DRAFT', 'CANCELLED', 'REFUNDED'] as const

export async function computeBilled({ start, end, source }: BilledOptions): Promise<Billed> {
  const window = { gte: start, lte: end }
  const where: any = {
    issueDate: window,
    status: { notIn: [...BILLED_EXCLUDED_STATUSES] },
  }

  if (source === 'online') where.orderId = { not: null }
  else if (source === 'custom') where.customOrderId = { not: null }
  else if (source === 'standalone') {
    where.orderId = null
    where.customOrderId = null
  }

  const [agg, byStatusGroup, allForSource] = await Promise.all([
    prisma.invoice.aggregate({
      where,
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where,
      _sum: { total: true },
      _count: true,
    }),
    // Ventilation par origine — toujours calculée même si un filtre source est
    // appliqué, pour fournir le contexte complet dans la card.
    prisma.invoice.findMany({
      where: { issueDate: window, status: { notIn: [...BILLED_EXCLUDED_STATUSES] } },
      select: { orderId: true, customOrderId: true, total: true },
    }),
  ])

  const bySource: BilledBySource = {
    online: { total: 0, count: 0 },
    custom: { total: 0, count: 0 },
    standalone: { total: 0, count: 0 },
  }
  for (const inv of allForSource) {
    if (inv.orderId) {
      bySource.online.count++
      bySource.online.total += inv.total
    } else if (inv.customOrderId) {
      bySource.custom.count++
      bySource.custom.total += inv.total
    } else {
      bySource.standalone.count++
      bySource.standalone.total += inv.total
    }
  }

  const total = agg._sum.total || 0
  const paid = agg._sum.amountPaid || 0

  return {
    total,
    paid,
    outstanding: total - paid,
    count: agg._count,
    byStatus: byStatusGroup.map((g) => ({
      status: g.status,
      total: g._sum.total || 0,
      count: g._count,
    })),
    bySource,
  }
}

// ─── Helper période 30 jours par défaut ─────────────────────────────────────
// Réutilisable par les endpoints qui n'utilisent pas resolveDateRange.

export function defaultLast30Days(): DateWindow {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - 30)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}
