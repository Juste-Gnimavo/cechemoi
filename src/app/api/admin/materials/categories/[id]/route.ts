import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/materials/categories/[id] - Get a single category
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

    const category = await prisma.materialCategory.findUnique({
      where: { id },
      include: {
        materials: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { materials: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      category: {
        ...category,
        materialsCount: category._count.materials,
      },
    })
  } catch (error) {
    console.error('Error fetching material category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/materials/categories/[id] - Update a category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, sortOrder } = body

    // Check if category exists
    const existing = await prisma.materialCategory.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Check if new name already exists (if changing name)
    if (name && name !== existing.name) {
      const nameExists = await prisma.materialCategory.findUnique({
        where: { name },
      })
      if (nameExists) {
        return NextResponse.json({ error: 'Ce nom de catégorie existe déjà' }, { status: 400 })
      }
    }

    const category = await prisma.materialCategory.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
      },
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Catégorie mise à jour',
    })
  } catch (error) {
    console.error('Error updating material category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/materials/categories/[id] - Delete a category
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

    // Check if category exists
    const existing = await prisma.materialCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Check if category has materials
    if (existing._count.materials > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer: cette catégorie contient des matériels' },
        { status: 400 }
      )
    }

    // Don't allow deleting default categories
    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une catégorie par défaut' },
        { status: 400 }
      )
    }

    await prisma.materialCategory.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Catégorie supprimée',
    })
  } catch (error) {
    console.error('Error deleting material category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
