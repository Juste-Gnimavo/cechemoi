import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/tax/rates - Get all tax rates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const rates = await prisma.taxRate.findMany({
      orderBy: [
        {
          isDefault: 'desc', // Default rate first
        },
        {
          country: 'asc',
        },
        {
          priority: 'asc',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      rates,
    })
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des taux de taxe' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tax/rates - Create a new tax rate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { country, state, rate, name, enabled, isDefault, applyToShipping, priority } = body

    // Validate required fields
    if (!country || !name || rate === undefined || rate === null) {
      return NextResponse.json(
        { error: 'Pays, nom et taux requis' },
        { status: 400 }
      )
    }

    // Validate rate is between 0 and 100
    if (rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'Le taux doit être entre 0 et 100' },
        { status: 400 }
      )
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await prisma.taxRate.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const taxRate = await prisma.taxRate.create({
      data: {
        country,
        state,
        rate,
        name,
        enabled: enabled ?? true,
        isDefault: isDefault ?? false,
        applyToShipping: applyToShipping ?? false,
        priority: priority ?? 1,
      },
    })

    return NextResponse.json({
      success: true,
      rate: taxRate,
    })
  } catch (error) {
    console.error('Error creating tax rate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du taux de taxe' },
      { status: 500 }
    )
  }
}
