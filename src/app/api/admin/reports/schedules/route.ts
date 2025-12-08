import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reports/schedules - Get all report schedules
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schedules = await prisma.reportSchedule.findMany({
      include: {
        report: true,
      },
      orderBy: {
        nextRun: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      schedules,
    })
  } catch (error) {
    console.error('Error fetching report schedules:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des planifications' },
      { status: 500 }
    )
  }
}

// POST /api/admin/reports/schedules - Create a report schedule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      reportId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      recipients,
      format,
      enabled,
    } = body

    // Validate required fields
    if (!reportId || !frequency || !time || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Rapport, fréquence, heure et destinataires requis' },
        { status: 400 }
      )
    }

    // Calculate next run time
    const nextRun = calculateNextRun(frequency, dayOfWeek, dayOfMonth, time)

    const schedule = await prisma.reportSchedule.create({
      data: {
        reportId,
        frequency,
        dayOfWeek: dayOfWeek || null,
        dayOfMonth: dayOfMonth || null,
        time,
        recipients,
        format: format || 'pdf',
        enabled: enabled !== false,
        nextRun,
      },
      include: {
        report: true,
      },
    })

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Error creating report schedule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la planification' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next run time
function calculateNextRun(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  time?: string
): Date {
  const now = new Date()
  const [hours, minutes] = (time || '09:00').split(':').map(Number)

  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case 'daily':
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break

    case 'weekly':
      // Find next occurrence of the specified day
      const targetDay = dayOfWeek || 0
      let daysToAdd = targetDay - nextRun.getDay()
      if (daysToAdd < 0 || (daysToAdd === 0 && nextRun <= now)) {
        daysToAdd += 7
      }
      nextRun.setDate(nextRun.getDate() + daysToAdd)
      break

    case 'monthly':
      // Find next occurrence of the specified day of month
      const targetDate = dayOfMonth || 1
      nextRun.setDate(targetDate)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
  }

  return nextRun
}
