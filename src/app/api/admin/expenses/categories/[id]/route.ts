import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/expenses/categories/[id] - Get single category
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

    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
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
        expensesCount: category._count.expenses,
        _count: undefined,
      },
    })
  } catch (error) {
    console.error('Error fetching expense category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/expenses/categories/[id] - Update category
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
    const { name, description, icon, color, sortOrder } = body

    // Check if category exists
    const existing = await prisma.expenseCategory.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Check if new name is already taken by another category
    if (name && name !== existing.name) {
      const nameExists = await prisma.expenseCategory.findUnique({
        where: { name },
      })
      if (nameExists) {
        return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 })
      }
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        icon: icon || existing.icon,
        color: color || existing.color,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
      },
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Catégorie mise à jour',
    })
  } catch (error) {
    console.error('Error updating expense category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/expenses/categories/[id] - Delete category
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
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Check if there are expenses linked to this category
    if (category._count.expenses > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: cette catégorie contient ${category._count.expenses} dépense(s)` },
        { status: 400 }
      )
    }

    await prisma.expenseCategory.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Catégorie supprimée',
    })
  } catch (error) {
    console.error('Error deleting expense category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
