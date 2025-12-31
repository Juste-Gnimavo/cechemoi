import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Default expense categories to seed
const DEFAULT_CATEGORIES = [
  { name: 'Electricite (CIE)', icon: 'Zap', color: '#f59e0b', sortOrder: 1, isDefault: true },
  { name: 'Eau (SODECI)', icon: 'Droplets', color: '#3b82f6', sortOrder: 2, isDefault: true },
  { name: 'Salaires', icon: 'Users', color: '#10b981', sortOrder: 3, isDefault: true },
  { name: 'Transport', icon: 'Car', color: '#8b5cf6', sortOrder: 4, isDefault: true },
  { name: 'Communication', icon: 'Phone', color: '#ec4899', sortOrder: 5, isDefault: true },
  { name: 'Canal+/TV', icon: 'Tv', color: '#06b6d4', sortOrder: 6, isDefault: true },
  { name: 'Hygiene/Nettoyage', icon: 'Sparkles', color: '#84cc16', sortOrder: 7, isDefault: true },
  { name: 'Loyer', icon: 'Home', color: '#f97316', sortOrder: 8, isDefault: true },
  { name: 'Fournitures bureau', icon: 'FileText', color: '#6366f1', sortOrder: 9, isDefault: true },
  { name: 'Autres', icon: 'MoreHorizontal', color: '#64748b', sortOrder: 99, isDefault: true },
]

// GET /api/admin/expenses/categories - List all expense categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    // Check if we need to seed default categories
    const count = await prisma.expenseCategory.count()

    if (count === 0) {
      // Seed default categories
      await prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES,
      })
    }

    // Fetch all categories with expense count
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    })

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      expensesCount: cat._count.expenses,
      _count: undefined,
    }))

    return NextResponse.json({
      success: true,
      categories: categoriesWithCount,
    })
  } catch (error) {
    console.error('Error fetching expense categories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/expenses/categories - Create a new expense category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, icon, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    // Check if name already exists
    const existing = await prisma.expenseCategory.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json({ error: 'Une categorie avec ce nom existe deja' }, { status: 400 })
    }

    // Get max sortOrder
    const maxOrder = await prisma.expenseCategory.aggregate({
      _max: { sortOrder: true },
    })
    const newSortOrder = (maxOrder._max.sortOrder || 0) + 1

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        description: description || null,
        icon: icon || 'Tag',
        color: color || '#64748b',
        sortOrder: newSortOrder,
        isDefault: false,
      },
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Categorie creee avec succes',
    })
  } catch (error) {
    console.error('Error creating expense category:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
