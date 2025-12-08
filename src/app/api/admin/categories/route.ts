import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/categories - Get all categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const includeProducts = searchParams.get('includeProducts') === 'true'

    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        ...(includeProducts && {
          _count: {
            select: {
              products: true,
            },
          },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, slug, description, image, parentId } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    // Generate slug if not provided
    const categorySlug =
      slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

    // Check if slug exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug: categorySlug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 400 })
    }

    // Use default image if no image provided
    const DEFAULT_CATEGORY_IMAGE = '/logo/web/logo-cave-express-transparent-dark-mode.png'
    const categoryImage = image || DEFAULT_CATEGORY_IMAGE

    const category = await prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        description,
        image: categoryImage,
        parentId: parentId || null,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    return NextResponse.json({ success: true, category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la catégorie' },
      { status: 500 }
    )
  }
}
