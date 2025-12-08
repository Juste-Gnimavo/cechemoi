/**
 * Standalone Payment Notification Helper
 * Handles SMS/WhatsApp notifications for standalone payments (/payer/ flow)
 */

import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'
import { NotificationChannel } from '@prisma/client'

/**
 * Send notification for standalone payment (success or failure)
 * @param paymentId - StandalonePayment ID
 * @param isSuccess - Whether payment was successful
 */
export async function sendStandalonePaymentNotification(
  paymentId: string,
  isSuccess: boolean
): Promise<void> {
  try {
    // Get payment details
    const payment = await prisma.standalonePayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      console.error('[StandaloneNotif] Payment not found:', paymentId)
      return
    }

    // Get notification settings
    const settings = await prisma.notificationSettings.findFirst()
    if (!settings) {
      console.error('[StandaloneNotif] Notification settings not found')
      return
    }

    // Determine trigger type
    const trigger = isSuccess ? 'STANDALONE_PAYMENT_RECEIVED' : 'STANDALONE_PAYMENT_FAILED'

    // Get recipient phone
    const recipient = settings.testMode && settings.testPhoneNumber
      ? settings.testPhoneNumber
      : payment.customerPhone

    // Format amount
    const formattedAmount = payment.amount.toLocaleString('fr-FR')

    // Build template variables
    const variables = {
      customer_name: payment.customerName,
      amount: formattedAmount,
      reference: payment.reference,
      store_name: 'Cave Express',
      store_phone: '+225 0707517917',
    }

    // Channels to try
    const channelsToSend: NotificationChannel[] = []
    if (settings.smsEnabled) channelsToSend.push('SMS')
    if (settings.whatsappEnabled) channelsToSend.push('WHATSAPP')

    // Send via each enabled channel
    const sendPromises = channelsToSend.map(async (channel) => {
      // Fetch template for this trigger and channel
      const template = await prisma.notificationTemplate.findUnique({
        where: { trigger_channel: { trigger, channel } },
      })

      if (!template || !template.enabled) {
        console.log(`[StandaloneNotif] Template not found or disabled for ${trigger} - ${channel}`)
        return { channel, success: false, error: 'Template not found' }
      }

      // Render template with variables
      let content = template.content
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g')
        content = content.replace(regex, String(value || ''))
      }

      // Send via appropriate channel
      let result: { success: boolean; messageId?: string }

      if (channel === 'SMS') {
        result = await smsingService.sendSMS({
          to: recipient,
          message: content,
        })
      } else if (channel === 'WHATSAPP') {
        result = await smsingService.sendWhatsAppBusiness({
          to: recipient,
          message: content,
        })
      } else {
        result = { success: false }
      }

      // Log notification
      await prisma.notificationLog.create({
        data: {
          trigger,
          channel,
          recipientPhone: recipient,
          recipientName: payment.customerName,
          content,
          status: result.success ? 'sent' : 'failed',
          providerId: result.messageId,
          sentAt: result.success ? new Date() : null,
        },
      })

      console.log(`[StandaloneNotif] ${channel}=${result.success} for ${trigger}`)

      return { channel, ...result }
    })

    const results = await Promise.all(sendPromises)
    const anySuccess = results.some((r) => r.success)

    // Update payment notification status
    if (anySuccess) {
      await prisma.standalonePayment.update({
        where: { id: paymentId },
        data: {
          notificationSent: true,
          notificationSentAt: new Date(),
        },
      })
    }

    console.log(`[StandaloneNotif] Notification sent for ${payment.reference}: success=${anySuccess}`)
  } catch (error) {
    console.error('[StandaloneNotif] Error:', error)
  }
}

/**
 * Resend notification for a standalone payment (admin action)
 * @param paymentId - StandalonePayment ID
 */
export async function resendStandalonePaymentNotification(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = await prisma.standalonePayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    const isSuccess = payment.status === 'COMPLETED'
    await sendStandalonePaymentNotification(paymentId, isSuccess)

    return { success: true }
  } catch (error) {
    console.error('[StandaloneNotif] Resend error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
