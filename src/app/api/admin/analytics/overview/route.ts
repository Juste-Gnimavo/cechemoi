import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/analytics/overview - Get overall analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0

    // Get orders with optional date filtering
    const orders = await prisma.order.findMany({
      where: hasDateFilter ? { createdAt: dateFilter } : {},
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            total: true,
          },
        },
      },
    })

    // Get PAID standalone invoices (invoices without orderId)
    const paidStandaloneInvoices = await prisma.invoice.findMany({
      where: {
        orderId: null, // Standalone invoices only
        status: 'PAID',
        ...(hasDateFilter && { createdAt: dateFilter }),
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        tax: true,
        shippingCost: true,
        discount: true,
        createdAt: true,
      },
    })

    // Calculate revenue metrics - ONLY from PAID orders (paymentStatus = COMPLETED)
    const paidOrders = orders.filter(order => order.paymentStatus === 'COMPLETED')
    const orderRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0)

    // Add standalone invoice revenue
    const standaloneInvoiceRevenue = paidStandaloneInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalRevenue = orderRevenue + standaloneInvoiceRevenue
    const totalOrders = orders.length
    const paidOrdersCount = paidOrders.length
    const averageOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0

    // Orders by status
    const ordersByStatus = orders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    // Payment status breakdown
    const ordersByPaymentStatus = orders.reduce((acc: any, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1
      return acc
    }, {})

    // Calculate totals - ONLY from PAID orders + standalone invoices
    const orderSubtotal = paidOrders.reduce((sum, order) => sum + order.subtotal, 0)
    const orderTax = paidOrders.reduce((sum, order) => sum + order.tax, 0)
    const orderShipping = paidOrders.reduce((sum, order) => sum + order.shippingCost, 0)
    const orderDiscount = paidOrders.reduce((sum, order) => sum + order.discount, 0)

    // Add standalone invoice totals
    const invoiceSubtotal = paidStandaloneInvoices.reduce((sum, inv) => sum + inv.subtotal, 0)
    const invoiceTax = paidStandaloneInvoices.reduce((sum, inv) => sum + (inv.tax || 0), 0)
    const invoiceShipping = paidStandaloneInvoices.reduce((sum, inv) => sum + (inv.shippingCost || 0), 0)
    const invoiceDiscount = paidStandaloneInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0)

    const totalSubtotal = orderSubtotal + invoiceSubtotal
    const totalTax = orderTax + invoiceTax
    const totalShipping = orderShipping + invoiceShipping
    const totalDiscount = orderDiscount + invoiceDiscount

    // Total items sold - ONLY from PAID orders
    const totalItemsSold = paidOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Get customer count (all time or filtered)
    const customerCount = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        ...(hasDateFilter && { createdAt: dateFilter }),
      },
    })

    // Get product count
    const productCount = await prisma.product.count({
      where: {
        published: true,
      },
    })

    // Revenue by day (last 30 days or custom range)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const revenueStartDate = startDate ? new Date(startDate) : thirtyDaysAgo
    const revenueEndDate = endDate ? new Date(endDate) : now

    const revenueByDay = []
    const currentDate = new Date(revenueStartDate)

    while (currentDate <= revenueEndDate) {
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      // Only count PAID orders for revenue
      const dayPaidOrders = paidOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= dayStart && orderDate <= dayEnd
      })

      const dayOrderRevenue = dayPaidOrders.reduce((sum, order) => sum + order.total, 0)

      // Add standalone invoice revenue for the day
      const dayPaidInvoices = paidStandaloneInvoices.filter((inv) => {
        const invDate = new Date(inv.createdAt)
        return invDate >= dayStart && invDate <= dayEnd
      })

      const dayInvoiceRevenue = dayPaidInvoices.reduce((sum, inv) => sum + inv.total, 0)
      const dayRevenue = dayOrderRevenue + dayInvoiceRevenue

      // Count all orders for the day (regardless of payment status)
      const dayAllOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= dayStart && orderDate <= dayEnd
      })

      revenueByDay.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayAllOrders.length,
        invoices: dayPaidInvoices.length, // Track standalone invoices separately
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Top selling products - ONLY from PAID orders
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()

    for (const order of paidOrders) {
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })

        if (product) {
          const existing = productSales.get(item.productId) || {
            name: product.name,
            quantity: 0,
            revenue: 0,
          }
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

    // Orders by payment method
    const ordersByPaymentMethod = orders.reduce((acc: any, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      analytics: {
        revenue: {
          total: totalRevenue,
          fromOrders: orderRevenue,
          fromStandaloneInvoices: standaloneInvoiceRevenue,
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
          revenue: standaloneInvoiceRevenue,
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
