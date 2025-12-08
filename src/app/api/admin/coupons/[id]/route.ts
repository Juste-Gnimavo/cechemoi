import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/coupons/[id] - Get coupon details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        usages: {
          include: {
            coupon: {
              select: {
                code: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon non trouvé' }, { status: 404 })
    }

    // Calculate total discount given
    const totalDiscountGiven = coupon.usages.reduce((sum, usage) => sum + usage.discountAmount, 0)

    return NextResponse.json({
      success: true,
      coupon: {
        ...coupon,
        totalDiscountGiven,
      },
    })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du coupon' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/coupons/[id] - Update coupon
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon non trouvé' }, { status: 404 })
    }

    const body = await req.json()
    const {
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      allowedCategories,
      excludedCategories,
      allowedProducts,
      excludedProducts,
      usageLimit,
      usageLimitPerUser,
      startsAt,
      expiresAt,
      active,
    } = body

    // Validation
    if (discountType && !['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Type de réduction invalide (percentage ou fixed)' },
        { status: 400 }
      )
    }

    if (discountValue !== undefined && discountValue <= 0) {
      return NextResponse.json(
        { error: 'La valeur de réduction doit être supérieure à 0' },
        { status: 400 }
      )
    }

    if (discountType === 'percentage' && discountValue && discountValue > 100) {
      return NextResponse.json(
        { error: 'Le pourcentage de réduction ne peut pas dépasser 100%' },
        { status: 400 }
      )
    }

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(minimumOrderAmount !== undefined && {
          minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
        }),
        ...(maximumDiscount !== undefined && {
          maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : null,
        }),
        ...(allowedCategories !== undefined && { allowedCategories }),
        ...(excludedCategories !== undefined && { excludedCategories }),
        ...(allowedProducts !== undefined && { allowedProducts }),
        ...(excludedProducts !== undefined && { excludedProducts }),
        ...(usageLimit !== undefined && {
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
        }),
        ...(usageLimitPerUser !== undefined && {
          usageLimitPerUser: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
        }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du coupon' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon non trouvé' }, { status: 404 })
    }

    // Don't allow deletion if coupon has been used
    if (existingCoupon._count.orders > 0) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer un coupon qui a été utilisé. Désactivez-le à la place.',
        },
        { status: 400 }
      )
    }

    await prisma.coupon.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du coupon' },
      { status: 500 }
    )
  }
}
