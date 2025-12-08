import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Helper to get notification title based on trigger
function getNotificationTitle(trigger: string): string {
  const titles: Record<string, string> = {
    ORDER_PLACED: 'Commande confirmée',
    PAYMENT_RECEIVED: 'Paiement reçu',
    ORDER_SHIPPED: 'Commande expédiée',
    ORDER_DELIVERED: 'Commande livrée',
    ORDER_CANCELLED: 'Commande annulée',
    ORDER_REFUNDED: 'Remboursement effectué',
    PAYMENT_FAILED: 'Échec de paiement',
    INVOICE_CREATED: 'Facture disponible',
    INVOICE_PAID: 'Facture payée',
    LOYALTY_POINTS_EARNED: 'Points fidélité gagnés',
    CUSTOMER_NOTE: 'Message du service client',
    PAYMENT_REMINDER: 'Rappel de paiement',
  }
  return titles[trigger] || 'Notification'
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause - only show customer notifications (not admin ones)
    const where: any = {
      userId,
      status: 'sent', // Only show successfully sent notifications
    }

    // Fetch notifications from NotificationLog with pagination
    const [notificationLogs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          trigger: true,
          channel: true,
          content: true,
          orderId: true,
          createdAt: true,
          sentAt: true,
        },
      }),
      prisma.notificationLog.count({ where }),
    ])

    // Transform to notification format for frontend
    const notifications = notificationLogs.map(log => ({
      id: log.id,
      title: getNotificationTitle(log.trigger),
      message: log.content,
      type: log.trigger,
      channel: log.channel,
      orderId: log.orderId,
      read: true, // NotificationLog doesn't track read status
      createdAt: log.createdAt,
      sentAt: log.sentAt,
    }))

    return NextResponse.json({
      notifications,
      unreadCount: 0, // NotificationLog doesn't track read status
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === 'mark_all_read') {
      // NotificationLog doesn't track read status, so just return success
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
