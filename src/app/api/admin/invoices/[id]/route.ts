import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/invoices/[id] - Get invoice details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
            shippingAddress: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/invoices/[id] - Update invoice
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      status,
      dueDate,
      paidDate,
      issueDate,
      notes,
      items,
      sendNotification,
    } = body

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Update invoice
    const updateData: any = {}

    if (customerName !== undefined) updateData.customerName = customerName
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null
    if (issueDate !== undefined) updateData.issueDate = issueDate ? new Date(issueDate) : new Date()
    if (notes !== undefined) updateData.notes = notes

    // If status changed to PAID and no manual paidDate was provided, set paidDate automatically
    if (status === InvoiceStatus.PAID && !existingInvoice.paidDate && paidDate === undefined) {
      updateData.paidDate = new Date()
    }

    // Handle items update if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })

      // Create new items
      updateData.items = {
        create: items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          productId: item.productId || null,
        })),
      }

      // Recalculate totals
      const subtotal = items.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unitPrice,
        0
      )
      updateData.subtotal = subtotal
      updateData.total =
        subtotal +
        (existingInvoice.tax || 0) +
        (existingInvoice.shippingCost || 0) -
        (existingInvoice.discount || 0)
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: true,
        order: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Send notification when invoice is marked as PAID (only if notifications are enabled)
    if (status === InvoiceStatus.PAID && existingInvoice.status !== InvoiceStatus.PAID) {
      // If invoice is linked to an order, update order payment status
      if (invoice.orderId) {
        // Also update order payment status to COMPLETED
        await prisma.order.update({
          where: { id: invoice.orderId },
          data: { paymentStatus: 'COMPLETED' },
        })

        // Only send notification if sendNotification is not explicitly false
        if (sendNotification !== false) {
          // Build invoice URL for notification
          const baseUrl = process.env.NEXTAUTH_URL || 'https://cave-express.ci'
          const invoiceUrl = `${baseUrl}/api/invoices/${invoice.id}/pdf`

          notificationService.sendPaymentReceived(invoice.orderId, invoiceUrl).catch((error) => {
            console.error('Error sending payment received notification from invoice:', error)
          })

          // Send invoice paid notification with invoice URL
          notificationService.sendInvoicePaid(invoice.orderId, invoiceUrl).catch((error) => {
            console.error('Error sending invoice paid notification from invoice:', error)
          })

          // Send invoice PDF attachment via WhatsApp
          notificationService.sendInvoicePdfPaid(invoice.orderId, invoiceUrl).catch((error) => {
            console.error('Error sending invoice PDF attachment from invoice:', error)
          })
        }
      }
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la facture' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/invoices/[id] - Delete invoice with all related data
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé - Admin uniquement' },
        { status: 401 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        payments: true,
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Delete invoice (cascade deletes: InvoiceItem, InvoicePayment)
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Facture et données associées supprimées avec succès'
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la facture' },
      { status: 500 }
    )
  }
}
