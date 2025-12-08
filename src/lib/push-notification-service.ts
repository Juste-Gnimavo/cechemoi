import { prisma } from '@/lib/prisma'
import type { NotificationTrigger, PushTargetType, PushCampaignStatus, PushDeliveryStatus } from '@prisma/client'

// Firebase Admin SDK types (optional - if firebase-admin is installed)
let firebaseAdmin: any = null
let messaging: any = null

// Initialize Firebase Admin (lazy loading)
async function initializeFirebase() {
  if (firebaseAdmin) return true

  try {
    // Try to get Firebase config from database first, then fall back to env vars
    const settings = await prisma.notificationSettings.findFirst() as any

    let projectId = settings?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID
    let clientEmail = settings?.firebaseClientEmail || process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = settings?.firebasePrivateKey || process.env.FIREBASE_PRIVATE_KEY

    if (!projectId || !clientEmail || !privateKey) {
      console.log('[Push] Firebase not configured (check NotificationSettings or env vars)')
      console.log('[Push] Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
      return false
    }

    // Dynamic import to avoid build-time dependency
    // @ts-ignore - firebase-admin is an optional dependency
    const admin = await import('firebase-admin').catch(() => null)
    if (!admin) {
      console.log('[Push] firebase-admin not installed')
      return false
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
    }

    firebaseAdmin = admin
    messaging = admin.messaging()
    console.log('[Push] Firebase initialized successfully')
    return true
  } catch (error) {
    console.error('[Push] Failed to initialize Firebase:', error)
    return false
  }
}

interface PushNotification {
  title: string
  body: string
  imageUrl?: string
  deepLink?: string
  data?: Record<string, string>
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Push Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 */
export class PushNotificationService {
  /**
   * Send push notification to a single device
   */
  async sendToDevice(token: string, notification: PushNotification): Promise<SendResult> {
    const initialized = await initializeFirebase()
    if (!initialized || !messaging) {
      return { success: false, error: 'Firebase not initialized' }
    }

    try {
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          ...notification.data,
          deepLink: notification.deepLink || '',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'default',
            priority: 'high' as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }

      const response = await messaging.send(message)
      return { success: true, messageId: response }
    } catch (error: any) {
      console.error('[Push] Error sending to device:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToDevices(tokens: string[], notification: PushNotification): Promise<{ success: number; failed: number }> {
    const initialized = await initializeFirebase()
    if (!initialized || !messaging) {
      return { success: 0, failed: tokens.length }
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          ...notification.data,
          deepLink: notification.deepLink || '',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'default',
            priority: 'high' as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }

      const response = await messaging.sendEachForMulticast({
        tokens,
        ...message,
      })

      return {
        success: response.successCount,
        failed: response.failureCount,
      }
    } catch (error: any) {
      console.error('[Push] Error sending to devices:', error)
      return { success: 0, failed: tokens.length }
    }
  }

  /**
   * Send push notification to a user (all their devices)
   */
  async sendToUser(userId: string, notification: PushNotification): Promise<{ success: number; failed: number }> {
    const devices = await prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    })

    if (devices.length === 0) {
      return { success: 0, failed: 0 }
    }

    const tokens = devices.map(d => d.token)
    return this.sendToDevices(tokens, notification)
  }

  /**
   * Send push notification based on trigger (uses template)
   */
  async sendByTrigger(
    trigger: NotificationTrigger,
    userId: string,
    variables: Record<string, string>
  ): Promise<{ success: number; failed: number }> {
    // Get push template content from any SMS or WhatsApp template
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        trigger,
        pushTitle: { not: null },
        pushBody: { not: null },
      },
    })

    if (!template || !template.pushTitle || !template.pushBody) {
      console.log(`[Push] No push template found for trigger: ${trigger}`)
      return { success: 0, failed: 0 }
    }

    // Render template with variables
    let title = template.pushTitle
    let body = template.pushBody

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      title = title.replace(regex, value)
      body = body.replace(regex, value)
    }

    return this.sendToUser(userId, { title, body })
  }

  /**
   * Send campaign to all targeted users
   */
  async sendCampaign(campaignId: string): Promise<{ success: number; failed: number }> {
    const campaign = await prisma.pushCampaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Update campaign status
    await prisma.pushCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    })

    try {
      // Get target users based on targeting type
      let userIds: string[] = []

      switch (campaign.targetType) {
        case 'ALL_USERS':
          const allUsers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            select: { id: true },
          })
          userIds = allUsers.map(u => u.id)
          break

        case 'SPECIFIC_USERS':
          userIds = campaign.targetUserIds
          break

        case 'BY_TIER':
          if (campaign.targetTier) {
            const tierUsers = await prisma.loyaltyPoints.findMany({
              where: { tier: campaign.targetTier as any },
              select: { userId: true },
            })
            userIds = tierUsers.map(u => u.userId)
          }
          break

        case 'BY_LOCATION':
          if (campaign.targetCity) {
            const locationUsers = await prisma.user.findMany({
              where: { city: campaign.targetCity, role: 'CUSTOMER' },
              select: { id: true },
            })
            userIds = locationUsers.map(u => u.id)
          }
          break
      }

      // Get all device tokens for target users
      const devices = await prisma.deviceToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
      })

      if (devices.length === 0) {
        await prisma.pushCampaign.update({
          where: { id: campaignId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            totalSent: 0,
          },
        })
        return { success: 0, failed: 0 }
      }

      // Create notification logs for each device
      const logs = devices.map(device => ({
        campaignId,
        userId: device.userId,
        deviceToken: device.token,
        status: 'PENDING' as PushDeliveryStatus,
      }))

      await prisma.pushNotificationLog.createMany({ data: logs })

      // Send notifications in batches of 500
      const batchSize = 500
      let totalSuccess = 0
      let totalFailed = 0

      for (let i = 0; i < devices.length; i += batchSize) {
        const batch = devices.slice(i, i + batchSize)
        const tokens = batch.map(d => d.token)

        const result = await this.sendToDevices(tokens, {
          title: campaign.title,
          body: campaign.body,
          imageUrl: campaign.imageUrl || undefined,
          deepLink: campaign.deepLink || undefined,
        })

        totalSuccess += result.success
        totalFailed += result.failed

        // Update logs status (simplified - in production, track individual results)
        await prisma.pushNotificationLog.updateMany({
          where: {
            campaignId,
            deviceToken: { in: tokens },
          },
          data: {
            status: result.success > 0 ? 'SENT' : 'FAILED',
          },
        })
      }

      // Update campaign stats
      await prisma.pushCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          totalSent: totalSuccess,
        },
      })

      console.log(`[Push] Campaign ${campaignId} sent: ${totalSuccess} success, ${totalFailed} failed`)
      return { success: totalSuccess, failed: totalFailed }
    } catch (error: any) {
      console.error('[Push] Error sending campaign:', error)
      await prisma.pushCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      })
      throw error
    }
  }

  /**
   * Register a device token for push notifications
   */
  async registerDevice(
    userId: string,
    token: string,
    platform: 'IOS' | 'ANDROID' | 'WEB',
    deviceInfo?: {
      deviceModel?: string
      osVersion?: string
      appVersion?: string
    }
  ): Promise<void> {
    await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        isActive: true,
        lastUsedAt: new Date(),
        ...deviceInfo,
      },
      create: {
        userId,
        token,
        platform,
        isActive: true,
        ...deviceInfo,
      },
    })
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(token: string): Promise<void> {
    await prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    })
  }

  /**
   * Get user's registered devices
   */
  async getUserDevices(userId: string) {
    return prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      orderBy: { lastUsedAt: 'desc' },
    })
  }

  /**
   * Clean up inactive tokens (older than 30 days)
   */
  async cleanupInactiveTokens(): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.deviceToken.deleteMany({
      where: {
        lastUsedAt: { lt: thirtyDaysAgo },
      },
    })

    console.log(`[Push] Cleaned up ${result.count} inactive tokens`)
    return result.count
  }
}

export const pushNotificationService = new PushNotificationService()
