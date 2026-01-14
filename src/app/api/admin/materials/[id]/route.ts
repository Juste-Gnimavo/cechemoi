import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/materials/[id] - Get a single material with history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const includeHistory = searchParams.get('history') === 'true'

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        category: true,
        movements: includeHistory
          ? {
              include: {
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
              take: 50,
            }
          : false,
        _count: {
          select: { movements: true },
        },
      },
    })

    if (!material) {
      return NextResponse.json({ error: 'Matériel non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        movementsCount: material._count.movements,
        isLowStock: material.lowStockThreshold > 0 && material.stock <= material.lowStockThreshold,
      },
    })
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/materials/[id] - Update a material
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      name,
      sku,
      categoryId,
      unit,
      unitPrice,
      lowStockThreshold,
      description,
      supplier,
      color,
    } = body

    // Check if material exists
    const existing = await prisma.material.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Matériel non trouvé' }, { status: 404 })
    }

    // Check SKU uniqueness if changing
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.material.findUnique({
        where: { sku },
      })
      if (skuExists) {
        return NextResponse.json({ error: 'Ce SKU existe déjà' }, { status: 400 })
      }
    }

    // Check category if changing
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.materialCategory.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 400 })
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        sku: sku !== undefined ? (sku || null) : existing.sku,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        unit: unit !== undefined ? unit : existing.unit,
        unitPrice: unitPrice !== undefined ? unitPrice : existing.unitPrice,
        lowStockThreshold:
          lowStockThreshold !== undefined ? lowStockThreshold : existing.lowStockThreshold,
        description: description !== undefined ? (description || null) : existing.description,
        supplier: supplier !== undefined ? (supplier || null) : existing.supplier,
        color: color !== undefined ? (color || null) : existing.color,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      material,
      message: 'Matériel mis à jour',
    })
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/materials/[id] - Soft delete a material
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Check if material exists
    const existing = await prisma.material.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Matériel non trouvé' }, { status: 404 })
    }

    // Soft delete - just mark as inactive
    await prisma.material.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Matériel supprimé',
    })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
