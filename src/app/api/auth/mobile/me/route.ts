import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/mobile-jwt'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token requis' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    // Get extended user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        image: true,
        whatsappNumber: true,
        phoneVerified: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
        loyaltyPoints: {
          select: {
            points: true,
            totalEarned: true,
            tier: true,
          },
        },
      },
    })

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        phone: fullUser.phone,
        name: fullUser.name,
        email: fullUser.email,
        image: fullUser.image,
        whatsappNumber: fullUser.whatsappNumber,
        phoneVerified: !!fullUser.phoneVerified,
        createdAt: fullUser.createdAt,
        stats: {
          orders: fullUser._count.orders,
          reviews: fullUser._count.reviews,
          addresses: fullUser._count.addresses,
        },
        loyalty: fullUser.loyaltyPoints ? {
          balance: fullUser.loyaltyPoints.points,
          lifetimePoints: fullUser.loyaltyPoints.totalEarned,
          tier: fullUser.loyaltyPoints.tier,
        } : {
          balance: 0,
          lifetimePoints: 0,
          tier: 'bronze',
        },
      },
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue.' },
      { status: 500 }
    )
  }
}
