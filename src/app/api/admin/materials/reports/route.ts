import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Helper to get date range based on period
function getDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date()
  let start: Date
  let end: Date = new Date(now)
  end.setHours(23, 59, 59, 999)

  switch (period) {
    case 'today':
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      start = new Date(now)
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setHours(23, 59, 59, 999)
      break
    case 'week':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'year':
      start = new Date(now)
      start.setFullYear(start.getFullYear() - 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(now)
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
      }
      break
    default:
      start = new Date(now)
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
  }

  return { start, end }
}

// GET /api/admin/materials/reports - Get reports and stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const { start, end } = getDateRange(period, startDate, endDate)

    // Base where clause for the period
    const periodWhere = {
      createdAt: {
        gte: start,
        lte: end,
      },
    }

    // Get overall stats for the period
    const [totalIn, totalOut, outByTailor, outByCategory, topMaterials, recentMovements] =
      await Promise.all([
        // Total entries
        prisma.materialMovement.aggregate({
          where: {
            ...periodWhere,
            type: 'IN',
          },
          _sum: {
            totalCost: true,
            quantity: true,
          },
          _count: true,
        }),

        // Total exits
        prisma.materialMovement.aggregate({
          where: {
            ...periodWhere,
            type: 'OUT',
          },
          _sum: {
            totalCost: true,
            quantity: true,
          },
          _count: true,
        }),

        // Exits by tailor
        prisma.materialMovement.groupBy({
          by: ['tailorId'],
          where: {
            ...periodWhere,
            type: 'OUT',
            tailorId: { not: null },
          },
          _sum: {
            totalCost: true,
            quantity: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              totalCost: 'desc',
            },
          },
          take: 10,
        }),

        // Exits by category (via material)
        prisma.$queryRaw`
          SELECT
            mc.id as "categoryId",
            mc.name as "categoryName",
            COUNT(mm.id) as count,
            SUM(mm."totalCost") as "totalCost",
            SUM(mm.quantity) as "totalQuantity"
          FROM "MaterialMovement" mm
          JOIN "Material" m ON mm."materialId" = m.id
          JOIN "MaterialCategory" mc ON m."categoryId" = mc.id
          WHERE mm."createdAt" >= ${start}
            AND mm."createdAt" <= ${end}
            AND mm.type = 'OUT'
          GROUP BY mc.id, mc.name
          ORDER BY "totalCost" DESC
        ` as Promise<any[]>,

        // Top used materials
        prisma.materialMovement.groupBy({
          by: ['materialId'],
          where: {
            ...periodWhere,
            type: 'OUT',
          },
          _sum: {
            totalCost: true,
            quantity: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              totalCost: 'desc',
            },
          },
          take: 10,
        }),

        // Recent movements
        prisma.materialMovement.findMany({
          where: periodWhere,
          include: {
            material: {
              select: { id: true, name: true, unit: true },
            },
            tailor: {
              select: { id: true, name: true },
            },
            customOrder: {
              select: { id: true, orderNumber: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ])

    // Get tailor details for the grouped results
    const tailorIds = outByTailor.map((t) => t.tailorId).filter(Boolean) as string[]
    const tailors = await prisma.user.findMany({
      where: { id: { in: tailorIds } },
      select: { id: true, name: true, phone: true },
    })
    const tailorMap = new Map(tailors.map((t) => [t.id, t]))

    // Get material details for the grouped results
    const materialIds = topMaterials.map((m) => m.materialId)
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, unit: true, category: { select: { name: true } } },
    })
    const materialMap = new Map(materials.map((m) => [m.id, m]))

    // Current stock status
    const stockStatus = await prisma.material.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
        unit: true,
        unitPrice: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    })

    const lowStockItems = stockStatus.filter(
      (m) => m.lowStockThreshold > 0 && m.stock <= m.lowStockThreshold
    )

    return NextResponse.json({
      success: true,
      period: {
        type: period,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        entries: {
          count: totalIn._count,
          totalCost: totalIn._sum.totalCost || 0,
          totalQuantity: totalIn._sum.quantity || 0,
        },
        exits: {
          count: totalOut._count,
          totalCost: totalOut._sum.totalCost || 0,
          totalQuantity: totalOut._sum.quantity || 0,
        },
        lowStockCount: lowStockItems.length,
        totalMaterials: stockStatus.length,
        totalStockValue: stockStatus.reduce((sum, m) => sum + m.stock * m.unitPrice, 0),
      },
      byTailor: outByTailor.map((t) => ({
        tailor: tailorMap.get(t.tailorId!),
        count: t._count,
        totalCost: t._sum.totalCost || 0,
        totalQuantity: t._sum.quantity || 0,
      })),
      byCategory: outByCategory.map((c: any) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        count: Number(c.count),
        totalCost: Number(c.totalCost) || 0,
        totalQuantity: Number(c.totalQuantity) || 0,
      })),
      topMaterials: topMaterials.map((m) => ({
        material: materialMap.get(m.materialId),
        count: m._count,
        totalCost: m._sum.totalCost || 0,
        totalQuantity: m._sum.quantity || 0,
      })),
      lowStockItems,
      recentMovements,
    })
  } catch (error) {
    console.error('Error generating materials report:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
