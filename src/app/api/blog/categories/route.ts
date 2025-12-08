import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - List blog categories with post counts (public)
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: { published: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Filter categories that have at least one published post (optional)
    const categoriesWithPosts = categories.filter(cat => cat._count.posts > 0)

    return NextResponse.json({
      success: true,
      categories: categoriesWithPosts
    })
  } catch (error) {
    console.error('Error fetching blog categories:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    )
  }
}
