import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id]/attachments - List attachments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    const attachments = await prisma.customOrderAttachment.findMany({
      where: { customOrderId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      attachments,
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/custom-orders/[id]/attachments - Add attachment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { filename, originalName, fileUrl, fileType, fileSize, category, description } = body

    // Verify order exists
    const order = await prisma.customOrder.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 })
    }

    // Determine category from MIME type if not provided
    let fileCategory = category || 'other'
    if (!category) {
      if (fileType.startsWith('image/')) {
        fileCategory = 'image'
      } else if (fileType.startsWith('video/')) {
        fileCategory = 'video'
      } else if (fileType.startsWith('audio/')) {
        fileCategory = 'audio'
      } else if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('word')) {
        fileCategory = 'document'
      }
    }

    const attachment = await prisma.customOrderAttachment.create({
      data: {
        customOrderId: id,
        filename,
        originalName,
        fileUrl,
        fileType,
        fileSize,
        category: fileCategory,
        description,
        uploadedById: (session.user as any).id,
        uploadedByName: (session.user as any).name,
      },
    })

    // Add timeline entry
    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: id,
        event: 'Fichier ajoute',
        description: `${originalName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      attachment,
    })
  } catch (error) {
    console.error('Error adding attachment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/custom-orders/[id]/attachments - Delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'ID de fichier requis' }, { status: 400 })
    }

    // Verify attachment exists and belongs to this order
    const attachment = await prisma.customOrderAttachment.findFirst({
      where: {
        id: attachmentId,
        customOrderId: id,
      },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Fichier non trouve' }, { status: 404 })
    }

    await prisma.customOrderAttachment.delete({
      where: { id: attachmentId },
    })

    // Add timeline entry
    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: id,
        event: 'Fichier supprime',
        description: attachment.originalName,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Fichier supprime',
    })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
