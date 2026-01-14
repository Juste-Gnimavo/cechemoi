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
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { date, time } = body

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date et heure requises' },
        { status: 400 }
      )
    }

    // Find appointment and verify ownership
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
      include: { type: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Rendez-vous non trouvé' },
        { status: 404 }
      )
    }

    // Only allow rescheduling of PENDING or CONFIRMED appointments
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Ce rendez-vous ne peut plus être modifié' },
        { status: 400 }
      )
    }

    const newDate = new Date(date)

    // Check if new slot is available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: newDate,
        time,
        status: { notIn: ['CANCELLED'] },
        id: { not: id } // Exclude current appointment
      }
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Ce créneau n\'est plus disponible' },
        { status: 400 }
      )
    }

    // Store old date/time for notification
    const oldDate = appointment.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const oldTime = appointment.time

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: newDate,
        time,
        status: 'PENDING', // Reset to pending for re-confirmation
        confirmedAt: null,
        confirmedBy: null
      },
      include: { type: true }
    })

    // Format new date for notification
    const newFormattedDate = newDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Send notification to admin (SMS + WhatsApp)
    const adminPhone = process.env.ADMIN_PHONE || '2250759545410'

    const adminSmsMessage = `REPORT RDV
${appointment.customerName} a reporté
Ref: ${appointment.reference}
Avant: ${oldDate} à ${oldTime}
Après: ${newFormattedDate} à ${time}
À confirmer`

    const adminWhatsAppMessage = `🔄 REPORT DE RENDEZ-VOUS

Le client ${appointment.customerName} a reporté son rendez-vous.

📋 Réf: ${appointment.reference}
🎯 Service: ${appointment.type.name}
📱 Tél: ${appointment.customerPhone}

📅 Ancienne date: ${oldDate} à ${oldTime}
📅 Nouvelle date: ${newFormattedDate} à ${time}

⚠️ À confirmer dans l'admin`

    // Send to admin (both SMS + WhatsApp in parallel)
    Promise.all([
      smsingService.sendSMS({ to: adminPhone, message: adminSmsMessage }),
      smsingService.sendWhatsAppBusiness({ to: adminPhone, message: adminWhatsAppMessage })
    ]).catch(err => console.error('Failed to send reschedule notification:', err))

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment
    })
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
