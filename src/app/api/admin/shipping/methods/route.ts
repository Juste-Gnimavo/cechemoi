import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/shipping/methods - Get all shipping methods or by zone
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const zoneId = searchParams.get('zoneId')

    const methods = await prisma.shippingMethod.findMany({
      where: zoneId ? { zoneId } : {},
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            countries: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: [
        {
          zone: {
            isDefault: 'desc',
          },
        },
        {
          name: 'asc',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      methods,
    })
  } catch (error) {
    console.error('Error fetching shipping methods:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des méthodes de livraison' },
      { status: 500 }
    )
  }
}

// POST /api/admin/shipping/methods - Create a new shipping method
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      zoneId,
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

    // Validate required fields
    if (!zoneId || !name || !costType) {
      return NextResponse.json(
        { error: 'Zone, nom et type de coût requis' },
        { status: 400 }
      )
    }

    // Verify zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone de livraison non trouvée' },
        { status: 404 }
      )
    }

    // Validate cost type
    const validCostTypes = ['flat_rate', 'free', 'variable', 'weight_based', 'price_based']
    if (!validCostTypes.includes(costType)) {
      return NextResponse.json(
        { error: 'Type de coût invalide' },
        { status: 400 }
      )
    }

    const method = await prisma.shippingMethod.create({
      data: {
        zoneId,
        name,
        description,
        enabled: enabled ?? true,
        costType,
        cost: cost ?? 0,
        minOrderAmount,
        weightRanges,
        priceRanges,
        estimatedDays,
        taxable: taxable ?? false,
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
    console.error('Error creating shipping method:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la méthode de livraison' },
      { status: 500 }
    )
  }
}
