import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

// GET - Fetch all availability settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const availability = await prisma.adminAvailability.findMany({
      orderBy: { dayOfWeek: 'asc' }
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Create a new availability slot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { dayOfWeek, startTime, endTime, slotDuration, breakBetween, enabled } = body

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Check if availability already exists for this day
    const existing = await prisma.adminAvailability.findFirst({
      where: { dayOfWeek }
    })

    if (existing) {
      return NextResponse.json({ error: 'Une disponibilité existe déjà pour ce jour' }, { status: 400 })
    }

    const availability = await prisma.adminAvailability.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        slotDuration: slotDuration || 60,
        breakBetween: breakBetween || 15,
        enabled: enabled !== false
      }
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Update availability settings (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, dayOfWeek, startTime, endTime, slotDuration, breakBetween, enabled } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const availability = await prisma.adminAvailability.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(slotDuration !== undefined && { slotDuration }),
        ...(breakBetween !== undefined && { breakBetween }),
        ...(enabled !== undefined && { enabled })
      }
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Remove an availability slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await prisma.adminAvailability.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
