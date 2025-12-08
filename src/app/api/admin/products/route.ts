import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/products - Get all products with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const published = searchParams.get('published') || ''
    const featured = searchParams.get('featured') || ''
    const stockStatus = searchParams.get('stockStatus') || '' // inStock, lowStock, outOfStock
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    // Search by name, SKU, or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by published status
    if (published) {
      where.published = published === 'true'
    }

    // Filter by featured status
    if (featured) {
      where.featured = featured === 'true'
    }

    // Filter by stock status
    if (stockStatus === 'outOfStock') {
      where.stock = 0
    } else if (stockStatus === 'lowStock') {
      where.stock = { gt: 0, lte: 10 }
    } else if (stockStatus === 'inStock') {
      where.stock = { gt: 10 }
    }

    // Get total count
    const totalCount = await prisma.product.count({ where })

    // Get stats for the page header
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [
      totalProducts,
      publishedProducts,
      featuredProducts,
      outOfStockProducts,
      lowStockProducts,
      todayProducts,
      weekProducts,
      monthProducts,
      yearProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { published: true } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
      prisma.product.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.product.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.product.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.product.count({ where: { createdAt: { gte: startOfYear } } }),
    ])

    const stats = {
      total: totalProducts,
      published: publishedProducts,
      featured: featuredProducts,
      outOfStock: outOfStockProducts,
      lowStock: lowStockProducts,
      today: todayProducts,
      week: weekProducts,
      month: monthProducts,
      year: yearProducts,
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
        productCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        variations: {
          select: {
            id: true,
            name: true,
            stock: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      products,
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
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create new product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      slug,
      description,
      shortDescription,
      longDescription,
      price,
      salePrice,
      sku,
      stock,
      lowStockThreshold,
      images,
      categoryId,
      categoryIds, // Additional categories (multi-category support)
      published,
      featured,
      isWine, // Product type flag
      // Wine specific
      vintage,
      region,
      country,
      grapeVariety,
      alcoholContent,
      volume,
      wineType,
      // Metadata
      weight,
      dimensions,
      tags,
      metaTitle,
      metaDescription,
      taxClassId,
      relatedProducts,
      upsellProducts,
      // Variations and attributes
      variations,
      attributes,
    } = body

    // Validate required fields
    if (!name || !price || !sku || !categoryId) {
      return NextResponse.json(
        { error: 'Nom, prix, SKU et catégorie sont requis' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku },
    })

    if (existingSku) {
      return NextResponse.json({ error: 'Ce SKU existe déjà' }, { status: 400 })
    }

    // Generate slug if not provided
    const productSlug =
      slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

    // Check if slug exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productSlug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 400 })
    }

    // Create product with variations and attributes
    const product = await prisma.product.create({
      data: {
        name,
        slug: productSlug,
        description,
        shortDescription,
        longDescription,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        sku,
        stock: parseInt(stock) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        images: images || [],
        categoryId,
        published: published !== false,
        featured: featured === true,
        isWine: isWine !== false, // Default to true for backward compatibility
        // Wine fields (only relevant if isWine is true)
        vintage: isWine !== false ? vintage : null,
        region: isWine !== false ? region : null,
        country: isWine !== false ? country : null,
        grapeVariety: isWine !== false ? grapeVariety : null,
        alcoholContent: isWine !== false && alcoholContent ? parseFloat(alcoholContent) : null,
        volume: isWine !== false ? volume : null,
        wineType: isWine !== false ? wineType : null,
        // Metadata
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        tags: tags || [],
        metaTitle,
        metaDescription,
        taxClassId: taxClassId || null,
        relatedProducts: relatedProducts || [],
        upsellProducts: upsellProducts || [],
        // Create additional category links if provided
        productCategories: categoryIds?.length
          ? {
              create: categoryIds.map((catId: string) => ({
                categoryId: catId,
              })),
            }
          : undefined,
        // Create variations if provided
        variations: variations?.length
          ? {
              create: variations.map((v: any) => ({
                name: v.name,
                sku: v.sku,
                price: parseFloat(v.price),
                salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
                stock: parseInt(v.stock) || 0,
                attributes: v.attributes || {},
                enabled: v.enabled !== false,
              })),
            }
          : undefined,
        // Create attributes if provided
        attributes: attributes?.length
          ? {
              create: attributes.map((a: any) => ({
                name: a.name,
                value: a.value,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        productCategories: {
          include: {
            category: true,
          },
        },
        variations: true,
        attributes: true,
      },
    })

    // Invalidate product cache
    await redis.invalidateProducts()

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
}
