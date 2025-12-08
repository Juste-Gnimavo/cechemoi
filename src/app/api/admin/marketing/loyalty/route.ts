import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/marketing/loyalty - Get all loyalty accounts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tier = searchParams.get('tier')

    const where: any = {}
    if (tier) {
      where.tier = tier
    }

    const accounts = await prisma.loyaltyPoints.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        transactions: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
    })

    // Statistics
    const stats = {
      totalAccounts: await prisma.loyaltyPoints.count(),
      totalPoints: await prisma.loyaltyPoints.aggregate({
        _sum: {
          points: true,
        },
      }),
      byTier: await prisma.loyaltyPoints.groupBy({
        by: ['tier'],
        _count: {
          tier: true,
        },
      }),
    }

    return NextResponse.json({
      success: true,
      accounts,
      stats,
    })
  } catch (error) {
    console.error('Error fetching loyalty accounts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des comptes fidélité' },
      { status: 500 }
    )
  }
}

// POST /api/admin/marketing/loyalty/adjust - Adjust points for a user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, points, reason } = body

    if (!userId || points === undefined || !reason) {
      return NextResponse.json(
        { error: 'User ID, points et raison requis' },
        { status: 400 }
      )
    }

    // Get or create loyalty account
    let loyalty = await prisma.loyaltyPoints.findUnique({
      where: { userId },
    })

    if (!loyalty) {
      loyalty = await prisma.loyaltyPoints.create({
        data: {
          userId,
          points: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      })
    }

    // Calculate new balance
    const newBalance = loyalty.points + points

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Solde de points insuffisant' },
        { status: 400 }
      )
    }

    // Determine tier based on total earned
    const totalEarned = points > 0 ? loyalty.totalEarned + points : loyalty.totalEarned
    let tier = 'bronze'
    if (totalEarned >= 10000) tier = 'platinum'
    else if (totalEarned >= 5000) tier = 'gold'
    else if (totalEarned >= 2000) tier = 'silver'

    // Update loyalty account
    const updated = await prisma.loyaltyPoints.update({
      where: { userId },
      data: {
        points: newBalance,
        totalEarned: points > 0 ? { increment: points } : loyalty.totalEarned,
        totalSpent: points < 0 ? { increment: Math.abs(points) } : loyalty.totalSpent,
        tier,
        transactions: {
          create: {
            type: points > 0 ? 'adjustment' : 'spend',
            points,
            reason,
            balance: newBalance,
          },
        },
      },
      include: {
        transactions: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      loyalty: updated,
    })
  } catch (error) {
    console.error('Error adjusting loyalty points:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajustement des points' },
      { status: 500 }
    )
  }
}
