import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - Get a single blog category
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

    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { posts: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error fetching blog category:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la catégorie' },
      { status: 500 }
    )
  }
}

// PUT - Update a blog category
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
    const { name, slug, description, image, color, parentId } = body

    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another category
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await prisma.blogCategory.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json(
        { success: false, error: 'Une catégorie ne peut pas être son propre parent' },
        { status: 400 }
      )
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        image,
        color,
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true
      }
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error updating blog category:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la catégorie' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a blog category
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

    // Check if category has posts
    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    if (category._count.posts > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer une catégorie avec des articles' },
        { status: 400 }
      )
    }

    await prisma.blogCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Catégorie supprimée' })
  } catch (error) {
    console.error('Error deleting blog category:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la catégorie' },
      { status: 500 }
    )
  }
}
