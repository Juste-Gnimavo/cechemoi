import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/marketing/abandoned-carts - Get abandoned carts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // all, recovered, pending

    const now = new Date()
    const where: any = {
      expiresAt: { gte: now }, // Not expired
    }

    if (status === 'recovered') {
      where.recovered = true
    } else if (status === 'pending') {
      where.recovered = false
    }

    const carts = await prisma.abandonedCart.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    // Calculate statistics
    const totalAbandoned = await prisma.abandonedCart.count({
      where: {
        expiresAt: { gte: now },
      },
    })

    const recovered = await prisma.abandonedCart.count({
      where: {
        recovered: true,
        expiresAt: { gte: now },
      },
    })

    const pending = await prisma.abandonedCart.count({
      where: {
        recovered: false,
        expiresAt: { gte: now },
      },
    })

    const totalValue = await prisma.abandonedCart.aggregate({
      where: {
        recovered: false,
        expiresAt: { gte: now },
      },
      _sum: {
        subtotal: true,
      },
    })

    return NextResponse.json({
      success: true,
      carts,
      stats: {
        total: totalAbandoned,
        recovered,
        pending,
        recoveryRate: totalAbandoned > 0 ? (recovered / totalAbandoned) * 100 : 0,
        potentialRevenue: totalValue._sum.subtotal || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching abandoned carts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paniers abandonnés' },
      { status: 500 }
    )
  }
}

// POST /api/admin/marketing/abandoned-carts/send-email - Send recovery email
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { cartId } = body

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID requis' },
        { status: 400 }
      )
    }

    // Get cart
    const cart = await prisma.abandonedCart.findUnique({
      where: { id: cartId },
      include: {
        user: true,
      },
    })

    if (!cart) {
      return NextResponse.json(
        { error: 'Panier non trouvé' },
        { status: 404 }
      )
    }

    // Update email sent status
    await prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    })

    // TODO: Send actual email via email service
    // For now, we just mark it as sent

    return NextResponse.json({
      success: true,
      message: 'Email de récupération envoyé',
    })
  } catch (error) {
    console.error('Error sending recovery email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}
