import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reports/schedules/[id] - Get a single schedule
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schedule = await prisma.reportSchedule.findUnique({
      where: { id: params.id },
      include: {
        report: true,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Planification non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la planification' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/reports/schedules/[id] - Update a schedule
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      recipients,
      format,
      enabled,
    } = body

    // Check if schedule exists
    const existingSchedule = await prisma.reportSchedule.findUnique({
      where: { id: params.id },
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Planification non trouvée' },
        { status: 404 }
      )
    }

    // Recalculate next run if schedule params changed
    let nextRun = existingSchedule.nextRun
    if (frequency || dayOfWeek !== undefined || dayOfMonth !== undefined || time) {
      nextRun = calculateNextRun(
        frequency || existingSchedule.frequency,
        dayOfWeek !== undefined ? dayOfWeek : existingSchedule.dayOfWeek,
        dayOfMonth !== undefined ? dayOfMonth : existingSchedule.dayOfMonth,
        time || existingSchedule.time
      )
    }

    const schedule = await prisma.reportSchedule.update({
      where: { id: params.id },
      data: {
        ...(frequency && { frequency }),
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(dayOfMonth !== undefined && { dayOfMonth }),
        ...(time && { time }),
        ...(recipients && { recipients }),
        ...(format && { format }),
        ...(enabled !== undefined && { enabled }),
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
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la planification' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/reports/schedules/[id] - Delete a schedule
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if schedule exists
    const schedule = await prisma.reportSchedule.findUnique({
      where: { id: params.id },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Planification non trouvée' },
        { status: 404 }
      )
    }

    await prisma.reportSchedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Planification supprimée avec succès',
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la planification' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next run time
function calculateNextRun(
  frequency: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  time?: string
): Date {
  const now = new Date()
  const [hours, minutes] = (time || '09:00').split(':').map(Number)

  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break

    case 'weekly':
      const targetDay = dayOfWeek || 0
      let daysToAdd = targetDay - nextRun.getDay()
      if (daysToAdd < 0 || (daysToAdd === 0 && nextRun <= now)) {
        daysToAdd += 7
      }
      nextRun.setDate(nextRun.getDate() + daysToAdd)
      break

    case 'monthly':
      const targetDate = dayOfMonth || 1
      nextRun.setDate(targetDate)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
  }

  return nextRun
}
