import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Helper function to calculate reading time
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// GET - List all blog posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (published !== null && published !== '') {
      where.published = published === 'true'
    }

    if (featured !== null && featured !== '') {
      where.featured = featured === 'true'
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          category: true,
          author: {
            select: { id: true, name: true, image: true }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
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

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      published,
      featured,
      categoryId,
      tagIds,
      metaTitle,
      metaDescription
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Le titre et le contenu sont requis' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug || title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: finalSlug }
    })

    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'Ce slug existe déjà' },
        { status: 400 }
      )
    }

    // Calculate reading time
    const readTime = calculateReadTime(content)

    // Create post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        content,
        image,
        published: published || false,
        featured: featured || false,
        publishedAt: published ? new Date() : null,
        authorId: (session.user as any).id,
        authorName: (session.user as any).name || 'Admin',
        categoryId: categoryId || null,
        metaTitle,
        metaDescription,
        readTime,
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        } : undefined
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, image: true }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Format the response
    const formattedPost = {
      ...post,
      tags: post.tags.map(t => t.tag)
    }

    return NextResponse.json({ success: true, post: formattedPost }, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'article' },
      { status: 500 }
    )
  }
}
