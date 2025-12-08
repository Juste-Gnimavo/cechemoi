import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reviews - Get all reviews with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // all, published, pending
    const rating = searchParams.get('rating') // 1-5
    const productId = searchParams.get('productId')

    // Build filter
    const where: any = {}

    if (status === 'published') {
      where.published = true
    } else if (status === 'pending') {
      where.published = false
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    if (productId) {
      where.productId = productId
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get statistics
    const stats = await prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    })

    const totalReviews = await prisma.review.count()
    const publishedReviews = await prisma.review.count({ where: { published: true } })
    const pendingReviews = await prisma.review.count({ where: { published: false } })
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    })

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        total: totalReviews,
        published: publishedReviews,
        pending: pendingReviews,
        averageRating: avgRating._avg.rating || 0,
        byRating: stats.reduce((acc, curr) => {
          acc[curr.rating] = curr._count.rating
          return acc
        }, {} as Record<number, number>),
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    )
  }
}
