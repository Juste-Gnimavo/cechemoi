import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/tailors/[id] - Get a single tailor
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const tailor = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'TAILOR',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    })

    if (!tailor) {
      return NextResponse.json({ error: 'Couturier non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true, tailor })
  } catch (error) {
    console.error('Error fetching tailor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/tailors/[id] - Update a tailor
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
    const { name, phone, email } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nom et téléphone requis' }, { status: 400 })
    }

    // Check if tailor exists
    const existingTailor = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'TAILOR',
      },
    })

    if (!existingTailor) {
      return NextResponse.json({ error: 'Couturier non trouvé' }, { status: 404 })
    }

    // Check if phone is taken by another tailor
    if (phone !== existingTailor.phone) {
      const phoneTaken = await prisma.user.findFirst({
        where: {
          phone,
          role: 'TAILOR',
          id: { not: params.id },
        },
      })

      if (phoneTaken) {
        return NextResponse.json({ error: 'Ce numéro est déjà utilisé par un autre couturier' }, { status: 400 })
      }
    }

    // Check if email is taken by another tailor
    if (email && email !== existingTailor.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email,
          role: 'TAILOR',
          id: { not: params.id },
        },
      })

      if (emailTaken) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre couturier' }, { status: 400 })
      }
    }

    // Update tailor
    const tailor = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email: email || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      tailor,
      message: 'Couturier mis à jour',
    })
  } catch (error) {
    console.error('Error updating tailor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/tailors/[id] - Delete a tailor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if tailor exists
    const tailor = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'TAILOR',
      },
      include: {
        tailorAssignments: {
          where: {
            status: { notIn: ['COMPLETED', 'DELIVERED'] },
          },
        },
      },
    })

    if (!tailor) {
      return NextResponse.json({ error: 'Couturier non trouvé' }, { status: 404 })
    }

    // Check if tailor has active assignments
    if (tailor.tailorAssignments.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un couturier avec des travaux en cours' },
        { status: 400 }
      )
    }

    // Delete tailor
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Couturier supprimé',
    })
  } catch (error) {
    console.error('Error deleting tailor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
