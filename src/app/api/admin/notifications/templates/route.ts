import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/notifications/templates - Get all notification templates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const trigger = searchParams.get('trigger')
    const channel = searchParams.get('channel')
    const enabled = searchParams.get('enabled')

    const where: any = {}
    if (trigger) where.trigger = trigger
    if (channel) where.channel = channel
    if (enabled !== null) where.enabled = enabled === 'true'

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: [
        { trigger: 'asc' },
        { channel: 'asc' },
      ],
    })

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('Error fetching notification templates:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modèles' },
      { status: 500 }
    )
  }
}

// POST /api/admin/notifications/templates - Create notification template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const body = await req.json()
    const {
      trigger,
      channel,
      name,
      description,
      recipientType,
      content,
      enabled,
    } = body

    if (!trigger || !channel || !name || !content) {
      return NextResponse.json(
        { error: 'Les champs requis sont manquants' },
        { status: 400 }
      )
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        trigger,
        channel,
        name,
        description,
        recipientType,
        content,
        enabled: enabled !== undefined ? enabled : true,
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error: any) {
    console.error('Error creating notification template:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un modèle avec ce déclencheur et canal existe déjà' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du modèle' },
      { status: 500 }
    )
  }
}
