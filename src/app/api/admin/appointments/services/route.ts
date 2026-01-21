import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

// GET - Fetch all consultation services (including disabled)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const services = await prisma.consultationType.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, duration, features, color, icon, enabled, requiresPayment, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    // Generate slug
    let slug = generateSlug(name)

    // Check if slug exists
    const existing = await prisma.consultationType.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    // Get max sortOrder if not provided
    let finalSortOrder = sortOrder
    if (finalSortOrder === undefined) {
      const maxOrder = await prisma.consultationType.aggregate({
        _max: { sortOrder: true }
      })
      finalSortOrder = (maxOrder._max.sortOrder || 0) + 1
    }

    const service = await prisma.consultationType.create({
      data: {
        name,
        slug,
        description: description || '',
        price: price || 0,
        duration: duration || 60,
        features: features || [],
        color: color || '#8b5cf6',
        icon: icon || 'sparkles',
        enabled: enabled !== false,
        requiresPayment: requiresPayment !== false,
        sortOrder: finalSortOrder
      }
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Update a service
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!session || !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, price, duration, features, color, icon, enabled, requiresPayment, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) {
      updateData.name = name
      // Update slug if name changes
      const newSlug = generateSlug(name)
      const existing = await prisma.consultationType.findFirst({
        where: { slug: newSlug, NOT: { id } }
      })
      if (!existing) {
        updateData.slug = newSlug
      }
    }
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (duration !== undefined) updateData.duration = duration
    if (features !== undefined) updateData.features = features
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (enabled !== undefined) updateData.enabled = enabled
    if (requiresPayment !== undefined) updateData.requiresPayment = requiresPayment
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const service = await prisma.consultationType.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Remove a service
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

    // Check if service has appointments
    const appointmentsCount = await prisma.appointment.count({
      where: { typeId: id }
    })

    if (appointmentsCount > 0) {
      return NextResponse.json({
        error: `Ce service a ${appointmentsCount} rendez-vous. Désactivez-le plutôt que de le supprimer.`
      }, { status: 400 })
    }

    await prisma.consultationType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
