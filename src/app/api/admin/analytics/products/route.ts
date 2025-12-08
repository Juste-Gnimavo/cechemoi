import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/analytics/products - Get product performance analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get all order items in date range
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
            images: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        order: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    })

    // Aggregate product performance
    const productStats = new Map<
      string,
      {
        id: string
        name: string
        sku: string
        price: number
        salePrice: number | null
        stock: number
        image: string | null
        categoryId: string
        categoryName: string
        unitsSold: number
        revenue: number
        orders: number
        averagePrice: number
      }
    >()

    orderItems.forEach((item) => {
      const product = item.product
      const existing = productStats.get(product.id) || {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        image: product.images[0] || null,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        unitsSold: 0,
        revenue: 0,
        orders: 0,
        averagePrice: 0,
      }

      existing.unitsSold += item.quantity
      existing.revenue += item.total
      existing.orders += 1
      existing.averagePrice = existing.revenue / existing.unitsSold

      productStats.set(product.id, existing)
    })

    // Convert to array and sort
    const productsArray = Array.from(productStats.values())

    // Top selling products (by units)
    const topSellingByUnits = [...productsArray]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit)

    // Top revenue products
    const topSellingByRevenue = [...productsArray]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

    // Low performing products (by units, excluding out of stock)
    const lowPerforming = [...productsArray]
      .filter((p) => p.stock > 0)
      .sort((a, b) => a.unitsSold - b.unitsSold)
      .slice(0, limit)

    // Get all products for inventory insights
    const allProducts = await prisma.product.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        categoryId: true,
      },
    })

    // Products never sold (in this period)
    const neverSold = allProducts
      .filter((p) => !productStats.has(p.id))
      .slice(0, limit)

    // Out of stock products that were selling
    const outOfStockBestSellers = productsArray
      .filter((p) => p.stock === 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit)

    // Product performance summary
    const totalProducts = allProducts.length
    const productsWithSales = productStats.size
    const totalUnitsSold = productsArray.reduce((sum, p) => sum + p.unitsSold, 0)
    const totalRevenue = productsArray.reduce((sum, p) => sum + p.revenue, 0)
    const averageUnitsPerProduct =
      productsWithSales > 0 ? totalUnitsSold / productsWithSales : 0
    const averageRevenuePerProduct =
      productsWithSales > 0 ? totalRevenue / productsWithSales : 0

    // Stock insights
    const lowStockProducts = allProducts.filter(
      (p) => p.stock > 0 && p.stock <= 10
    ).length
    const outOfStockProducts = allProducts.filter((p) => p.stock === 0).length

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts,
        productsWithSales,
        productsWithoutSales: totalProducts - productsWithSales,
        totalUnitsSold,
        totalRevenue,
        averageUnitsPerProduct,
        averageRevenuePerProduct,
        lowStockProducts,
        outOfStockProducts,
      },
      topSellingByUnits,
      topSellingByRevenue,
      lowPerforming,
      neverSold,
      outOfStockBestSellers,
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics produits' },
      { status: 500 }
    )
  }
}
