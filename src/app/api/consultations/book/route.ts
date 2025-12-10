import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'

// Generate unique reference
function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'RDV-'
  result += new Date().getFullYear() + '-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      serviceId,
      date,
      time,
      customerName,
      customerPhone,
      customerEmail,
      customerNotes
    } = body

    // Validate required fields
    if (!serviceId || !date || !time || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      )
    }

    // Get service details
    const service = await prisma.consultationType.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service de consultation non trouvé' },
        { status: 404 }
      )
    }

    // Check if slot is still available
    const appointmentDate = new Date(date)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate,
        time,
        status: { notIn: ['CANCELLED'] }
      }
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Ce créneau n\'est plus disponible. Veuillez en choisir un autre.' },
        { status: 400 }
      )
    }

    // Generate unique reference
    let reference = generateReference()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.appointment.findUnique({
        where: { reference }
      })
      if (!existing) break
      reference = generateReference()
      attempts++
    }

    // Search for existing customer by phone + CUSTOMER role
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: customerPhone,
        role: 'CUSTOMER'
      }
    })

    // Create appointment (linked to user if found)
    const appointment = await prisma.appointment.create({
      data: {
        reference,
        typeId: serviceId,
        userId: existingUser?.id || null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        customerNotes: customerNotes || null,
        date: appointmentDate,
        time,
        duration: service.duration,
        price: service.price,
        status: 'PENDING',
        paymentStatus: service.price === 0 ? 'PAID' : 'UNPAID'
      },
      include: {
        type: true
      }
    })

    // Format date for notification
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const priceText = service.price > 0
      ? `${service.price.toLocaleString('fr-FR')} FCFA`
      : 'Sur devis'

    // Send customer notification (SMS + WhatsApp simultaneously)
    const customerMessage = `Bonjour ${customerName},

Votre rendez-vous chez CECHEMOI est enregistre !

Ref: ${reference}
Service: ${service.name}
Date: ${formattedDate}
Heure: ${time}
Prix: ${priceText}

Vous recevrez une confirmation definitive sous peu.

CECHEMOI - Originalite, Creativite et Beaute`

    // WhatsApp version with emojis
    const customerWhatsAppMessage = `Bonjour ${customerName},

Votre rendez-vous chez CÈCHÉMOI est enregistré !

📋 Référence: ${reference}
🎯 Service: ${service.name}
📅 Date: ${formattedDate}
⏰ Heure: ${time}
💰 Prix: ${priceText}

Vous recevrez une confirmation définitive sous peu.

CÈCHÉMOI - Originalité, Créativité et Beauté`

    // Send to customer (both SMS + WhatsApp in parallel)
    Promise.all([
      smsingService.sendSMS({ to: customerPhone, message: customerMessage }),
      smsingService.sendWhatsAppBusiness({ to: customerPhone, message: customerWhatsAppMessage })
    ]).catch(err => console.error('Failed to send customer notification:', err))

    // Send admin notification (SMS + WhatsApp simultaneously)
    const adminPhone = process.env.ADMIN_PHONE || '2250759545410'

    const adminSmsMessage = `NOUVEAU RDV - Ref: ${reference}
Client: ${customerName} (${customerPhone})
Service: ${service.name}
Date: ${formattedDate} a ${time}
Prix: ${priceText}
${customerNotes ? `Notes: ${customerNotes}` : ''}`

    const adminWhatsAppMessage = `🗓️ NOUVEAU RENDEZ-VOUS

Réf: ${reference}
Client: ${customerName}
Tél: ${customerPhone}
Service: ${service.name}
Date: ${formattedDate} à ${time}
Prix: ${priceText}

${customerNotes ? `Notes: ${customerNotes}` : ''}

Confirmez dans l'admin: /admin/appointments`

    // Send to admin (both SMS + WhatsApp in parallel)
    Promise.all([
      smsingService.sendSMS({ to: adminPhone, message: adminSmsMessage }),
      smsingService.sendWhatsAppBusiness({ to: adminPhone, message: adminWhatsAppMessage })
    ]).catch(err => console.error('Failed to send admin notification:', err))

    return NextResponse.json({
      success: true,
      reference: appointment.reference,
      appointment: {
        id: appointment.id,
        reference: appointment.reference,
        date: appointment.date,
        time: appointment.time,
        service: service.name,
        price: service.price
      }
    })
  } catch (error) {
    console.error('Error booking appointment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
