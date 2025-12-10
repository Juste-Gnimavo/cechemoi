import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        type: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous non trouve' }, { status: 404 })
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH update single appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, paymentStatus, adminNotes, paymentMethod, paidAmount } = body

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
      if (status === 'CONFIRMED') {
        updateData.confirmedAt = new Date()
        updateData.confirmedBy = user?.id
      } else if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
        updateData.completedBy = user?.id
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = user?.id
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        type: true
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
