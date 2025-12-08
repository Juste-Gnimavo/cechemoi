import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/tax/rates/[id] - Get a single tax rate
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const rate = await prisma.taxRate.findUnique({
      where: { id: params.id },
    })

    if (!rate) {
      return NextResponse.json(
        { error: 'Taux de taxe non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      rate,
    })
  } catch (error) {
    console.error('Error fetching tax rate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du taux' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/tax/rates/[id] - Update a tax rate
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
    const { country, state, rate, name, enabled, isDefault, applyToShipping, priority } = body

    // Check if rate exists
    const existingRate = await prisma.taxRate.findUnique({
      where: { id: params.id },
    })

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Taux de taxe non trouvé' },
        { status: 404 }
      )
    }

    // Validate rate if provided
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      return NextResponse.json(
        { error: 'Le taux doit être entre 0 et 100' },
        { status: 400 }
      )
    }

    // If this is set as default, unset any existing default
    if (isDefault && !existingRate.isDefault) {
      await prisma.taxRate.updateMany({
        where: {
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const taxRate = await prisma.taxRate.update({
      where: { id: params.id },
      data: {
        ...(country && { country }),
        ...(state !== undefined && { state }),
        ...(rate !== undefined && { rate }),
        ...(name && { name }),
        ...(enabled !== undefined && { enabled }),
        ...(isDefault !== undefined && { isDefault }),
        ...(applyToShipping !== undefined && { applyToShipping }),
        ...(priority !== undefined && { priority }),
      },
    })

    return NextResponse.json({
      success: true,
      rate: taxRate,
    })
  } catch (error) {
    console.error('Error updating tax rate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du taux' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tax/rates/[id] - Delete a tax rate
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if rate exists
    const rate = await prisma.taxRate.findUnique({
      where: { id: params.id },
    })

    if (!rate) {
      return NextResponse.json(
        { error: 'Taux de taxe non trouvé' },
        { status: 404 }
      )
    }

    // Prevent deleting the default rate
    if (rate.isDefault) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le taux par défaut' },
        { status: 400 }
      )
    }

    await prisma.taxRate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Taux de taxe supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting tax rate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du taux' },
      { status: 500 }
    )
  }
}
