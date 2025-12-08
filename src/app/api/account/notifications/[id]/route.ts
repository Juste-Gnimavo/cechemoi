import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { id } = await params
    const { read } = await req.json()

    // Check if notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 })
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: read ?? true },
    })

    return NextResponse.json({ notification: updatedNotification })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Check if notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 })
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification deletion error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
