import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/production - Get all items for Kanban board
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tailorId = searchParams.get('tailorId')

    // Build where clause
    const where: any = {
      customOrder: {
        status: {
          notIn: ['DELIVERED', 'CANCELLED'],
        },
      },
    }

    // Filter by tailor if specified or if user is TAILOR
    if ((session.user as any).role === 'TAILOR') {
      where.tailorId = (session.user as any).id
    } else if (tailorId) {
      where.tailorId = tailorId
    }

    // Get all items with order and customer info
    const items = await prisma.customOrderItem.findMany({
      where,
      include: {
        customOrder: {
          select: {
            id: true,
            orderNumber: true,
            pickupDate: true,
            priority: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        tailor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { customOrder: { priority: 'desc' } }, // VIP first, then URGENT, then NORMAL
        { customOrder: { pickupDate: 'asc' } }, // Earliest pickup first
        { createdAt: 'asc' },
      ],
    })

    // Group items by status
    const columns: Record<string, any[]> = {
      PENDING: [],
      CUTTING: [],
      SEWING: [],
      FITTING: [],
      ALTERATIONS: [],
      FINISHING: [],
      COMPLETED: [],
    }

    items.forEach((item) => {
      if (columns[item.status]) {
        columns[item.status].push(item)
      }
    })

    // Get tailors for filter
    const tailors = await prisma.user.findMany({
      where: { role: 'TAILOR' },
      select: {
        id: true,
        name: true,
        tailorAssignments: {
          where: {
            status: {
              notIn: ['COMPLETED', 'DELIVERED'],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Calculate stats
    const stats = {
      total: items.length,
      byStatus: Object.entries(columns).map(([status, statusItems]) => ({
        status,
        count: statusItems.length,
      })),
      urgent: items.filter((i) => i.customOrder.priority !== 'NORMAL').length,
      unassigned: items.filter((i) => !i.tailorId).length,
    }

    return NextResponse.json({
      success: true,
      columns,
      tailors: tailors.map((t) => ({
        id: t.id,
        name: t.name,
        activeItems: t.tailorAssignments.length,
      })),
      stats,
    })
  } catch (error) {
    console.error('Error fetching production items:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
