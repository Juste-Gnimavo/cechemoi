import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/team/[id]/activity - Get team member activity
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all' // week, month, all

    // Calculate date filter
    let dateFilter: Date | undefined
    const now = new Date()
    if (period === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get team member
    const member = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        image: true,
      },
    })

    if (!member || !['ADMIN', 'MANAGER', 'STAFF'].includes(member.role)) {
      return NextResponse.json({ error: 'Membre non trouve' }, { status: 404 })
    }

    // Build date where clause
    const dateWhere = dateFilter ? { gte: dateFilter } : undefined

    // Get stats in parallel
    const [
      customOrdersCreated,
      customOrdersValue,
      customersCreated,
      paymentsReceived,
      measurementsTaken,
      recentOrders,
      recentPayments,
      recentCustomers,
    ] = await Promise.all([
      // Custom orders created count
      prisma.customOrder.count({
        where: {
          createdById: id,
          ...(dateWhere ? { orderDate: dateWhere } : {}),
        },
      }),
      // Custom orders total value
      prisma.customOrder.aggregate({
        where: {
          createdById: id,
          ...(dateWhere ? { orderDate: dateWhere } : {}),
        },
        _sum: { totalCost: true },
      }),
      // Customers created count
      prisma.user.count({
        where: {
          createdByStaffId: id,
          role: 'CUSTOMER',
          ...(dateWhere ? { createdAt: dateWhere } : {}),
        },
      }),
      // Payments received
      prisma.customOrderPayment.aggregate({
        where: {
          receivedById: id,
          ...(dateWhere ? { paidAt: dateWhere } : {}),
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Measurements taken count
      prisma.customerMeasurement.count({
        where: {
          takenByStaffId: id,
          ...(dateWhere ? { measurementDate: dateWhere } : {}),
        },
      }),
      // Recent custom orders (last 10)
      prisma.customOrder.findMany({
        where: {
          createdById: id,
          ...(dateWhere ? { orderDate: dateWhere } : {}),
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          priority: true,
          totalCost: true,
          orderDate: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { orderDate: 'desc' },
        take: 10,
      }),
      // Recent payments received (last 10)
      prisma.customOrderPayment.findMany({
        where: {
          receivedById: id,
          ...(dateWhere ? { paidAt: dateWhere } : {}),
        },
        select: {
          id: true,
          amount: true,
          paymentType: true,
          paymentMethod: true,
          paidAt: true,
          customOrder: {
            select: {
              id: true,
              orderNumber: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
      // Recent customers created (last 10)
      prisma.user.findMany({
        where: {
          createdByStaffId: id,
          role: 'CUSTOMER',
          ...(dateWhere ? { createdAt: dateWhere } : {}),
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      success: true,
      member,
      stats: {
        customOrdersCreated,
        customOrdersValue: customOrdersValue._sum.totalCost || 0,
        customersCreated,
        paymentsReceived: paymentsReceived._count || 0,
        paymentsValue: paymentsReceived._sum.amount || 0,
        measurementsTaken,
      },
      recentOrders,
      recentPayments,
      recentCustomers,
      period,
    })
  } catch (error) {
    console.error('Error fetching team member activity:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
