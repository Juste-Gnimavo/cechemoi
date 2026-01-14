import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Default categories to seed if none exist
const DEFAULT_CATEGORIES = [
  { name: 'Tissus', sortOrder: 1, isDefault: true },
  { name: 'Fils', sortOrder: 2, isDefault: true },
  { name: 'Boutons', sortOrder: 3, isDefault: true },
  { name: 'Fermetures', sortOrder: 4, isDefault: true },
  { name: 'Doublures', sortOrder: 5, isDefault: true },
  { name: 'Accessoires', sortOrder: 6, isDefault: true },
  { name: 'Autres', sortOrder: 99, isDefault: true },
]

// GET /api/admin/materials/categories - List all categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if categories exist, if not seed default ones
    const count = await prisma.materialCategory.count()

    if (count === 0) {
      await prisma.materialCategory.createMany({
        data: DEFAULT_CATEGORIES,
      })
    }

    const categories = await prisma.materialCategory.findMany({
      include: {
        _count: {
          select: { materials: true },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      categories: categories.map((cat) => ({
        ...cat,
        materialsCount: cat._count.materials,
      })),
    })
  } catch (error) {
    console.error('Error fetching material categories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/materials/categories - Create a new category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    // Check if name already exists
    const existing = await prisma.materialCategory.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 })
    }

    // Get max sortOrder if not provided
    let order = sortOrder
    if (!order) {
      const maxOrder = await prisma.materialCategory.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })
      order = (maxOrder?.sortOrder || 0) + 1
    }

    const category = await prisma.materialCategory.create({
      data: {
        name,
        description,
        sortOrder: order,
        isDefault: false,
      },
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Catégorie créée avec succès',
    })
  } catch (error) {
    console.error('Error creating material category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
