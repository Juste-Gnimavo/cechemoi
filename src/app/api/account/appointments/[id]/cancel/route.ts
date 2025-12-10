import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'
import { smsingService } from '@/lib/smsing-service'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    // Find appointment and verify ownership
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
      include: { type: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Rendez-vous non trouve' },
        { status: 404 }
      )
    }

    // Only allow cancellation of PENDING or CONFIRMED appointments
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Ce rendez-vous ne peut plus etre annule' },
        { status: 400 }
      )
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'customer',
        adminNotes: reason ? `Raison client: ${reason}` : null
      },
      include: { type: true }
    })

    // Format date for notification
    const formattedDate = appointment.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Send notification to admin (SMS + WhatsApp)
    const adminPhone = process.env.ADMIN_PHONE || '2250759545410'

    const adminSmsMessage = `ANNULATION RDV
${appointment.customerName} a annule
Ref: ${appointment.reference}
Service: ${appointment.type.name}
Date: ${formattedDate} a ${appointment.time}
${reason ? `Raison: ${reason}` : ''}`

    const adminWhatsAppMessage = `❌ ANNULATION DE RENDEZ-VOUS

Le client ${appointment.customerName} a annulé son rendez-vous.

📋 Réf: ${appointment.reference}
🎯 Service: ${appointment.type.name}
📅 Date prévue: ${formattedDate} à ${appointment.time}
📱 Tél: ${appointment.customerPhone}

${reason ? `💬 Raison: ${reason}` : ''}

Ce créneau est maintenant disponible.`

    // Send to admin (both SMS + WhatsApp in parallel)
    Promise.all([
      smsingService.sendSMS({ to: adminPhone, message: adminSmsMessage }),
      smsingService.sendWhatsAppBusiness({ to: adminPhone, message: adminWhatsAppMessage })
    ]).catch(err => console.error('Failed to send cancellation notification:', err))

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment
    })
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
