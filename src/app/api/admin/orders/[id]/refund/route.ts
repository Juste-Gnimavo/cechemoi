import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/orders/[id]/refund - Process refund
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, reason, refundType = 'full' } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        refunds: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Calculate total refunded amount
    const totalRefunded = order.refunds.reduce((sum, refund) => {
      return refund.status === 'processed' ? sum + refund.amount : sum
    }, 0)

    // Validate refund amount
    if (totalRefunded + amount > order.total) {
      return NextResponse.json(
        { error: 'Le montant du remboursement dépasse le total de la commande' },
        { status: 400 }
      )
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        orderId: params.id,
        amount,
        reason: reason || 'Aucune raison fournie',
        refundType,
        processedBy: (session.user as any).id,
        status: 'processed',
        processedAt: new Date(),
      },
    })

    // Update order status
    const isFullRefund = totalRefunded + amount >= order.total
    await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: isFullRefund ? 'REFUNDED' : order.paymentStatus,
        status: isFullRefund ? 'REFUNDED' : order.status,
      },
    })

    // Add system note
    await prisma.orderNote.create({
      data: {
        orderId: params.id,
        content: `Remboursement ${refundType} de ${Math.round(amount)} CFA traité. Raison: ${reason || 'Non spécifiée'}`,
        noteType: 'private',
        authorName: (session.user as any).name || 'Admin',
        authorId: (session.user as any).id,
      },
    })

    // Restore stock for refunded items (full refund only)
    if (isFullRefund) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    }

    // Send refund notification to customer (don't await to avoid blocking)
    notificationService.sendOrderRefunded(params.id).catch((error) => {
      console.error('Error sending refund notification:', error)
    })

    return NextResponse.json({ success: true, refund })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du remboursement' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders/[id]/refund - Get refund history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const refunds = await prisma.refund.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, refunds })
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des remboursements' },
      { status: 500 }
    )
  }
}
