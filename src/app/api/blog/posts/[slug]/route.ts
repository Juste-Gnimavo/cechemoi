import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - Get a single published blog post by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true
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
      }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Only show published posts to the public
    if (!post.published) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } }
    })

    // Format the response
    const formattedPost = {
      ...post,
      tags: post.tags.map(t => t.tag)
    }

    // Get related posts (same category)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        published: true,
        categoryId: post.categoryId,
        id: { not: post.id }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        publishedAt: true,
        readTime: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: 3
    })

    return NextResponse.json({
      success: true,
      post: formattedPost,
      relatedPosts
    })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    )
  }
}
