import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/admin/custom-orders/[id]/items - Add item to order
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { garmentType, customType, description, quantity = 1, unitPrice = 0, tailorId, estimatedHours } = body

    if (!garmentType) {
      return NextResponse.json({ error: 'Type de tenue requis' }, { status: 400 })
    }

    // Check order exists
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true, totalCost: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Create item
    const item = await prisma.customOrderItem.create({
      data: {
        customOrderId: params.id,
        garmentType,
        customType,
        description,
        quantity,
        unitPrice,
        tailorId,
        estimatedHours,
      },
      include: {
        tailor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update order total cost
    const newTotal = order.totalCost + unitPrice * quantity
    await prisma.customOrder.update({
      where: { id: params.id },
      data: { totalCost: newTotal },
    })

    // Add timeline entry
    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: params.id,
        event: 'Article ajouté',
        description: `${garmentType}${customType ? ` (${customType})` : ''} ajouté à la commande`,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      item,
      message: 'Article ajouté',
    })
  } catch (error) {
    console.error('Error adding item:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/custom-orders/[id]/items - Update item (requires itemId in body)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Allow TAILOR to update status only
    const userRole = (session?.user as any)?.role
    if (!session || !['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { itemId, status, tailorId, startedAt, completedAt, actualHours, notes, garmentType, customType, description, quantity, unitPrice, estimatedHours } = body

    if (!itemId) {
      return NextResponse.json({ error: 'ID article requis' }, { status: 400 })
    }

    // Check item exists and belongs to this order
    const existingItem = await prisma.customOrderItem.findFirst({
      where: {
        id: itemId,
        customOrderId: params.id,
      },
      select: {
        id: true,
        status: true,
        tailorId: true,
        unitPrice: true,
        quantity: true,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    // If TAILOR, can only update their own items and only status/hours
    if (userRole === 'TAILOR') {
      if (existingItem.tailorId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Vous ne pouvez modifier que vos articles assignés' }, { status: 403 })
      }
      // Tailors can only update: status, startedAt, completedAt, actualHours, notes
    }

    // Build update data
    const updateData: any = {}

    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (actualHours !== undefined) updateData.actualHours = actualHours

    // Set startedAt when status changes from PENDING
    if (status && status !== 'PENDING' && !existingItem.status.includes('PENDING')) {
      // Already started, don't change
    } else if (status && status !== 'PENDING') {
      updateData.startedAt = new Date()
    }

    // Set completedAt when status is COMPLETED or DELIVERED
    if (status === 'COMPLETED' || status === 'DELIVERED') {
      updateData.completedAt = new Date()
    }

    // Only non-tailors can update these fields
    if (userRole !== 'TAILOR') {
      if (tailorId !== undefined) updateData.tailorId = tailorId
      if (garmentType !== undefined) updateData.garmentType = garmentType
      if (customType !== undefined) updateData.customType = customType
      if (description !== undefined) updateData.description = description
      if (quantity !== undefined) updateData.quantity = quantity
      if (unitPrice !== undefined) updateData.unitPrice = unitPrice
      if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
      if (startedAt !== undefined) updateData.startedAt = startedAt ? new Date(startedAt) : null
      if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null
    }

    // Update item
    const item = await prisma.customOrderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        tailor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update order total if price/quantity changed
    if (unitPrice !== undefined || quantity !== undefined) {
      const allItems = await prisma.customOrderItem.findMany({
        where: { customOrderId: params.id },
        select: { unitPrice: true, quantity: true },
      })
      const newTotal = allItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      await prisma.customOrder.update({
        where: { id: params.id },
        data: { totalCost: newTotal },
      })
    }

    // Add timeline entry for status change
    if (status && status !== existingItem.status) {
      const statusLabels: Record<string, string> = {
        PENDING: 'En attente',
        CUTTING: 'Coupe en cours',
        SEWING: 'Couture en cours',
        FITTING: 'Essayage',
        ALTERATIONS: 'Retouches',
        FINISHING: 'Finitions',
        COMPLETED: 'Terminé',
        DELIVERED: 'Livré',
      }

      await prisma.customOrderTimeline.create({
        data: {
          customOrderId: params.id,
          event: `${item.garmentType}: ${statusLabels[status] || status}`,
          description: `Mis à jour par ${(session.user as any).name || 'Utilisateur'}`,
          userId: (session.user as any).id,
          userName: (session.user as any).name,
        },
      })
    }

    return NextResponse.json({
      success: true,
      item,
      message: 'Article mis à jour',
    })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/custom-orders/[id]/items - Delete item (requires itemId in body)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'ID article requis' }, { status: 400 })
    }

    // Check item exists
    const item = await prisma.customOrderItem.findFirst({
      where: {
        id: itemId,
        customOrderId: params.id,
      },
      select: {
        id: true,
        garmentType: true,
        unitPrice: true,
        quantity: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    // Delete item
    await prisma.customOrderItem.delete({
      where: { id: itemId },
    })

    // Update order total
    const allItems = await prisma.customOrderItem.findMany({
      where: { customOrderId: params.id },
      select: { unitPrice: true, quantity: true },
    })
    const newTotal = allItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    await prisma.customOrder.update({
      where: { id: params.id },
      data: { totalCost: newTotal },
    })

    // Add timeline entry
    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: params.id,
        event: 'Article supprimé',
        description: `${item.garmentType} retiré de la commande`,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Article supprimé',
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
