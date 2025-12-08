import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/orders/[id] - Fetch order details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappNumber: true,
            email: true,
          },
        },
        shippingAddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                sku: true,
              },
            },
          },
        },
        orderNotes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        refunds: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            issueDate: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] - Update order (status, tracking, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { status, paymentStatus, trackingNumber, notes, sendNotification, orderDate } = body

    // Fetch current order to compare status
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(notes !== undefined && { notes }),
        ...(orderDate && { createdAt: new Date(orderDate) }),
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    })

    // Add system note for status change
    if (status && status !== currentOrder.status) {
      await prisma.orderNote.create({
        data: {
          orderId: params.id,
          content: `Statut de commande changé de ${currentOrder.status} à ${status}`,
          noteType: 'private',
          authorName: (session.user as any).name || 'Admin',
          authorId: (session.user as any).id,
        },
      })

      // Send notifications based on status change (only if notifications are enabled)
      if (sendNotification !== false) {
        switch (status) {
          case 'PROCESSING':
            // Order accepted - notify customer that order is being processed
            notificationService.sendOrderPlaced(params.id).catch((error) => {
              console.error('Error sending processing notification:', error)
            })
            break
          case 'SHIPPED':
            // Send shipped notification
            notificationService.sendOrderShipped(params.id, trackingNumber).catch((error) => {
              console.error('Error sending shipped notification:', error)
            })
            break
          case 'DELIVERED':
            // Send delivered notification
            notificationService.sendOrderDelivered(params.id).catch((error) => {
              console.error('Error sending delivered notification:', error)
            })
            // Schedule review request for 24 hours after delivery
            notificationService.scheduleReviewRequest(params.id).catch((error) => {
              console.error('Error scheduling review request:', error)
            })
            break
          case 'CANCELLED':
            notificationService.sendOrderCancelled(params.id).catch((error) => {
              console.error('Error sending cancelled notification:', error)
            })
            // Cancel any pending payment reminders
            notificationService.cancelPaymentReminders(params.id).catch((error) => {
              console.error('Error cancelling payment reminders:', error)
            })
            break
        }
      }
    }

    // Add system note for payment status change
    if (paymentStatus && paymentStatus !== currentOrder.paymentStatus) {
      await prisma.orderNote.create({
        data: {
          orderId: params.id,
          content: `Statut de paiement changé de ${currentOrder.paymentStatus} à ${paymentStatus}`,
          noteType: 'private',
          authorName: (session.user as any).name || 'Admin',
          authorId: (session.user as any).id,
        },
      })

      // Handle payment status marked as completed
      if (paymentStatus === 'COMPLETED') {
        // Get invoice for URL
        const invoice = await prisma.invoice.findFirst({
          where: { orderId: params.id },
        })

        // Update invoice status to PAID
        if (invoice) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID', paidDate: new Date() },
          })
        }

        // Send notifications only if enabled
        if (sendNotification !== false) {
          const baseUrl = process.env.NEXTAUTH_URL || 'https://cave-express.ci'
          const invoiceUrl = invoice
            ? `${baseUrl}/api/invoices/${invoice.id}/pdf`
            : `${baseUrl}/account/orders/${params.id}`

          // Send payment received notification
          notificationService.sendPaymentReceived(params.id, invoiceUrl).catch((error) => {
            console.error('Error sending payment received notification:', error)
          })

          // Send invoice paid notification
          notificationService.sendInvoicePaid(params.id, invoiceUrl).catch((error) => {
            console.error('Error sending invoice paid notification:', error)
          })

          // Send invoice PDF attachment via WhatsApp
          notificationService.sendInvoicePdfPaid(params.id, invoiceUrl).catch((error) => {
            console.error('Error sending invoice PDF attachment:', error)
          })

          // Cancel any pending payment reminders
          notificationService.cancelPaymentReminders(params.id).catch((error) => {
            console.error('Error cancelling payment reminders:', error)
          })
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la commande' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/orders/[id] - Delete order with all related data (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        invoice: true,
        payment: true,
        scheduledNotifications: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Delete related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related invoice if exists (with its items and payments - cascade)
      if (order.invoice) {
        await tx.invoice.delete({
          where: { id: order.invoice.id },
        })
      }

      // Delete related payment if exists
      if (order.payment) {
        await tx.payment.delete({
          where: { id: order.payment.id },
        })
      }

      // Delete scheduled notifications
      if (order.scheduledNotifications.length > 0) {
        await tx.scheduledNotification.deleteMany({
          where: { orderId: params.id },
        })
      }

      // Delete order (cascade deletes: OrderItem, OrderNote, Refund)
      await tx.order.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Commande et données associées supprimées avec succès'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la commande' },
      { status: 500 }
    )
  }
}
