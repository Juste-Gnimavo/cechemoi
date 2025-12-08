import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/coupons/active - Get all active coupons for display
export async function GET(req: NextRequest) {
  try {
    const now = new Date()

    // Find all active coupons that are currently valid
    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: now } },
            ],
          },
          {
            OR: [
              { usageLimit: null },
              { usageCount: { lt: prisma.coupon.fields.usageLimit } },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minimumOrderAmount: true,
        maximumDiscount: true,
        startsAt: true,
        expiresAt: true,
        usageLimit: true,
        usageCount: true,
      },
      orderBy: [
        { discountValue: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Filter out coupons that have reached their usage limit
    const availableCoupons = coupons.filter(
      (c) => !c.usageLimit || c.usageCount < c.usageLimit
    )

    return NextResponse.json({
      success: true,
      coupons: availableCoupons,
    })
  } catch (error) {
    console.error('Error fetching active coupons:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des coupons' },
      { status: 500 }
    )
  }
}
