import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * Public categories endpoint for customer frontend
 * No authentication required
 *
 * GET /api/categories
 *
 * Query params:
 *   - includeChildren: true/false (include subcategories)
 *   - includeProductCount: true/false (include product count)
 *   - published: true/false (filter by published status, default: true)
 */
export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const includeChildren = searchParams.get('includeChildren') !== 'false' // default true
    const includeProductCount = searchParams.get('includeProductCount') === 'true'
    const published = searchParams.get('published') !== 'false' // default true

    // Build where clause - only show categories with products or that have children
    const where: any = {}

    // Fetch all categories with their relationships
    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: includeChildren ? {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        } : false,
        children: includeChildren ? {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            description: true,
          },
          orderBy: {
            name: 'asc',
          },
        } : false,
        ...(includeProductCount && {
          _count: {
            select: {
              products: true,
            },
          },
        }),
      },
      orderBy: {
        createdAt: 'asc', // Keep creation order to match menu structure
      },
    })

    // Build hierarchical structure (root categories with their children)
    const rootCategories = categories.filter(cat => !cat.parentId)

    const hierarchicalCategories = rootCategories.map(rootCat => {
      const children = categories.filter(cat => cat.parentId === rootCat.id)
      return {
        ...rootCat,
        children: includeChildren ? children : undefined,
        productCount: includeProductCount ? rootCat._count?.products || 0 : undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        categories: hierarchicalCategories,
        total: hierarchicalCategories.length,
      },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories'
      },
      { status: 500 }
    )
  }
}
