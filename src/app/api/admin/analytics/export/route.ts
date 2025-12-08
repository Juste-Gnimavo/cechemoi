import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Helper function to convert data to CSV
function convertToCSV(data: any[], headers: string[]): string {
  const headerRow = headers.join(',')
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  })

  return [headerRow, ...rows].join('\n')
}

// GET /api/admin/analytics/export - Export analytics data as CSV
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'orders' // orders, products, customers, revenue
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

    let csvData: string
    let filename: string

    switch (type) {
      case 'orders': {
        const orders = await prisma.order.findMany({
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
            items: {
              select: {
                quantity: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        const ordersData = orders.map((order) => ({
          orderNumber: order.orderNumber,
          date: new Date(order.createdAt).toLocaleDateString('fr-FR'),
          customer: order.user.name || 'Sans nom',
          phone: order.user.phone,
          email: order.user.email || '',
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          items: order.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shippingCost,
          discount: order.discount,
          total: order.total,
        }))

        csvData = convertToCSV(ordersData, [
          'orderNumber',
          'date',
          'customer',
          'phone',
          'email',
          'status',
          'paymentStatus',
          'paymentMethod',
          'items',
          'subtotal',
          'tax',
          'shipping',
          'discount',
          'total',
        ])
        filename = `commandes-${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'products': {
        // Get products with sales data
        const orderItems = await prisma.orderItem.findMany({
          where: {
            order: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                salePrice: true,
                stock: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })

        const productStats = new Map<string, any>()
        orderItems.forEach((item) => {
          const product = item.product
          const existing = productStats.get(product.id) || {
            sku: product.sku,
            name: product.name,
            category: product.category.name,
            price: product.price,
            salePrice: product.salePrice || product.price,
            stock: product.stock,
            unitsSold: 0,
            revenue: 0,
          }

          existing.unitsSold += item.quantity
          existing.revenue += item.total

          productStats.set(product.id, existing)
        })

        const productsData = Array.from(productStats.values()).map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          price: p.price,
          salePrice: p.salePrice,
          stock: p.stock,
          unitsSold: p.unitsSold,
          revenue: p.revenue,
          averagePrice: p.revenue / p.unitsSold,
        }))

        csvData = convertToCSV(productsData, [
          'sku',
          'name',
          'category',
          'price',
          'salePrice',
          'stock',
          'unitsSold',
          'revenue',
          'averagePrice',
        ])
        filename = `produits-performance-${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'customers': {
        const customers = await prisma.user.findMany({
          where: {
            role: 'CUSTOMER',
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
          },
          include: {
            orders: {
              select: {
                total: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                orders: true,
                reviews: true,
              },
            },
          },
        })

        const customersData = customers.map((customer) => {
          const lifetimeValue = customer.orders.reduce((sum, order) => sum + order.total, 0)
          const totalOrders = customer.orders.length
          const lastOrder = customer.orders.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]

          return {
            name: customer.name || 'Sans nom',
            phone: customer.phone,
            email: customer.email || '',
            registeredDate: new Date(customer.createdAt).toLocaleDateString('fr-FR'),
            totalOrders,
            lifetimeValue,
            averageOrderValue: totalOrders > 0 ? lifetimeValue / totalOrders : 0,
            lastOrderDate: lastOrder
              ? new Date(lastOrder.createdAt).toLocaleDateString('fr-FR')
              : 'Jamais',
            reviewsCount: customer._count.reviews,
          }
        })

        csvData = convertToCSV(customersData, [
          'name',
          'phone',
          'email',
          'registeredDate',
          'totalOrders',
          'lifetimeValue',
          'averageOrderValue',
          'lastOrderDate',
          'reviewsCount',
        ])
        filename = `clients-${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'revenue': {
        const orders = await prisma.order.findMany({
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          orderBy: {
            createdAt: 'asc',
          },
        })

        // Group by day
        const revenueByDay = new Map<string, any>()
        orders.forEach((order) => {
          const date = new Date(order.createdAt).toISOString().split('T')[0]
          const existing = revenueByDay.get(date) || {
            date,
            orders: 0,
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0,
          }

          existing.orders += 1
          existing.subtotal += order.subtotal
          existing.tax += order.tax
          existing.shipping += order.shippingCost
          existing.discount += order.discount
          existing.total += order.total

          revenueByDay.set(date, existing)
        })

        const revenueData = Array.from(revenueByDay.values())

        csvData = convertToCSV(revenueData, [
          'date',
          'orders',
          'subtotal',
          'tax',
          'shipping',
          'discount',
          'total',
        ])
        filename = `revenu-${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      default:
        return NextResponse.json({ error: 'Type d\'export invalide' }, { status: 400 })
    }

    // Return CSV file
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données' },
      { status: 500 }
    )
  }
}
