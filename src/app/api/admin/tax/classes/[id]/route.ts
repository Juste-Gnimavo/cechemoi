import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/tax/classes/[id] - Get a single tax class
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const taxClass = await prisma.taxClass.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!taxClass) {
      return NextResponse.json(
        { error: 'Classe de taxe non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      class: taxClass,
    })
  } catch (error) {
    console.error('Error fetching tax class:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la classe' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/tax/classes/[id] - Update a tax class
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, rate, enabled } = body

    // Check if class exists
    const existingClass = await prisma.taxClass.findUnique({
      where: { id: params.id },
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Classe de taxe non trouvée' },
        { status: 404 }
      )
    }

    // Validate rate if provided
    if (rate !== undefined && rate !== null && (rate < 0 || rate > 100)) {
      return NextResponse.json(
        { error: 'Le taux doit être entre 0 et 100' },
        { status: 400 }
      )
    }

    // Check if name already exists (if changing name)
    if (name && name !== existingClass.name) {
      const duplicate = await prisma.taxClass.findUnique({
        where: { name },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Une classe avec ce nom existe déjà' },
          { status: 400 }
        )
      }
    }

    const taxClass = await prisma.taxClass.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(rate !== undefined && { rate }),
        ...(enabled !== undefined && { enabled }),
      },
    })

    return NextResponse.json({
      success: true,
      class: taxClass,
    })
  } catch (error) {
    console.error('Error updating tax class:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la classe' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tax/classes/[id] - Delete a tax class
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if class exists
    const taxClass = await prisma.taxClass.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!taxClass) {
      return NextResponse.json(
        { error: 'Classe de taxe non trouvée' },
        { status: 404 }
      )
    }

    // Check if class is used by products
    if (taxClass._count.products > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette classe. ${taxClass._count.products} produit(s) l'utilisent.`,
        },
        { status: 400 }
      )
    }

    await prisma.taxClass.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Classe de taxe supprimée avec succès',
    })
  } catch (error) {
    console.error('Error deleting tax class:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la classe' },
      { status: 500 }
    )
  }
}
