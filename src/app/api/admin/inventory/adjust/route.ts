import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/inventory/adjust - Adjust stock for a product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, type, reason, notes, reference } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'ID de produit et quantité requis' },
        { status: 400 }
      )
    }

    if (!type || !['purchase', 'adjustment', 'return', 'damaged'].includes(type)) {
      return NextResponse.json({ error: 'Type de mouvement invalide' }, { status: 400 })
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const previousStock = product.stock
    const newStock = Math.max(0, previousStock + parseInt(quantity))

    // Update product stock and create movement record in a transaction
    const result = await prisma.$transaction([
      // Update product stock
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),

      // Create stock movement record
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity: parseInt(quantity),
          previousStock,
          newStock,
          reference,
          reason,
          notes,
          performedBy: (session.user as any).id,
          performedByName: (session.user as any).name || 'Admin',
        },
      }),
    ])

    const [updatedProduct, movement] = result

    // Check if we need to send stock alerts
    if (newStock === 0 && previousStock > 0) {
      // Stock just went to zero - send out of stock alert
      const { notificationService } = await import('@/lib/notification-service')
      notificationService.sendOutOfStockAlert(productId).catch((error: Error) => {
        console.error('Error sending out of stock alert:', error)
      })
    } else if (newStock > 0 && newStock <= product.lowStockThreshold && previousStock > product.lowStockThreshold) {
      // Stock just dropped below threshold - send low stock alert
      const { notificationService } = await import('@/lib/notification-service')
      notificationService.sendLowStockAlert(productId).catch((error: Error) => {
        console.error('Error sending low stock alert:', error)
      })
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      movement,
      message: `Stock ajusté: ${previousStock} → ${newStock}`,
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajustement du stock' },
      { status: 500 }
    )
  }
}
