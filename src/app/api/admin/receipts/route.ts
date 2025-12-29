import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/receipts - List receipts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const today = searchParams.get('today') === 'true'
    const customOrderId = searchParams.get('customOrderId')
    const invoiceId = searchParams.get('invoiceId')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
      ]
    }

    if (today) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      where.paymentDate = {
        gte: startOfDay,
        lte: endOfDay,
      }
    } else if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) {
        where.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate + 'T23:59:59')
      }
    }

    if (customOrderId) {
      where.customOrderId = customOrderId
    }

    if (invoiceId) {
      where.invoiceId = invoiceId
    }

    // Get receipts with pagination
    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          customOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ])

    // Calculate stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [todayStats, weekStats, monthStats] = await Promise.all([
      prisma.receipt.aggregate({
        where: {
          paymentDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.receipt.aggregate({
        where: {
          paymentDate: {
            gte: weekStart,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.receipt.aggregate({
        where: {
          paymentDate: {
            gte: monthStart,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      success: true,
      receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        today: {
          count: todayStats._count,
          total: todayStats._sum.amount || 0,
        },
        week: {
          count: weekStats._count,
          total: weekStats._sum.amount || 0,
        },
        month: {
          count: monthStats._count,
          total: monthStats._sum.amount || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
