import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'all' // all, today, week, month, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    let dateFilter: any = {}
    const now = new Date()

    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }
    } else if (period === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      const endOfDay = new Date(now.setHours(23, 59, 59, 999))
      dateFilter = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    } else if (period === 'week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - 7)
      dateFilter = {
        createdAt: {
          gte: startOfWeek,
        }
      }
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      dateFilter = {
        createdAt: {
          gte: startOfMonth,
        }
      }
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      dateFilter = {
        createdAt: {
          gte: startOfYear,
        }
      }
    }

    // Get orders with items
    const orders = await prisma.order.findMany({
      where: {
        ...dateFilter,
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    })

    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate by category
    const categoryMap = new Map<string, { name: string; revenue: number; orders: number }>()
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const categoryName = item.product?.category?.name || 'Sans catégorie'
        const existing = categoryMap.get(categoryName)
        if (existing) {
          existing.revenue += item.quantity * item.price
          existing.orders += 1
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            revenue: item.quantity * item.price,
            orders: 1,
          })
        }
      })
    })

    const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)

    // Calculate by product
    const productMap = new Map<string, {
      id: string
      name: string
      sku: string
      revenue: number
      quantity: number
      orders: number
    }>()

    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.revenue += item.quantity * item.price
          existing.quantity += item.quantity
          existing.orders += 1
        } else {
          productMap.set(item.productId, {
            id: item.productId,
            name: item.product?.name || 'Produit supprimé',
            sku: item.product?.sku || '',
            revenue: item.quantity * item.price,
            quantity: item.quantity,
            orders: 1,
          })
        }
      })
    })

    const byProduct = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

    // Calculate by payment method
    const paymentMap = new Map<string, { method: string; revenue: number; orders: number }>()
    orders.forEach((order: any) => {
      const existing = paymentMap.get(order.paymentMethod)
      if (existing) {
        existing.revenue += order.total
        existing.orders += 1
      } else {
        paymentMap.set(order.paymentMethod, {
          method: order.paymentMethod,
          revenue: order.total,
          orders: 1,
        })
      }
    })

    const byPaymentMethod = Array.from(paymentMap.values()).sort((a, b) => b.revenue - a.revenue)

    // Calculate daily revenue (for charts)
    const dailyRevenueMap = new Map<string, number>()
    orders.forEach((order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      const existing = dailyRevenueMap.get(date)
      dailyRevenueMap.set(date, (existing || 0) + order.total)
    })

    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top customers
    const customerMap = new Map<string, {
      id: string
      name: string
      email: string
      revenue: number
      orders: number
    }>()

    orders.forEach((order: any) => {
      const existing = customerMap.get(order.userId)
      if (existing) {
        existing.revenue += order.total
        existing.orders += 1
      } else {
        customerMap.set(order.userId, {
          id: order.userId,
          name: order.user.name || 'Client',
          email: order.user.email || '',
          revenue: order.total,
          orders: 1,
        })
      }
    })

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalCustomers: customerMap.size,
      },
      byCategory,
      byProduct: byProduct.slice(0, 20), // Top 20 products
      byPaymentMethod,
      dailyRevenue,
      topCustomers,
      orders: orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user.name || 'Client',
        date: order.createdAt,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: order.status,
      })),
    })

  } catch (error) {
    console.error('Error fetching sales data:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données de vente' },
      { status: 500 }
    )
  }
}
