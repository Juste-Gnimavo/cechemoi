import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * Get featured products for homepage
 * No authentication required
 *
 * GET /api/products/featured
 *
 * Query params:
 *   - limit: number of products to return (default: 8)
 *   - page: page number for pagination (default: 1)
 *   - category: filter by category slug (optional)
 *   - wineType: filter by wine type (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '8')
    const page = parseInt(searchParams.get('page') || '1')
    const categorySlug = searchParams.get('category')
    const wineType = searchParams.get('wineType')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      featured: true,
      published: true,
      stock: {
        gt: 0, // Only show products in stock
      },
    }

    // Filter by category if provided
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      })
      if (category) {
        where.categoryId = category.id
      }
    }

    // Filter by wine type if provided
    if (wineType) {
      where.wineType = {
        equals: wineType,
        mode: 'insensitive',
      }
    }

    // Fetch featured products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // Newest first
        ],
        take: limit,
        skip,
      }),
      prisma.product.count({ where }),
    ])

    // Calculate average rating for each product
    const productsWithRatings = products.map(product => {
      const ratings = product.reviews.map(r => r.rating)
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription || product.description,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        stock: product.stock,
        featured: product.featured,
        wineType: product.wineType,
        region: product.region,
        country: product.country,
        vintage: product.vintage,
        category: product.category,
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: product.reviews.length,
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured products'
      },
      { status: 500 }
    )
  }
}
