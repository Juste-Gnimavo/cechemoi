import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/notifications/send - Send a quick notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { recipient, message, channel } = body

    // Validation
    if (!recipient || !message || !channel) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validate channel
    const validChannels = ['WHATSAPP', 'SMS', 'WHATSAPP_CLOUD']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: 'Canal de notification invalide' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[0-9\s\-()]+$/
    if (!phoneRegex.test(recipient)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      )
    }

    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanRecipient = recipient.replace(/[\s\-()]/g, '')

    let result: any = { success: false, error: 'Unknown error' }

    try {
      // Send notification via selected channel
      if (channel === 'SMS') {
        result = await smsingService.sendSMS({
          to: cleanRecipient,
          message,
        })
      } else if (channel === 'WHATSAPP') {
        result = await smsingService.sendWhatsAppBusiness({
          to: cleanRecipient,
          message,
        })
      } else if (channel === 'WHATSAPP_CLOUD') {
        // For WhatsApp Cloud, we need to use a template
        // For now, we'll use a simple message format
        // In production, you would need to create approved templates
        return NextResponse.json(
          {
            error: 'WhatsApp Cloud nécessite des templates approuvés. Veuillez utiliser WhatsApp ou SMS pour les messages personnalisés.',
          },
          { status: 400 }
        )
      }

      // Log the notification
      await prisma.notificationLog.create({
        data: {
          trigger: 'NEW_ACCOUNT', // Using a placeholder trigger for manual sends
          channel: channel as any,
          recipientPhone: cleanRecipient,
          content: message,
          status: result.success ? 'sent' : 'failed',
          providerId: result.messageId || result.groupId,
          errorMessage: result.error,
          sentAt: result.success ? new Date() : null,
        },
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Notification envoyée avec succès',
          details: {
            channel,
            recipient: cleanRecipient,
            messageId: result.messageId || result.groupId,
          },
        })
      } else {
        return NextResponse.json(
          {
            error: 'Erreur lors de l\'envoi de la notification',
            details: result.error,
          },
          { status: 500 }
        )
      }
    } catch (notificationError: any) {
      // Log failed notification
      await prisma.notificationLog.create({
        data: {
          trigger: 'NEW_ACCOUNT',
          channel: channel as any,
          recipientPhone: cleanRecipient,
          content: message,
          status: 'failed',
          errorMessage: notificationError.message || 'Unknown error',
        },
      })

      return NextResponse.json(
        {
          error: 'Erreur lors de l\'envoi de la notification',
          details: notificationError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
