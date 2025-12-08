import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/shipping/zones - Get all shipping zones
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const zones = await prisma.shippingZone.findMany({
      include: {
        methods: {
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            methods: true,
          },
        },
      },
      orderBy: [
        {
          isDefault: 'desc', // Default zone first
        },
        {
          name: 'asc',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      zones,
    })
  } catch (error) {
    console.error('Error fetching shipping zones:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des zones de livraison' },
      { status: 500 }
    )
  }
}

// POST /api/admin/shipping/zones - Create a new shipping zone
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, countries, enabled, isDefault } = body

    // Validate required fields
    if (!name || !countries || countries.length === 0) {
      return NextResponse.json(
        { error: 'Nom et pays requis' },
        { status: 400 }
      )
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await prisma.shippingZone.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name,
        countries,
        enabled: enabled ?? true,
        isDefault: isDefault ?? false,
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
    console.error('Error creating shipping zone:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la zone de livraison' },
      { status: 500 }
    )
  }
}
