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

// GET - Get a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.blogPost.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Format the response
    const formattedPost = {
      ...post,
      tags: post.tags.map(t => t.tag)
    }

    return NextResponse.json({ success: true, post: formattedPost })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    )
  }
}

// PUT - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
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

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another post
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    // Calculate reading time if content changed
    const readTime = content ? calculateReadTime(content) : existingPost.readTime

    // Handle publishedAt
    let publishedAt = existingPost.publishedAt
    if (published && !existingPost.published) {
      // Just being published
      publishedAt = new Date()
    } else if (!published) {
      publishedAt = null
    }

    // Update tags - delete old associations and create new ones
    if (tagIds !== undefined) {
      await prisma.blogPostTag.deleteMany({
        where: { postId: id }
      })
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        image,
        published,
        featured,
        publishedAt,
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

    return NextResponse.json({ success: true, post: formattedPost })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de l\'article' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.blogPost.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Delete all tag associations first
    await prisma.blogPostTag.deleteMany({
      where: { postId: id }
    })

    // Then delete the post
    await prisma.blogPost.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Article supprimé' })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de l\'article' },
      { status: 500 }
    )
  }
}
