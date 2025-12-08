import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reviews/[id] - Get a single review
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'avis' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/reviews/[id] - Update a review (approve/reject/reply)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { published, adminReply } = body

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    // Update review
    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(published !== undefined && { published }),
        ...(adminReply !== undefined && {
          adminReply: adminReply || null,
          repliedAt: adminReply ? new Date() : null,
          repliedBy: adminReply ? (session.user as any).id : null,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avis' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/reviews/[id] - Delete a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    await prisma.review.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Avis supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avis' },
      { status: 500 }
    )
  }
}
