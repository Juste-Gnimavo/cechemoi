import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, sessionCan, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/inventory/overview - Get inventory overview and statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'inventory')
    if (denied) return denied

    // Get all products with stock info
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        lowStockThreshold: true,
        published: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    })

    // Calculate statistics
    const totalProducts = products.length
    const publishedProducts = products.filter((p) => p.published).length

    // Stock status
    const inStock = products.filter((p) => p.stock > p.lowStockThreshold).length
    const lowStock = products.filter(
      (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
    ).length
    const outOfStock = products.filter((p) => p.stock === 0).length

    // Calculate total stock value
    const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)

    // Calculate total stock quantity
    const totalStockQuantity = products.reduce((sum, p) => sum + p.stock, 0)

    // Get low stock products
    const lowStockProducts = products
      .filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)

    // Get out of stock products
    const outOfStockProducts = products
      .filter((p) => p.stock === 0 && p.published)
      .slice(0, 10)

    // Recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    })

    // Stock by category
    type CategoryStat = { category: string; products: number; totalStock: number; stockValue: number }
    const categoryStats = products.reduce((acc: Record<string, CategoryStat>, product) => {
      const categoryName = product.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          products: 0,
          totalStock: 0,
          stockValue: 0,
        }
      }
      acc[categoryName].products += 1
      acc[categoryName].totalStock += product.stock
      acc[categoryName].stockValue += product.stock * product.price
      return acc
    }, {})

    // Étanchéité financière : la valeur du stock (globale et par catégorie)
    // est réservée à `finance.revenue` ; les quantités restent visibles.
    const canSeeRevenue = sessionCan(session, 'finance.revenue')
    const stockByCategory = Object.values(categoryStats).map((c) =>
      canSeeRevenue ? c : { ...c, stockValue: null }
    )

    return NextResponse.json({
      success: true,
      overview: {
        totalProducts,
        publishedProducts,
        inStock,
        lowStock,
        outOfStock,
        totalStockValue: canSeeRevenue ? totalStockValue : null,
        totalStockQuantity,
      },
      lowStockProducts,
      outOfStockProducts,
      recentMovements,
      stockByCategory,
    })
  } catch (error) {
    console.error('Error fetching inventory overview:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'inventaire' },
      { status: 500 }
    )
  }
}
