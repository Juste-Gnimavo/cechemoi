import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/orders/[id]/notes - Add order note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { content, noteType = 'private' } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Le contenu de la note est requis' }, { status: 400 })
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Create note
    const note = await prisma.orderNote.create({
      data: {
        orderId: params.id,
        content: content.trim(),
        noteType,
        authorId: (session.user as any).id,
        authorName: (session.user as any).name || 'Admin',
      },
    })

    // If note is for customer, send notification (don't await to avoid blocking)
    if (noteType === 'customer') {
      notificationService.sendCustomerNote(params.id, content.trim()).catch((error) => {
        console.error('Error sending note notification:', error)
      })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Error creating order note:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la note' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders/[id]/notes - Get all order notes
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const notes = await prisma.orderNote.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Error fetching order notes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes' },
      { status: 500 }
    )
  }
}
