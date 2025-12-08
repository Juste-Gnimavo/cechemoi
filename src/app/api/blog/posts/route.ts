import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - List published blog posts (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categorySlug = searchParams.get('category') || ''
    const tagSlug = searchParams.get('tag') || ''
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const where: any = {
      published: true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (categorySlug) {
      const category = await prisma.blogCategory.findUnique({
        where: { slug: categorySlug }
      })
      if (category) {
        where.categoryId = category.id
      }
    }

    if (tagSlug) {
      const tag = await prisma.blogTag.findUnique({
        where: { slug: tagSlug }
      })
      if (tag) {
        where.tags = {
          some: { tagId: tag.id }
        }
      }
    }

    if (featured === 'true') {
      where.featured = true
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          publishedAt: true,
          readTime: true,
          viewCount: true,
          authorName: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true
                }
              }
            }
          }
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ])

    // Format the response
    const formattedPosts = posts.map(post => ({
      ...post,
      tags: post.tags.map(t => t.tag)
    }))

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des articles' },
      { status: 500 }
    )
  }
}
