import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/marketing/bundles - Get all product bundles
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const bundles = await prisma.productBundle.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      bundles,
    })
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des packs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/marketing/bundles - Create a new bundle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, slug, description, bundlePrice, enabled, featured, items } = body

    if (!name || !slug || !bundlePrice || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nom, slug, prix et produits requis' },
        { status: 400 }
      )
    }

    // Check if slug exists
    const existing = await prisma.productBundle.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé' },
        { status: 400 }
      )
    }

    // Calculate regular price from items
    let regularPrice = 0
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { price: true },
      })
      if (product) {
        regularPrice += product.price * item.quantity
      }
    }

    const discount = regularPrice > 0 ? ((regularPrice - bundlePrice) / regularPrice) * 100 : 0

    // Create bundle with items
    const bundle = await prisma.productBundle.create({
      data: {
        name,
        slug,
        description,
        regularPrice,
        bundlePrice,
        discount,
        enabled: enabled ?? true,
        featured: featured ?? false,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      bundle,
    })
  } catch (error) {
    console.error('Error creating bundle:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du pack' },
      { status: 500 }
    )
  }
}
