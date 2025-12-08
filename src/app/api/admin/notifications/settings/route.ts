import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/notifications/settings - Get notification settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const settings = await prisma.notificationSettings.findFirst()

    if (!settings) {
      return NextResponse.json({ error: 'Paramètres non trouvés' }, { status: 404 })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/notifications/settings - Update notification settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const body = await req.json()
    const {
      adminPhones,
      adminWhatsApp,
      adminEmails,
      smsProvider,
      smsApiKey,
      smsSenderId,
      whatsappProvider,
      whatsappApiKey,
      whatsappPhoneId,
      emailProvider,
      emailApiKey,
      emailFromAddress,
      emailFromName,
      smsEnabled,
      whatsappEnabled,
      emailEnabled,
      failoverEnabled,
      failoverOrder,
      testMode,
      testPhoneNumber,
    } = body

    // Get the first (and only) settings record
    const existingSettings = await prisma.notificationSettings.findFirst()

    if (!existingSettings) {
      return NextResponse.json({ error: 'Paramètres non trouvés' }, { status: 404 })
    }

    const settings = await prisma.notificationSettings.update({
      where: { id: existingSettings.id },
      data: {
        ...(adminPhones && { adminPhones }),
        ...(adminWhatsApp !== undefined && { adminWhatsApp }),
        ...(adminEmails && { adminEmails }),
        ...(smsProvider && { smsProvider }),
        ...(smsApiKey !== undefined && { smsApiKey }),
        ...(smsSenderId !== undefined && { smsSenderId }),
        ...(whatsappProvider && { whatsappProvider }),
        ...(whatsappApiKey !== undefined && { whatsappApiKey }),
        ...(whatsappPhoneId !== undefined && { whatsappPhoneId }),
        ...(emailProvider && { emailProvider }),
        ...(emailApiKey !== undefined && { emailApiKey }),
        ...(emailFromAddress !== undefined && { emailFromAddress }),
        ...(emailFromName !== undefined && { emailFromName }),
        ...(smsEnabled !== undefined && { smsEnabled }),
        ...(whatsappEnabled !== undefined && { whatsappEnabled }),
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(failoverEnabled !== undefined && { failoverEnabled }),
        ...(failoverOrder && { failoverOrder }),
        ...(testMode !== undefined && { testMode }),
        ...(testPhoneNumber !== undefined && { testPhoneNumber }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    )
  }
}
