import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * Get products by category slug
 * No authentication required
 *
 * GET /api/products/by-category/[slug]
 *
 * Query params:
 *   - limit: number of products to return (default: 12)
 *   - sort: sorting option (default: 'newest')
 *     Options: 'newest', 'oldest', 'price-asc', 'price-desc', 'name-asc', 'name-desc'
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'newest'

    // Find category by slug
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      )
    }

    // Build category IDs array (include subcategories)
    const categoryIds = [category.id, ...category.children.map(c => c.id)]

    // Build where clause
    const where: any = {
      categoryId: {
        in: categoryIds,
      },
      published: true,
      stock: {
        gt: 0,
      },
    }

    // Build orderBy based on sort parameter
    let orderBy: any = []
    switch (sort) {
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }]
        break
      case 'price-asc':
        orderBy = [{ price: 'asc' }]
        break
      case 'price-desc':
        orderBy = [{ price: 'desc' }]
        break
      case 'name-asc':
        orderBy = [{ name: 'asc' }]
        break
      case 'name-desc':
        orderBy = [{ name: 'desc' }]
        break
      case 'newest':
      default:
        orderBy = [{ createdAt: 'desc' }]
    }

    // Fetch products
    const products = await prisma.product.findMany({
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
      orderBy,
      take: limit,
    })

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
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
        },
        products: productsWithRatings,
        total: productsWithRatings.length,
      },
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products'
      },
      { status: 500 }
    )
  }
}
