import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/shipping/zones/[id] - Get a single shipping zone
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const zone = await prisma.shippingZone.findUnique({
      where: { id: params.id },
      include: {
        methods: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone de livraison non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      zone,
    })
  } catch (error) {
    console.error('Error fetching shipping zone:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la zone' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/shipping/zones/[id] - Update a shipping zone
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
    const { name, countries, enabled, isDefault } = body

    // Check if zone exists
    const existingZone = await prisma.shippingZone.findUnique({
      where: { id: params.id },
    })

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Zone de livraison non trouvée' },
        { status: 404 }
      )
    }

    // If this is set as default, unset any existing default
    if (isDefault && !existingZone.isDefault) {
      await prisma.shippingZone.updateMany({
        where: {
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const zone = await prisma.shippingZone.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(countries && { countries }),
        ...(enabled !== undefined && { enabled }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: {
        methods: true,
      },
    })

    return NextResponse.json({
      success: true,
      zone,
    })
  } catch (error) {
    console.error('Error updating shipping zone:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la zone' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/shipping/zones/[id] - Delete a shipping zone
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: params.id },
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone de livraison non trouvée' },
        { status: 404 }
      )
    }

    // Prevent deleting the default zone
    if (zone.isDefault) {
      return NextResponse.json(
        { error: 'Impossible de supprimer la zone par défaut' },
        { status: 400 }
      )
    }

    // Check if zone has associated orders
    const ordersCount = await prisma.order.count({
      where: {
        shippingMethod: {
          zoneId: params.id,
        },
      },
    })

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette zone. ${ordersCount} commande(s) utilisent des méthodes de cette zone.`,
        },
        { status: 400 }
      )
    }

    await prisma.shippingZone.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Zone de livraison supprimée avec succès',
    })
  } catch (error) {
    console.error('Error deleting shipping zone:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la zone' },
      { status: 500 }
    )
  }
}
