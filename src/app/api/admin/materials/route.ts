import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/materials - List all materials with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const lowStock = searchParams.get('lowStock') === 'true'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Low stock filter - materials where stock <= lowStockThreshold
    if (lowStock) {
      where.AND = [
        {
          lowStockThreshold: { gt: 0 },
        },
        {
          stock: {
            lte: prisma.material.fields.lowStockThreshold,
          },
        },
      ]
    }

    const [materials, total, lowStockCount] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { movements: true },
          },
        },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
      // Count materials with low stock
      prisma.material.count({
        where: {
          isActive: true,
          lowStockThreshold: { gt: 0 },
        },
      }),
    ])

    // Get low stock materials separately for accurate count
    const lowStockMaterials = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Material"
      WHERE "isActive" = true
      AND "lowStockThreshold" > 0
      AND "stock" <= "lowStockThreshold"
    ` as any[]

    // For materials with unitPrice = 0, get the latest movement unitPrice as fallback
    const materialsWithZeroPrice = materials.filter((m) => m.unitPrice === 0)
    const movementPriceMap = new Map<string, number>()

    if (materialsWithZeroPrice.length > 0) {
      const zeroIds = materialsWithZeroPrice.map((m) => m.id)
      const latestPrices = (await prisma.$queryRaw`
        SELECT DISTINCT ON ("materialId") "materialId", "unitPrice"
        FROM "MaterialMovement"
        WHERE "materialId" = ANY(${zeroIds})
        AND "unitPrice" > 0
        ORDER BY "materialId", "createdAt" DESC
      `) as { materialId: string; unitPrice: number }[]

      for (const row of latestPrices) {
        movementPriceMap.set(row.materialId, row.unitPrice)
        // Also fix the material's unitPrice in the database for future queries
        prisma.material
          .update({
            where: { id: row.materialId },
            data: { unitPrice: row.unitPrice },
          })
          .catch(() => {})
      }
    }

    // Apply effective unit prices
    const materialsWithPrices = materials.map((m) => {
      const effectiveUnitPrice =
        m.unitPrice > 0 ? m.unitPrice : movementPriceMap.get(m.id) || 0
      return { ...m, unitPrice: effectiveUnitPrice }
    })

    // Calculate stats
    const totalValue = materialsWithPrices.reduce(
      (sum, m) => sum + m.stock * m.unitPrice,
      0
    )

    return NextResponse.json({
      success: true,
      materials: materialsWithPrices.map((m) => ({
        ...m,
        movementsCount: m._count.movements,
        isLowStock: m.lowStockThreshold > 0 && m.stock <= m.lowStockThreshold,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        lowStock: Number(lowStockMaterials[0]?.count || 0),
        totalValue,
      },
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/materials - Create a new material
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      sku,
      categoryId,
      unit,
      unitPrice,
      stock,
      lowStockThreshold,
      description,
      supplier,
      color,
    } = body

    if (!name || !categoryId || !unit) {
      return NextResponse.json(
        { error: 'Nom, catégorie et unité sont requis' },
        { status: 400 }
      )
    }

    // Check category exists
    const category = await prisma.materialCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 400 })
    }

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = await prisma.material.findUnique({
        where: { sku },
      })
      if (existingSku) {
        return NextResponse.json({ error: 'Ce SKU existe déjà' }, { status: 400 })
      }
    }

    const material = await prisma.material.create({
      data: {
        name,
        sku: sku || null,
        categoryId,
        unit,
        unitPrice: unitPrice || 0,
        stock: stock || 0,
        lowStockThreshold: lowStockThreshold || 0,
        description: description || null,
        supplier: supplier || null,
        color: color || null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    // If initial stock > 0, create an IN movement
    if (stock && stock > 0) {
      await prisma.materialMovement.create({
        data: {
          materialId: material.id,
          type: 'IN',
          quantity: stock,
          unitPrice: unitPrice || 0,
          totalCost: stock * (unitPrice || 0),
          previousStock: 0,
          newStock: stock,
          createdById: (session.user as any).id,
          createdByName: (session.user as any).name || 'Admin',
          notes: 'Stock initial',
        },
      })
    }

    return NextResponse.json({
      success: true,
      material,
      message: 'Matériel créé avec succès',
    })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
