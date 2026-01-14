import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id]/timeline - Get timeline events
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check order exists
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const timeline = await prisma.customOrderTimeline.findMany({
      where: { customOrderId: params.id },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      timeline,
    })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/custom-orders/[id]/timeline - Add timeline event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { event, description, photos = [] } = body

    if (!event) {
      return NextResponse.json({ error: 'Évènement requis' }, { status: 400 })
    }

    // Check order exists
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const timelineEntry = await prisma.customOrderTimeline.create({
      data: {
        customOrderId: params.id,
        event,
        description,
        photos,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      timeline: timelineEntry,
      message: 'Evenement ajoute',
    })
  } catch (error) {
    console.error('Error adding timeline event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
