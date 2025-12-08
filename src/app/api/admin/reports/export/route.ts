import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/reports/export - Export report data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      reportType,
      dateRange,
      startDate,
      endDate,
      filters,
      columns,
      format,
      data: reportData,
    } = body

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

    // Fetch data based on report type if not provided
    let exportData = reportData
    if (!exportData) {
      exportData = await fetchReportData(reportType, start, end, filters)
    }

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(exportData, columns)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="report-${Date.now()}.json"`,
        },
      })
    }

    // For PDF and XLSX, return JSON for now (would need additional libraries)
    return NextResponse.json({
      success: true,
      message: 'Export en cours de développement pour ce format',
      data: exportData,
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'exportation du rapport' },
      { status: 500 }
    )
  }
}

// Helper function to fetch report data
async function fetchReportData(
  reportType: string,
  startDate: Date,
  endDate: Date,
  filters?: any
) {
  const dateFilter = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  switch (reportType) {
    case 'sales':
      const orders = await prisma.order.findMany({
        where: {
          ...dateFilter,
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          ...(filters?.status && { status: { in: filters.status } }),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return orders.map((order) => ({
        orderId: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        customer: order.user?.name || order.user?.phone || 'Guest',
        customerPhone: order.user?.phone,
        items: order.items.length,
        subtotal: order.subtotal,
        tax: order.tax || 0,
        shipping: order.shippingCost || 0,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      }))

    case 'products':
      const products = await prisma.product.findMany({
        include: {
          category: true,
          orderItems: {
            where: {
              order: dateFilter,
            },
          },
        },
      })

      return products.map((product) => ({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name || 'Uncategorized',
        price: product.price,
        stock: product.stock,
        totalSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        revenue: product.orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        status: product.published ? 'Active' : 'Inactive',
      }))

    case 'customers':
      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
        },
        include: {
          orders: {
            where: {
              ...dateFilter,
              status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
            },
          },
        },
      })

      return customers.map((customer) => ({
        customerId: customer.id,
        name: customer.name || 'N/A',
        phone: customer.phone,
        email: customer.email || 'N/A',
        registeredDate: customer.createdAt.toISOString().split('T')[0],
        totalOrders: customer.orders.length,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
        averageOrderValue:
          customer.orders.length > 0
            ? customer.orders.reduce((sum, order) => sum + order.total, 0) /
              customer.orders.length
            : 0,
      }))

    case 'inventory':
      const inventoryProducts = await prisma.product.findMany({
        include: {
          category: true,
        },
      })

      return inventoryProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name || 'Uncategorized',
        stock: product.stock,
        price: product.price,
        inventoryValue: product.stock * product.price,
        status:
          product.stock === 0
            ? 'Out of Stock'
            : product.stock <= 5
            ? 'Low Stock'
            : 'In Stock',
      }))

    default:
      return []
  }
}

// Helper function to generate CSV
function generateCSV(data: any[], columns?: string[]): string {
  if (!data || data.length === 0) {
    return 'No data available'
  }

  // Get headers
  const headers = columns || Object.keys(data[0])

  // Generate CSV
  const csvRows = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          let value = row[header]
          // Handle values that contain commas or quotes
          if (value === null || value === undefined) {
            value = ''
          } else if (typeof value === 'object') {
            value = JSON.stringify(value)
          } else {
            value = String(value)
          }
          // Escape quotes and wrap in quotes if contains comma
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(',')
    ),
  ]

  return csvRows.join('\n')
}
