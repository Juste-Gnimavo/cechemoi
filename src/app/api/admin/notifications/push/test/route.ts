import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { pushNotificationService } from '@/lib/push-notification-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/notifications/push/test
 * Send a test push notification to a specific device
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await req.json()
    const { token, title, body: messageBody } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token FCM requis' },
        { status: 400 }
      )
    }

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Titre et corps du message requis' },
        { status: 400 }
      )
    }

    // Send test notification
    const result = await pushNotificationService.sendToDevice(token, {
      title,
      body: messageBody,
      data: {
        type: 'TEST',
        timestamp: new Date().toISOString(),
      },
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Notification test envoyee avec succes',
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi',
      })
    }
  } catch (error: any) {
    console.error('[API] Error sending test push:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
