/**
 * Payment Follow-up Settings API
 *
 * GET /api/admin/notifications/follow-up - Get follow-up settings
 * PUT /api/admin/notifications/follow-up - Update follow-up settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - Fetch payment follow-up settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get or create default settings
    let settings = await prisma.paymentFollowUpSettings.findFirst()

    if (!settings) {
      settings = await prisma.paymentFollowUpSettings.create({
        data: {
          id: 'default',
          enabled: true,
          reminder1Delay: 24,   // 1 day
          reminder2Delay: 72,   // 3 days
          reminder3Delay: 120,  // 5 days
          reminder1Enabled: true,
          reminder2Enabled: true,
          reminder3Enabled: true,
        },
      })
    }

    // Get scheduled notifications stats
    const [pendingCount, sentCount, cancelledCount] = await Promise.all([
      prisma.scheduledNotification.count({
        where: {
          status: 'pending',
          trigger: { in: ['PAYMENT_REMINDER_1', 'PAYMENT_REMINDER_2', 'PAYMENT_REMINDER_3'] },
        },
      }),
      prisma.scheduledNotification.count({
        where: {
          status: 'sent',
          trigger: { in: ['PAYMENT_REMINDER_1', 'PAYMENT_REMINDER_2', 'PAYMENT_REMINDER_3'] },
        },
      }),
      prisma.scheduledNotification.count({
        where: {
          status: 'cancelled',
          trigger: { in: ['PAYMENT_REMINDER_1', 'PAYMENT_REMINDER_2', 'PAYMENT_REMINDER_3'] },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      settings,
      stats: {
        pending: pendingCount,
        sent: sentCount,
        cancelled: cancelledCount,
      },
    })
  } catch (error) {
    console.error('Error fetching follow-up settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

// PUT - Update payment follow-up settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      enabled,
      reminder1Delay,
      reminder2Delay,
      reminder3Delay,
      reminder1Enabled,
      reminder2Enabled,
      reminder3Enabled,
    } = body

    // Validate delays
    if (reminder1Delay !== undefined && (reminder1Delay < 1 || reminder1Delay > 168)) {
      return NextResponse.json(
        { error: 'Le délai du rappel 1 doit être entre 1 et 168 heures' },
        { status: 400 }
      )
    }
    if (reminder2Delay !== undefined && (reminder2Delay < 1 || reminder2Delay > 336)) {
      return NextResponse.json(
        { error: 'Le délai du rappel 2 doit être entre 1 et 336 heures' },
        { status: 400 }
      )
    }
    if (reminder3Delay !== undefined && (reminder3Delay < 1 || reminder3Delay > 504)) {
      return NextResponse.json(
        { error: 'Le délai du rappel 3 doit être entre 1 et 504 heures' },
        { status: 400 }
      )
    }

    const settings = await prisma.paymentFollowUpSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(reminder1Delay !== undefined && { reminder1Delay }),
        ...(reminder2Delay !== undefined && { reminder2Delay }),
        ...(reminder3Delay !== undefined && { reminder3Delay }),
        ...(reminder1Enabled !== undefined && { reminder1Enabled }),
        ...(reminder2Enabled !== undefined && { reminder2Enabled }),
        ...(reminder3Enabled !== undefined && { reminder3Enabled }),
      },
      create: {
        id: 'default',
        enabled: enabled ?? true,
        reminder1Delay: reminder1Delay ?? 24,
        reminder2Delay: reminder2Delay ?? 72,
        reminder3Delay: reminder3Delay ?? 120,
        reminder1Enabled: reminder1Enabled ?? true,
        reminder2Enabled: reminder2Enabled ?? true,
        reminder3Enabled: reminder3Enabled ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      settings,
      message: 'Paramètres mis à jour avec succès',
    })
  } catch (error) {
    console.error('Error updating follow-up settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    )
  }
}
