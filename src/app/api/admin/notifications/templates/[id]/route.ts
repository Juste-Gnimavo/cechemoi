import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/notifications/templates/[id] - Get template by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const template = await prisma.notificationTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Error fetching notification template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du modèle' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/notifications/templates/[id] - Update template (full)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, content, enabled, pushTitle, pushBody } = body

    const template = await prisma.notificationTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(enabled !== undefined && { enabled }),
        ...(pushTitle !== undefined && { pushTitle }),
        ...(pushBody !== undefined && { pushBody }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error: any) {
    console.error('Error updating notification template:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du modèle' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/notifications/templates/[id] - Partial update template
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const updateData: any = {}

    // Only include fields that were provided
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.pushTitle !== undefined) updateData.pushTitle = body.pushTitle
    if (body.pushBody !== undefined) updateData.pushBody = body.pushBody
    if (body.recipientType !== undefined) updateData.recipientType = body.recipientType

    updateData.updatedAt = new Date()

    const template = await prisma.notificationTemplate.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, template })
  } catch (error: any) {
    console.error('Error patching notification template:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du modèle' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/notifications/templates/[id] - Delete template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    await prisma.notificationTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Modèle supprimé' })
  } catch (error: any) {
    console.error('Error deleting notification template:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du modèle' },
      { status: 500 }
    )
  }
}
