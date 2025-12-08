import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/shipping/methods/[id] - Get a single shipping method
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const method = await prisma.shippingMethod.findUnique({
      where: { id: params.id },
      include: {
        zone: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!method) {
      return NextResponse.json(
        { error: 'Méthode de livraison non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      method,
    })
  } catch (error) {
    console.error('Error fetching shipping method:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la méthode' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/shipping/methods/[id] - Update a shipping method
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
    const {
      name,
      description,
      enabled,
      costType,
      cost,
      minOrderAmount,
      weightRanges,
      priceRanges,
      estimatedDays,
      taxable,
    } = body

    // Check if method exists
    const existingMethod = await prisma.shippingMethod.findUnique({
      where: { id: params.id },
    })

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Méthode de livraison non trouvée' },
        { status: 404 }
      )
    }

    // Validate cost type if provided
    if (costType) {
      const validCostTypes = ['flat_rate', 'free', 'weight_based', 'price_based', 'variable']
      if (!validCostTypes.includes(costType)) {
        return NextResponse.json(
          { error: 'Type de coût invalide' },
          { status: 400 }
        )
      }
    }

    const method = await prisma.shippingMethod.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
        ...(costType && { costType }),
        ...(cost !== undefined && { cost }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
        ...(weightRanges !== undefined && { weightRanges }),
        ...(priceRanges !== undefined && { priceRanges }),
        ...(estimatedDays !== undefined && { estimatedDays }),
        ...(taxable !== undefined && { taxable }),
      },
      include: {
        zone: true,
      },
    })

    return NextResponse.json({
      success: true,
      method,
    })
  } catch (error) {
    console.error('Error updating shipping method:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la méthode' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/shipping/methods/[id] - Delete a shipping method
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if method exists
    const method = await prisma.shippingMethod.findUnique({
      where: { id: params.id },
    })

    if (!method) {
      return NextResponse.json(
        { error: 'Méthode de livraison non trouvée' },
        { status: 404 }
      )
    }

    // Check if method is used in orders
    const ordersCount = await prisma.order.count({
      where: {
        shippingMethodId: params.id,
      },
    })

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette méthode. ${ordersCount} commande(s) l'utilisent.`,
        },
        { status: 400 }
      )
    }

    await prisma.shippingMethod.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Méthode de livraison supprimée avec succès',
    })
  } catch (error) {
    console.error('Error deleting shipping method:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la méthode' },
      { status: 500 }
    )
  }
}
