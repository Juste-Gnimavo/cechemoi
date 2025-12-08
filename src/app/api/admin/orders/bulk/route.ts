import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// PUT /api/admin/orders/bulk - Bulk update orders
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { orderIds, action, value } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'IDs de commande requis' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 })
    }

    let updateData: any = {}
    let noteContent = ''

    switch (action) {
      case 'updateStatus':
        if (!value) {
          return NextResponse.json({ error: 'Statut requis' }, { status: 400 })
        }
        updateData = { status: value }
        noteContent = `Statut changé en ${value} (action groupée)`
        break

      case 'updatePaymentStatus':
        if (!value) {
          return NextResponse.json({ error: 'Statut de paiement requis' }, { status: 400 })
        }
        updateData = { paymentStatus: value }
        noteContent = `Statut de paiement changé en ${value} (action groupée)`
        break

      case 'markProcessing':
        updateData = { status: 'PROCESSING' }
        noteContent = 'Commande mise en traitement (action groupée)'
        break

      case 'markShipped':
        updateData = { status: 'SHIPPED' }
        noteContent = 'Commande marquée comme expédiée (action groupée)'
        break

      case 'markDelivered':
        updateData = { status: 'DELIVERED' }
        noteContent = 'Commande marquée comme livrée (action groupée)'
        break

      case 'markCancelled':
        updateData = { status: 'CANCELLED' }
        noteContent = 'Commande annulée (action groupée)'
        break

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 })
    }

    // Update all orders
    const updatedOrders = await prisma.order.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: updateData,
    })

    // Add notes to each order
    const notePromises = orderIds.map((orderId) =>
      prisma.orderNote.create({
        data: {
          orderId,
          content: noteContent,
          noteType: 'private',
          authorName: (session.user as any).name || 'Admin',
          authorId: (session.user as any).id,
        },
      })
    )

    await Promise.all(notePromises)

    // Send notifications if status changed
    if (action.includes('Status') || action.startsWith('mark')) {
      const { notificationService } = await import('@/lib/notification-service')
      const newStatus = updateData.status

      if (newStatus) {
        // Send appropriate notifications based on new status
        const notificationPromises = orderIds.map(async (orderId) => {
          try {
            switch (newStatus) {
              case 'SHIPPED':
                await notificationService.sendOrderShipped(orderId)
                break
              case 'DELIVERED':
                await notificationService.sendOrderDelivered(orderId)
                break
              case 'CANCELLED':
                await notificationService.sendOrderCancelled(orderId)
                break
            }
          } catch (error) {
            console.error(`Error sending notification for order ${orderId}:`, error)
          }
        })

        await Promise.allSettled(notificationPromises)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedOrders.count} commande(s) mise(s) à jour`,
      count: updatedOrders.count,
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'action groupée' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/orders/bulk - Bulk delete orders
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const body = await req.json()
    const { orderIds } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'IDs de commande requis' }, { status: 400 })
    }

    const deletedOrders = await prisma.order.deleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `${deletedOrders.count} commande(s) supprimée(s)`,
      count: deletedOrders.count,
    })
  } catch (error) {
    console.error('Error deleting orders:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des commandes' },
      { status: 500 }
    )
  }
}
