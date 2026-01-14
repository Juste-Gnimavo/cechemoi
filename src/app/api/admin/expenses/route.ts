import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/expenses - List expenses with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const staffId = searchParams.get('staffId')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (staffId) {
      where.staffId = staffId
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) {
        where.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.paymentDate.lte = end
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    // Calculate totals for filtered results
    const totals = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    return NextResponse.json({
      success: true,
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      totals: {
        totalAmount: totals._sum.amount || 0,
        count: totals._count,
      },
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/expenses - Create a new expense
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      categoryId,
      description,
      amount,
      paymentMethod,
      paymentDate,
      reference,
      staffId,
      attachmentUrl,
      notes,
    } = body

    // Validation
    if (!categoryId) {
      return NextResponse.json({ error: 'La catégorie est requise' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ error: 'La description est requise' }, { status: 400 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être positif' }, { status: 400 })
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Le mode de paiement est requis' }, { status: 400 })
    }

    // Check if category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Check if staff exists if provided
    if (staffId) {
      const staff = await prisma.user.findUnique({
        where: { id: staffId },
      })
      if (!staff) {
        return NextResponse.json({ error: 'Membre du personnel non trouvé' }, { status: 404 })
      }
    }

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        description,
        amount,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        reference: reference || null,
        staffId: staffId || null,
        attachmentUrl: attachmentUrl || null,
        notes: notes || null,
        createdById: (session.user as any).id,
        createdByName: (session.user as any).name || 'Staff',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      expense,
      message: 'Dépense enregistrée avec succès',
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
