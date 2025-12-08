import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reports/analytics - Get analytics data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'overview' // overview, sales, customers, products, inventory
    const dateRange = searchParams.get('dateRange') || 'month' // today, week, month, year, custom
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
        end = endDate ? new Date(endDate) : now
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Build date filter
    const dateFilter = {
      createdAt: {
        gte: start,
        lte: end,
      },
    }

    // Get data based on report type
    let data: any = {}

    if (reportType === 'overview' || reportType === 'sales') {
      // Sales Analytics
      const orders = await prisma.order.findMany({
        where: {
          ...dateFilter,
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        select: {
          total: true,
          subtotal: true,
          tax: true,
          shippingCost: true,
          status: true,
          createdAt: true,
        },
      })

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const totalTax = orders.reduce((sum, order) => sum + (order.tax || 0), 0)
      const totalShipping = orders.reduce((sum, order) => sum + (order.shippingCost || 0), 0)

      // Revenue by day/week/month
      const revenueByPeriod = orders.reduce((acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0]
        if (!acc[date]) acc[date] = 0
        acc[date] += order.total
        return acc
      }, {} as Record<string, number>)

      // Top products
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: dateFilter,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      })

      const productSales = orderItems.reduce((acc, item) => {
        const productId = item.productId
        if (!acc[productId]) {
          acc[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          }
        }
        acc[productId].quantity += item.quantity
        acc[productId].revenue += item.price * item.quantity
        return acc
      }, {} as Record<string, any>)

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10)

      data.sales = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalTax,
        totalShipping,
        revenueByPeriod: Object.entries(revenueByPeriod).map(([date, revenue]) => ({
          date,
          revenue,
        })),
        topProducts,
      }
    }

    if (reportType === 'overview' || reportType === 'customers') {
      // Customer Analytics
      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          ...dateFilter,
        },
        include: {
          orders: {
            where: {
              status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
            },
            select: {
              total: true,
              createdAt: true,
            },
          },
        },
      })

      const newCustomers = customers.length

      // Customer lifetime value
      const customerLTV = customers.map((customer) => {
        const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
        const orderCount = customer.orders.length
        return {
          id: customer.id,
          name: customer.name || customer.phone,
          phone: customer.phone,
          email: customer.email,
          totalSpent,
          orderCount,
          averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
          firstOrder: customer.orders[0]?.createdAt,
          lastOrder: customer.orders[customer.orders.length - 1]?.createdAt,
        }
      })

      const topCustomers = customerLTV
        .filter((c) => c.orderCount > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)

      // Repeat customer rate
      const repeatCustomers = customerLTV.filter((c) => c.orderCount > 1).length
      const totalWithOrders = customerLTV.filter((c) => c.orderCount > 0).length
      const repeatCustomerRate = totalWithOrders > 0 ? (repeatCustomers / totalWithOrders) * 100 : 0

      data.customers = {
        newCustomers,
        totalCustomers: customers.length,
        repeatCustomers,
        repeatCustomerRate,
        topCustomers,
        averageLTV:
          customerLTV.length > 0
            ? customerLTV.reduce((sum, c) => sum + c.totalSpent, 0) / customerLTV.length
            : 0,
      }
    }

    if (reportType === 'overview' || reportType === 'products') {
      // Product Performance
      const products = await prisma.product.findMany({
        include: {
          category: true,
          orderItems: {
            where: {
              order: dateFilter,
            },
          },
          reviews: true,
        },
      })

      const productPerformance = products.map((product) => {
        const totalSold = product.orderItems.reduce((sum, item) => item.quantity + sum, 0)
        const revenue = product.orderItems.reduce(
          (sum, item) => item.price * item.quantity + sum,
          0
        )
        const avgRating =
          product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => r.rating + sum, 0) / product.reviews.length
            : 0

        return {
          id: product.id,
          name: product.name,
          category: product.category?.name,
          price: product.price,
          stock: product.stock,
          totalSold,
          revenue,
          reviewCount: product.reviews.length,
          averageRating: avgRating,
          lowStock: product.stock <= 5,
        }
      })

      const topSellingProducts = productPerformance
        .filter((p) => p.totalSold > 0)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10)

      const topRevenueProducts = productPerformance
        .filter((p) => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      const lowStockProducts = productPerformance
        .filter((p) => p.lowStock)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)

      // Category performance
      const categories = await prisma.category.findMany({
        include: {
          products: {
            include: {
              orderItems: {
                where: {
                  order: dateFilter,
                },
              },
            },
          },
        },
      })

      const categoryPerformance = categories.map((category) => {
        const totalSold = category.products.reduce(
          (sum, product) =>
            sum + product.orderItems.reduce((s, item) => s + item.quantity, 0),
          0
        )
        const revenue = category.products.reduce(
          (sum, product) =>
            sum +
            product.orderItems.reduce((s, item) => s + item.price * item.quantity, 0),
          0
        )

        return {
          id: category.id,
          name: category.name,
          productCount: category.products.length,
          totalSold,
          revenue,
        }
      })

      data.products = {
        totalProducts: products.length,
        topSellingProducts,
        topRevenueProducts,
        lowStockProducts,
        categoryPerformance: categoryPerformance
          .filter((c) => c.totalSold > 0)
          .sort((a, b) => b.revenue - a.revenue),
      }
    }

    if (reportType === 'overview' || reportType === 'inventory') {
      // Inventory Analytics
      const products = await prisma.product.findMany({
        include: {
          category: true,
        },
      })

      const totalProducts = products.length
      const lowStockProducts = products.filter((p) => p.stock <= 5).length
      const outOfStockProducts = products.filter((p) => p.stock === 0).length
      const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

      data.inventory = {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
        stockByCategory: products.reduce((acc, product) => {
          const categoryName = product.category?.name || 'Uncategorized'
          if (!acc[categoryName]) {
            acc[categoryName] = {
              category: categoryName,
              products: 0,
              totalStock: 0,
              value: 0,
            }
          }
          acc[categoryName].products += 1
          acc[categoryName].totalStock += product.stock
          acc[categoryName].value += product.price * product.stock
          return acc
        }, {} as Record<string, any>),
      }
    }

    return NextResponse.json({
      success: true,
      data,
      dateRange: {
        start,
        end,
        period: dateRange,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analyses' },
      { status: 500 }
    )
  }
}
