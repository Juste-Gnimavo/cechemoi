import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// PUT /api/admin/products/bulk - Bulk update products
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { productIds, action, value } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'IDs de produits requis' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case 'publish':
        updateData = { published: true }
        break

      case 'unpublish':
        updateData = { published: false }
        break

      case 'feature':
        updateData = { featured: true }
        break

      case 'unfeature':
        updateData = { featured: false }
        break

      case 'updateCategory':
        if (!value) {
          return NextResponse.json({ error: 'ID de catégorie requis' }, { status: 400 })
        }
        updateData = { categoryId: value }
        break

      case 'updatePrice':
        if (!value || isNaN(parseFloat(value))) {
          return NextResponse.json({ error: 'Prix valide requis' }, { status: 400 })
        }
        updateData = { price: parseFloat(value) }
        break

      case 'adjustPrice':
        // Adjust price by percentage
        if (!value || isNaN(parseFloat(value))) {
          return NextResponse.json({ error: 'Pourcentage valide requis' }, { status: 400 })
        }

        const percentage = parseFloat(value)
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true },
        })

        // Update each product with adjusted price
        await Promise.all(
          products.map((product) =>
            prisma.product.update({
              where: { id: product.id },
              data: {
                price: product.price * (1 + percentage / 100),
              },
            })
          )
        )

        return NextResponse.json({
          success: true,
          message: `${products.length} produit(s) mis à jour`,
          count: products.length,
        })

      case 'updateStock':
        if (value === undefined || isNaN(parseInt(value))) {
          return NextResponse.json({ error: 'Stock valide requis' }, { status: 400 })
        }
        updateData = { stock: parseInt(value) }
        break

      case 'adjustStock':
        // Adjust stock by adding/subtracting
        if (value === undefined || isNaN(parseInt(value))) {
          return NextResponse.json({ error: 'Quantité valide requise' }, { status: 400 })
        }

        const stockAdjustment = parseInt(value)
        const productsForStock = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true },
        })

        await Promise.all(
          productsForStock.map((product) =>
            prisma.product.update({
              where: { id: product.id },
              data: {
                stock: Math.max(0, product.stock + stockAdjustment),
              },
            })
          )
        )

        return NextResponse.json({
          success: true,
          message: `${productsForStock.length} produit(s) mis à jour`,
          count: productsForStock.length,
        })

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 })
    }

    // Apply update for simple actions
    if (Object.keys(updateData).length > 0) {
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: updateData,
      })

      return NextResponse.json({
        success: true,
        message: `${result.count} produit(s) mis à jour`,
        count: result.count,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'action groupée' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/bulk - Bulk delete products
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const body = await req.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'IDs de produits requis' }, { status: 400 })
    }

    // Check if any products have orders
    const productsWithOrders = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        orderItems: {
          some: {},
        },
      },
      select: { id: true, name: true },
    })

    if (productsWithOrders.length > 0) {
      return NextResponse.json(
        {
          error: `${productsWithOrders.length} produit(s) ont des commandes associées et ne peuvent pas être supprimés`,
          products: productsWithOrders,
        },
        { status: 400 }
      )
    }

    const result = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} produit(s) supprimé(s)`,
      count: result.count,
    })
  } catch (error) {
    console.error('Error deleting products:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des produits' },
      { status: 500 }
    )
  }
}
