import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get or create loyalty points record
    let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId },
    })

    if (!loyaltyPoints) {
      loyaltyPoints = await prisma.loyaltyPoints.create({
        data: {
          userId,
          points: 0,
          totalEarned: 0,
          tier: 'Bronze',
        },
      })
    }

    // Fetch transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { loyaltyId: loyaltyPoints.id },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.loyaltyTransaction.count({ where: { loyaltyId: loyaltyPoints.id } }),
    ])

    return NextResponse.json({
      loyalty: loyaltyPoints,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Loyalty fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
