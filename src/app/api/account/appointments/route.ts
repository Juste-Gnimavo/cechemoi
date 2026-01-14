import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const where: any = { userId }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { date: 'desc' },
        include: {
          type: {
            select: {
              name: true,
              color: true,
              duration: true
            }
          }
        }
      }),
      prisma.appointment.count({ where })
    ])

    // Get stats
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.appointment.count({ where: { userId, status: 'PENDING' } }),
      prisma.appointment.count({ where: { userId, status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { userId, status: 'CANCELLED' } })
    ])

    return NextResponse.json({
      appointments,
      stats: {
        pending,
        confirmed,
        completed,
        cancelled,
        total
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
