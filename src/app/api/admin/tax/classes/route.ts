import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/tax/classes - Get all tax classes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const classes = await prisma.taxClass.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      classes,
    })
  } catch (error) {
    console.error('Error fetching tax classes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des classes de taxe' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tax/classes - Create a new tax class
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, rate, enabled } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Nom requis' },
        { status: 400 }
      )
    }

    // Validate rate if provided
    if (rate !== undefined && rate !== null && (rate < 0 || rate > 100)) {
      return NextResponse.json(
        { error: 'Le taux doit être entre 0 et 100' },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existing = await prisma.taxClass.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Une classe avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    const taxClass = await prisma.taxClass.create({
      data: {
        name,
        description,
        rate,
        enabled: enabled ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      class: taxClass,
    })
  } catch (error) {
    console.error('Error creating tax class:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la classe de taxe' },
      { status: 500 }
    )
  }
}
