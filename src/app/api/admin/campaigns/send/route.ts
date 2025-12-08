import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      name,
      channel,
      message,
      mediaUrl,
      template,
      targetType,
      customNumbers,
      createdBy,
      createdByName,
      metadata,
    } = body

    // Validate required fields
    if (!name || !channel || !message) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Get recipients
    let recipients: Array<{ phone: string; name?: string; userId?: string; email?: string; orderCount?: number; totalSpent?: number; lastOrderDate?: Date }> = []

    if (targetType === 'all') {
      // Fetch all customers
      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          phone: { not: '' },
        },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          orders: {
            select: {
              total: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      recipients = customers.map(c => ({
        phone: c.phone,
        name: c.name || undefined,
        userId: c.id,
        email: c.email || undefined,
        orderCount: c.orders.length,
        totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
        lastOrderDate: c.orders[0]?.createdAt,
      }))
    } else if (targetType === 'custom' && customNumbers) {
      // Use custom numbers
      recipients = customNumbers.map((phone: string) => ({
        phone: phone.trim(),
      }))
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Aucun destinataire trouvé' },
        { status: 400 }
      )
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        channel,
        message,
        mediaUrl: mediaUrl || undefined,
        template: template || undefined,
        targetType,
        customNumbers: targetType === 'custom' ? JSON.stringify(customNumbers) : undefined,
        segmentFilter: undefined,
        totalRecipients: recipients.length,
        sentCount: 0,
        failedCount: 0,
        status: 'sending',
        startedAt: new Date(),
        createdBy,
        createdByName,
      },
    })

    // Send messages asynchronously (don't wait for all to complete)
    sendCampaignMessages(campaign.id, channel, message, mediaUrl, template, recipients, metadata?.language || 'fr')
      .catch(err => console.error('Campaign send error:', err))

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      message: 'Campagne créée et envoi en cours',
    })
  } catch (error) {
    console.error('Campaign send error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la campagne' },
      { status: 500 }
    )
  }
}

// Async function to send messages to all recipients
async function sendCampaignMessages(
  campaignId: string,
  channel: string,
  messageTemplate: string,
  mediaUrl: string | undefined,
  template: string | undefined,
  recipients: Array<{ phone: string; name?: string; userId?: string; email?: string; orderCount?: number; totalSpent?: number; lastOrderDate?: Date }>,
  language: 'fr' | 'en'
) {
  let sentCount = 0
  let failedCount = 0

  // Store variables for replacement
  const storeVariables = {
    '{store_name}': 'CAVE EXPRESS',
    '{store_phone}': '+225 05 56 79 14 31',
    '{store_url}': 'https://cave-express.ci',
  }

  for (const recipient of recipients) {
    try {
      // Replace variables in message
      let finalMessage = messageTemplate

      // Replace customer-specific variables
      const customerVariables = {
        '{customer_name}': recipient.name || 'Client',
        '{customer_phone}': recipient.phone,
        '{customer_email}': recipient.email || '',
        '{order_count}': String(recipient.orderCount || 0),
        '{total_spent}': recipient.totalSpent ? `${Math.round(recipient.totalSpent)} CFA` : '0 CFA',
        '{last_order_date}': recipient.lastOrderDate ? new Date(recipient.lastOrderDate).toLocaleDateString('fr-FR') : '',
      }

      // Replace all variables
      Object.entries({ ...customerVariables, ...storeVariables }).forEach(([key, value]) => {
        finalMessage = finalMessage.replace(new RegExp(key, 'g'), value)
      })

      // Send based on channel
      let result

      if (channel === 'SMS') {
        result = await smsingService.sendSMS({
          to: recipient.phone,
          message: finalMessage,
        })
      } else if (channel === 'WHATSAPP') {
        result = await smsingService.sendWhatsAppBusiness({
          to: recipient.phone,
          message: finalMessage,
          mediaUrl,
        })
      } else if (channel === 'WHATSAPP_CLOUD') {
        // For WhatsApp Cloud, use template
        result = await smsingService.sendWhatsAppCloudOTP({
          to: recipient.phone,
          otpCode: finalMessage,
          language,
          useCustomTemplate: template === 'cave_express',
        })
      } else {
        throw new Error('Invalid channel')
      }

      // Create log
      await prisma.campaignLog.create({
        data: {
          campaignId,
          phone: recipient.phone,
          customerName: recipient.name || undefined,
          userId: recipient.userId || undefined,
          message: finalMessage,
          mediaUrl: mediaUrl || undefined,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error || undefined,
          providerId: result.messageId || undefined,
          providerResponse: result as any,
          sentAt: result.success ? new Date() : undefined,
        },
      })

      if (result.success) {
        sentCount++
      } else {
        failedCount++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error sending to', recipient.phone, error)
      failedCount++

      // Create failed log
      await prisma.campaignLog.create({
        data: {
          campaignId,
          phone: recipient.phone,
          customerName: recipient.name || undefined,
          userId: recipient.userId || undefined,
          message: messageTemplate,
          mediaUrl: mediaUrl || undefined,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }
  }

  // Update campaign with final stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount,
      failedCount,
      status: failedCount === recipients.length ? 'failed' : 'sent',
      completedAt: new Date(),
    },
  })
}
