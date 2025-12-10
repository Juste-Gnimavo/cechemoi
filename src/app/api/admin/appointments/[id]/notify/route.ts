import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { type, customMessage } = body

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { type: true }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous non trouve' }, { status: 404 })
    }

    // Format date
    const formattedDate = appointment.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Prepare messages based on type
    let smsMessage = ''
    let whatsAppMessage = ''

    switch (type) {
      case 'confirmation':
        smsMessage = `Bonjour ${appointment.customerName},
Votre RDV du ${formattedDate} a ${appointment.time} est confirme!
Service: ${appointment.type.name}
Ref: ${appointment.reference}
A bientot chez CECHEMOI!`

        whatsAppMessage = `Bonjour ${appointment.customerName},

✅ Votre rendez-vous est confirmé !

📋 Réf: ${appointment.reference}
🎯 Service: ${appointment.type.name}
📅 Date: ${formattedDate}
⏰ Heure: ${appointment.time}

À bientôt chez CÈCHÉMOI !`
        break

      case 'reminder':
        smsMessage = `Rappel: RDV chez CECHEMOI
${appointment.customerName}, n'oubliez pas votre RDV!
Date: ${formattedDate}
Heure: ${appointment.time}
Service: ${appointment.type.name}
CECHEMOI`

        whatsAppMessage = `⏰ Rappel de rendez-vous

Bonjour ${appointment.customerName},

N'oubliez pas votre rendez-vous chez CÈCHÉMOI !

📅 Date: ${formattedDate}
⏰ Heure: ${appointment.time}
🎯 Service: ${appointment.type.name}

À très bientôt !`
        break

      case 'cancellation':
        smsMessage = `Bonjour ${appointment.customerName},
Nous regrettons de vous informer que votre RDV du ${formattedDate} a ${appointment.time} a ete annule.
Ref: ${appointment.reference}
Contactez-nous pour reprogrammer.
CECHEMOI`

        whatsAppMessage = `Bonjour ${appointment.customerName},

❌ Nous regrettons de vous informer que votre rendez-vous a été annulé.

📋 Réf: ${appointment.reference}
📅 Date prévue: ${formattedDate} à ${appointment.time}
🎯 Service: ${appointment.type.name}

Contactez-nous pour reprogrammer votre rendez-vous.

CÈCHÉMOI`
        break

      case 'custom':
        if (!customMessage) {
          return NextResponse.json({ error: 'Message requis' }, { status: 400 })
        }
        // For custom messages, add greeting and signature
        smsMessage = `Bonjour ${appointment.customerName},
${customMessage}
CECHEMOI`

        whatsAppMessage = `Bonjour ${appointment.customerName},

${customMessage}

CÈCHÉMOI`
        break

      default:
        return NextResponse.json({ error: 'Type de notification invalide' }, { status: 400 })
    }

    // Send both SMS and WhatsApp in parallel
    const [smsResult, whatsappResult] = await Promise.all([
      smsingService.sendSMS({ to: appointment.customerPhone, message: smsMessage }),
      smsingService.sendWhatsAppBusiness({ to: appointment.customerPhone, message: whatsAppMessage })
    ])

    // Log the notification (using SMS channel for logging purposes)
    await prisma.notificationLog.create({
      data: {
        trigger: 'CUSTOMER_NOTE',
        channel: 'SMS',
        recipientPhone: appointment.customerPhone,
        recipientName: appointment.customerName,
        content: `[APPOINTMENT ${type.toUpperCase()}] ${smsMessage}`,
        status: smsResult.success || whatsappResult.success ? 'sent' : 'failed'
      }
    }).catch(() => {
      // Ignore logging errors
    })

    return NextResponse.json({
      success: true,
      channels: {
        sms: smsResult.success,
        whatsapp: whatsappResult.success
      }
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
