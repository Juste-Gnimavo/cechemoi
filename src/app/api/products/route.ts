import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis, cacheKeys, CACHE_TTL } from '@/lib/redis'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/products - Get products for public website
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const slug = searchParams.get('slug') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const categorySlug = searchParams.get('categorySlug') || ''
    const wineType = searchParams.get('wineType') || ''
    const featured = searchParams.get('featured') || ''
    const isWine = searchParams.get('isWine') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    // Generate cache key from query params (skip caching for search queries)
    const cacheKey = search
      ? null
      : cacheKeys.products(
          `${slug}:${categoryId}:${categorySlug}:${wineType}:${featured}:${isWine}:${page}:${limit}`
        )

    // Try to get from cache
    if (cacheKey) {
      const cached = await redis.get<{
        success: boolean
        products: unknown[]
        pagination: unknown
      }>(cacheKey)

      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        })
      }
    }

    // Build where clause
    const where: any = {
      published: true, // Only show published products to public
    }

    // Filter by slug (for single product)
    if (slug) {
      where.slug = slug
    }

    // Search by name
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // Filter by category slug - includes both primary and additional categories
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      })
      if (category) {
        // Search in both primary category AND additional categories via ProductCategory
        where.OR = [
          { categoryId: category.id },
          { productCategories: { some: { categoryId: category.id } } },
        ]
      }
    }
    // Filter by category ID (legacy, primary category only)
    else if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by wine type
    if (wineType) {
      where.wineType = wineType
    }

    // Filter by wine products only
    if (isWine === 'true') {
      where.isWine = true
    } else if (isWine === 'false') {
      where.isWine = false
    }

    // Filter by featured status
    if (featured) {
      where.featured = featured === 'true'
    }

    // Ensure only in-stock products are shown
    where.stock = { gt: 0 }

    // Get total count
    const totalCount = await prisma.product.count({ where })

    // Fetch products with category hierarchy
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    // Transform products to include category hierarchy for URL building
    const transformedProducts = products.map((product) => {
      let mainCategorySlug = null
      let subCategorySlug = null

      if (product.category) {
        if (product.category.parent) {
          // This is a subcategory, parent is the main category
          mainCategorySlug = product.category.parent.slug
          subCategorySlug = product.category.slug
        } else {
          // This is a main category
          mainCategorySlug = product.category.slug
        }
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        price: product.price,
        salePrice: product.salePrice,
        sku: product.sku,
        stock: product.stock,
        images: product.images,
        featured: product.featured,
        wineType: product.wineType,
        vintage: product.vintage,
        region: product.region,
        country: product.country,
        grapeVariety: product.grapeVariety,
        alcoholContent: product.alcoholContent,
        volume: product.volume,
        category: product.category,
        mainCategorySlug,
        subCategorySlug,
        reviewCount: product._count.reviews,
      }
    })

    const response = {
      success: true,
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    }

    // Cache the response (non-blocking)
    if (cacheKey) {
      redis.set(cacheKey, response, CACHE_TTL.PRODUCTS).catch(() => {})
    }

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}
