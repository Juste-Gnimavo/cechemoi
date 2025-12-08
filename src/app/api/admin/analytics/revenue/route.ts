import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/analytics/revenue - Get revenue analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const now = new Date()
    let dateFilter: any = {}

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = {
        gte: thirtyDaysAgo,
        lte: now,
      }
    }

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: dateFilter,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        coupon: {
          select: {
            code: true,
            discountValue: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Calculate revenue metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0)
    const totalTax = orders.reduce((sum, order) => sum + order.tax, 0)
    const totalShipping = orders.reduce((sum, order) => sum + order.shippingCost, 0)
    const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0)

    // Revenue by period
    const revenueByPeriod: any[] = []
    const groupedOrders = new Map<string, any[]>()

    orders.forEach((order) => {
      const date = new Date(order.createdAt)
      let key: string

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!groupedOrders.has(key)) {
        groupedOrders.set(key, [])
      }
      groupedOrders.get(key)!.push(order)
    })

    groupedOrders.forEach((orders, period) => {
      const revenue = orders.reduce((sum, order) => sum + order.total, 0)
      const orderCount = orders.length
      const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0)
      const tax = orders.reduce((sum, order) => sum + order.tax, 0)
      const shipping = orders.reduce((sum, order) => sum + order.shippingCost, 0)
      const discount = orders.reduce((sum, order) => sum + order.discount, 0)

      revenueByPeriod.push({
        period,
        revenue,
        orders: orderCount,
        subtotal,
        tax,
        shipping,
        discount,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      })
    })

    // Sort by period
    revenueByPeriod.sort((a, b) => a.period.localeCompare(b.period))

    // Revenue by payment method
    const revenueByPaymentMethod = orders.reduce((acc: any, order) => {
      if (!acc[order.paymentMethod]) {
        acc[order.paymentMethod] = {
          revenue: 0,
          orders: 0,
        }
      }
      acc[order.paymentMethod].revenue += order.total
      acc[order.paymentMethod].orders += 1
      return acc
    }, {})

    // Revenue by category
    const revenueByCategory: Map<string, { name: string; revenue: number; orders: number }> =
      new Map()

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryId = item.product.categoryId
        const categoryName = item.product.category.name

        if (!revenueByCategory.has(categoryId)) {
          revenueByCategory.set(categoryId, {
            name: categoryName,
            revenue: 0,
            orders: 0,
          })
        }

        const category = revenueByCategory.get(categoryId)!
        category.revenue += item.total
      })

      // Count unique categories per order
      const uniqueCategories = new Set(order.items.map((item) => item.product.categoryId))
      uniqueCategories.forEach((categoryId) => {
        const category = revenueByCategory.get(categoryId)!
        category.orders += 1
      })
    })

    const categoryRevenue = Array.from(revenueByCategory.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    // Revenue comparison (vs previous period)
    const periodLength = dateFilter.lte.getTime() - dateFilter.gte.getTime()
    const previousPeriodStart = new Date(dateFilter.gte.getTime() - periodLength)
    const previousPeriodEnd = new Date(dateFilter.gte)

    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd,
        },
      },
    })

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)
    const revenueGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return NextResponse.json({
      success: true,
      revenue: {
        total: totalRevenue,
        subtotal: totalSubtotal,
        tax: totalTax,
        shipping: totalShipping,
        discount: totalDiscount,
        orders: totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        growth: revenueGrowth,
        previousPeriod: {
          revenue: previousRevenue,
          orders: previousOrders.length,
        },
      },
      byPeriod: revenueByPeriod,
      byPaymentMethod: revenueByPaymentMethod,
      byCategory: categoryRevenue,
    })
  } catch (error) {
    console.error('Error fetching revenue analytics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics de revenu' },
      { status: 500 }
    )
  }
}
