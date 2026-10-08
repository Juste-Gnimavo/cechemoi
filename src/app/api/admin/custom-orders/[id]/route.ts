import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'
import { notifyCustomOrderStatusChange } from '@/lib/custom-order-status-notifications'
import { syncInvoiceItemsFromCustomOrder } from '@/lib/custom-order-invoice-sync'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id] - Get single custom order
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'custom-orders')
    if (denied) return denied

    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappNumber: true,
            email: true,
            city: true,
            country: true,
          },
        },
        measurement: true,
        items: {
          include: {
            tailor: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        payments: {
          include: {
            receivedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            receipt: {
              select: {
                id: true,
                receiptNumber: true,
              },
            },
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
        timeline: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            amountPaid: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Calculate financial summary
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = order.totalCost - totalPaid
    const profit = order.totalCost - order.materialCost

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        deposit: totalPaid,
        balance,
        profit,
      },
    })
  } catch (error) {
    console.error('Error fetching custom order:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/custom-orders/[id] - Update custom order
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'custom-orders')
    if (denied) return denied

    const body = await req.json()
    const {
      status,
      priority,
      pickupDate,
      customerDeadline,
      materialCost,
      notes,
      measurementId,
    } = body

    // Le total découle des articles (routes /items) : un total saisi à la main
    // ferait diverger la commande de sa facture
    if (body.totalCost !== undefined) {
      return NextResponse.json(
        { error: 'Le total se calcule à partir des articles : modifiez les articles de la commande' },
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, orderNumber: true, materialCost: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (pickupDate !== undefined) updateData.pickupDate = new Date(pickupDate)
    if (customerDeadline !== undefined)
      updateData.customerDeadline = customerDeadline ? new Date(customerDeadline) : null
    if (materialCost !== undefined) updateData.materialCost = materialCost
    if (notes !== undefined) updateData.notes = notes
    if (measurementId !== undefined) updateData.measurementId = measurementId

    // Update order
    const order = await prisma.customOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: true,
        payments: true,
      },
    })

    // The material cost is billed as an invoice line
    if (materialCost !== undefined && materialCost !== existingOrder.materialCost) {
      await syncInvoiceItemsFromCustomOrder(params.id)
    }

    // Add timeline entry if status changed
    if (status && status !== existingOrder.status) {
      const statusLabels: Record<string, string> = {
        PENDING: 'En attente',
        IN_PRODUCTION: 'En production',
        FITTING: 'Essayage prévu',
        ALTERATIONS: 'Retouches en cours',
        READY: 'Prêt',
        DELIVERED: 'Livré',
        CANCELLED: 'Annulé',
      }

      await prisma.customOrderTimeline.create({
        data: {
          customOrderId: params.id,
          event: `Statut changé: ${statusLabels[status] || status}`,
          description: `Statut mis à jour par ${(session.user as any).name || 'Admin'}`,
          userId: (session.user as any).id,
          userName: (session.user as any).name,
        },
      })

      // Notifications automatiques (cliente + copie propriétaire) — ne doit
      // jamais bloquer la mise à jour du statut
      try {
        await notifyCustomOrderStatusChange({
          customOrderId: params.id,
          previousStatus: existingOrder.status,
          newStatus: status,
          changedByName: (session.user as any).name,
        })
      } catch (notifError) {
        console.error('Status notification failed:', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Commande mise à jour',
    })
  } catch (error) {
    console.error('Error updating custom order:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/custom-orders/[id] - Delete custom order
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN and MANAGER can delete
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'custom-orders.delete')
    if (denied) return denied

    // Check if order exists
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true, orderNumber: true, status: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Prevent deleting delivered orders
    if (order.status === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une commande livrée' },
        { status: 400 }
      )
    }

    // Delete order (cascade will delete items, payments, timeline)
    await prisma.customOrder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: `Commande ${order.orderNumber} supprimée`,
    })
  } catch (error) {
    console.error('Error deleting custom order:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
