import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * Cron Job: Abandoned Cart Reminders
 * Run every hour to check for abandoned carts (1 hour after last update)
 *
 * Setup with Vercel Cron or external cron service:
 * Schedule: 0 every-hour * * *
 * curl https://yourapp.com/api/cron/abandoned-cart?secret=YOUR_SECRET_KEY
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Find carts abandoned 1 hour ago (not updated in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          lte: oneHourAgo,
        },
        items: {
          some: {}, // Has items
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log(`[Cron] Found ${abandonedCarts.length} abandoned carts`)

    let sentCount = 0

    for (const cart of abandonedCarts) {
      try {
        // Check if we already sent a reminder recently (last 24 hours)
        const recentReminder = await prisma.notificationLog.findFirst({
          where: {
            userId: cart.userId,
            trigger: 'ABANDONED_CART',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        })

        if (recentReminder) {
          console.log(`[Cron] Skipping user ${cart.userId} - reminder sent recently`)
          continue
        }

        // Calculate cart total
        const cartTotal = cart.items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )

        // Prepare cart items list
        const cartItemsList = cart.items
          .map((item) => `${item.product.name} (${item.quantity}x)`)
          .join('\n')

        // Send abandoned cart reminder
        await notificationService.sendAbandonedCartReminder(
          cart.user.whatsappNumber || cart.user.phone,
          cart.user.name || 'Client',
          cart.items.length,
          cartItemsList,
          `${Math.round(cartTotal)} CFA`
        )

        sentCount++
      } catch (error) {
        console.error(`[Cron] Error sending reminder for cart ${cart.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} abandoned cart reminders`,
      processed: abandonedCarts.length,
      sent: sentCount,
    })
  } catch (error) {
    console.error('[Cron] Abandoned cart error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement des paniers abandonnés' },
      { status: 500 }
    )
  }
}
