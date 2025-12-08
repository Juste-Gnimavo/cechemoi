import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - Get a single blog tag
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

    const tag = await prisma.blogTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, tag })
  } catch (error) {
    console.error('Error fetching blog tag:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du tag' },
      { status: 500 }
    )
  }
}

// PUT - Update a blog tag
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
    const { name, slug, description, color } = body

    // Check if tag exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { id }
    })

    if (!existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag non trouvé' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another tag
    if (slug && slug !== existingTag.slug) {
      const slugExists = await prisma.blogTag.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    const tag = await prisma.blogTag.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        color
      }
    })

    return NextResponse.json({ success: true, tag })
  } catch (error) {
    console.error('Error updating blog tag:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du tag' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a blog tag
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

    const tag = await prisma.blogTag.findUnique({
      where: { id }
    })

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag non trouvé' },
        { status: 404 }
      )
    }

    // Delete all post-tag associations first
    await prisma.blogPostTag.deleteMany({
      where: { tagId: id }
    })

    // Then delete the tag
    await prisma.blogTag.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Tag supprimé' })
  } catch (error) {
    console.error('Error deleting blog tag:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du tag' },
      { status: 500 }
    )
  }
}
