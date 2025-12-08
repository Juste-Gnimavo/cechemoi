import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/coupons - List all coupons
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (active === 'true') {
      where.active = true
    } else if (active === 'false') {
      where.active = false
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const totalCount = await prisma.coupon.count({ where })

    // Get stats
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      todayCoupons,
      monthCoupons,
    ] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { active: true } }),
      prisma.coupon.count({ where: { expiresAt: { lt: now } } }),
      prisma.coupon.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.coupon.count({ where: { createdAt: { gte: startOfMonth } } }),
    ])

    const stats = {
      total: totalCoupons,
      active: activeCoupons,
      expired: expiredCoupons,
      today: todayCoupons,
      month: monthCoupons,
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Add computed fields
    const couponsWithStats = coupons.map((coupon) => {
      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now
      const notStarted = coupon.startsAt && new Date(coupon.startsAt) > now
      const usageLimitReached = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit

      return {
        ...coupon,
        status: !coupon.active
          ? 'inactive'
          : isExpired
          ? 'expired'
          : notStarted
          ? 'scheduled'
          : usageLimitReached
          ? 'depleted'
          : 'active',
        totalOrders: coupon._count.orders,
        totalUsages: coupon._count.usages,
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      coupons: couponsWithStats,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des coupons' },
      { status: 500 }
    )
  }
}

// POST /api/admin/coupons - Create new coupon
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      allowedCategories = [],
      excludedCategories = [],
      allowedProducts = [],
      excludedProducts = [],
      usageLimit,
      usageLimitPerUser,
      startsAt,
      expiresAt,
      active = true,
    } = body

    // Validation
    if (!code || code.trim() === '') {
      return NextResponse.json({ error: 'Le code du coupon est requis' }, { status: 400 })
    }

    if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Type de réduction invalide (percentage ou fixed)' },
        { status: 400 }
      )
    }

    if (!discountValue || discountValue <= 0) {
      return NextResponse.json(
        { error: 'La valeur de réduction doit être supérieure à 0' },
        { status: 400 }
      )
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return NextResponse.json(
        { error: 'Le pourcentage de réduction ne peut pas dépasser 100%' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existingCoupon) {
      return NextResponse.json({ error: 'Ce code de coupon existe déjà' }, { status: 400 })
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
        maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : null,
        allowedCategories,
        excludedCategories,
        allowedProducts,
        excludedProducts,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        usageLimitPerUser: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active,
        createdBy: (session.user as any).id,
        createdByName: (session.user as any).name || 'Admin',
      },
    })

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du coupon' },
      { status: 500 }
    )
  }
}
