import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/audit - Get custom orders audit data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const staffId = searchParams.get('staffId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate + 'T23:59:59')
    }

    // Build where clause
    const where: any = {}
    if (Object.keys(dateFilter).length > 0) {
      where.orderDate = dateFilter
    }
    if (staffId) {
      where.createdById = staffId
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.customOrder.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          priority: true,
          totalCost: true,
          materialCost: true,
          orderDate: true,
          pickupDate: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { items: true, payments: true },
          },
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customOrder.count({ where }),
    ])

    // Get staff statistics
    const staffStats = await prisma.customOrder.groupBy({
      by: ['createdById'],
      where,
      _count: true,
      _sum: { totalCost: true },
    })

    // Get staff names
    const staffIds = staffStats.map((s) => s.createdById).filter(Boolean) as string[]
    const staffMembers = await prisma.user.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true },
    })

    const staffMap = new Map(staffMembers.map((s) => [s.id, s.name]))

    const staffStatsWithNames = staffStats
      .map((s) => ({
        staffId: s.createdById,
        staffName: staffMap.get(s.createdById!) || 'Inconnu',
        ordersCount: s._count,
        totalValue: s._sum.totalCost || 0,
        avgValue: s._count > 0 ? Math.round((s._sum.totalCost || 0) / s._count) : 0,
      }))
      .sort((a, b) => b.ordersCount - a.ordersCount)

    // Get totals
    const totals = await prisma.customOrder.aggregate({
      where,
      _count: true,
      _sum: { totalCost: true },
    })

    // Get all staff members for filter dropdown
    const allStaff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER', 'STAFF'] },
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      staffStats: staffStatsWithNames,
      totals: {
        orders: totals._count,
        value: totals._sum.totalCost || 0,
        avgValue: totals._count > 0 ? Math.round((totals._sum.totalCost || 0) / totals._count) : 0,
      },
      allStaff,
    })
  } catch (error) {
    console.error('Error fetching custom orders audit:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
