import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        type: {
          select: {
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      take: limit,
      skip: (page - 1) * limit
    })

    // Get stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const [pending, confirmed, completedToday, totalThisWeek] = await Promise.all([
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.appointment.count({
        where: {
          date: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      })
    ])

    return NextResponse.json({
      appointments,
      stats: {
        pending,
        confirmed,
        completedToday,
        totalThisWeek
      }
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, paymentStatus, adminNotes, paymentMethod, paidAmount } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === 'CONFIRMED') {
        updateData.confirmedAt = new Date()
        updateData.confirmedBy = session.user.id
      } else if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
        updateData.completedBy = session.user.id
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = session.user.id
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        type: true
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
