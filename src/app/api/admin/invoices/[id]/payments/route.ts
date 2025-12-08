import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'
import { z } from 'zod'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Payment methods for manual recording
const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'ORANGE_MONEY',    // Direct deposit to business Orange Money
  'MTN_MOBILE_MONEY', // Direct deposit to business MTN
  'WAVE',            // Direct deposit to business Wave
  'PAIEMENTPRO',     // Via PaiementPro gateway
  'CARD',            // Direct card payment
  'PAYPAL',          // Via PayPal link
  'OTHER',
] as const

const addPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  paymentMethod: z.enum(PAYMENT_METHODS as unknown as [string, ...string[]]),
  reference: z.string().optional().nullable(),
  paidAt: z.string().optional(), // ISO date string
  notes: z.string().optional().nullable(),
})

// GET /api/admin/invoices/[id]/payments - Get all payments for an invoice
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    // Get invoice to calculate remaining balance
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: {
        total: true,
        amountPaid: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      payments,
      summary: {
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        remainingBalance: invoice.total - invoice.amountPaid,
      },
    })
  } catch (error) {
    console.error('Error fetching invoice payments:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    )
  }
}

// POST /api/admin/invoices/[id]/payments - Add a payment to an invoice
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const validationResult = addPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount, paymentMethod, reference, paidAt, notes } = validationResult.data

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        amountPaid: true,
        status: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Check if invoice is already fully paid
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cette facture est déjà entièrement payée' },
        { status: 400 }
      )
    }

    // Check if invoice is cancelled or refunded
    if (['CANCELLED', 'REFUNDED'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'Impossible d\'ajouter un paiement à une facture annulée ou remboursée' },
        { status: 400 }
      )
    }

    // Calculate remaining balance
    const remainingBalance = invoice.total - invoice.amountPaid

    // Warn if payment exceeds remaining balance (but still allow it)
    if (amount > remainingBalance) {
      // Allow overpayment but could add a note
      console.warn(`Payment of ${amount} exceeds remaining balance of ${remainingBalance} for invoice ${invoice.invoiceNumber}`)
    }

    // Calculate new total paid
    const newAmountPaid = invoice.amountPaid + amount
    const isFullyPaid = newAmountPaid >= invoice.total

    // Determine new status
    let newStatus: InvoiceStatus = invoice.status as InvoiceStatus
    if (isFullyPaid) {
      newStatus = InvoiceStatus.PAID
    } else if (newAmountPaid > 0) {
      newStatus = InvoiceStatus.PARTIAL
    }

    // Create payment and update invoice in a transaction
    const [payment, updatedInvoice] = await prisma.$transaction([
      // Create the payment record
      prisma.invoicePayment.create({
        data: {
          invoiceId: params.id,
          amount,
          paymentMethod: paymentMethod as any,
          reference: reference || null,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          notes: notes || null,
          createdById: (session.user as any).id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      // Update invoice totals and status
      prisma.invoice.update({
        where: { id: params.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
          // Set paidDate when fully paid
          ...(isFullyPaid && { paidDate: new Date() }),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      payment,
      invoice: {
        amountPaid: updatedInvoice.amountPaid,
        remainingBalance: updatedInvoice.total - updatedInvoice.amountPaid,
        status: updatedInvoice.status,
        isFullyPaid,
      },
      message: isFullyPaid
        ? 'Paiement enregistré - Facture entièrement payée!'
        : `Paiement de ${Math.round(amount)} CFA enregistré`,
    })
  } catch (error) {
    console.error('Error adding invoice payment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du paiement' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/invoices/[id]/payments - Delete a payment
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

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID du paiement requis' },
        { status: 400 }
      )
    }

    // Get the payment
    const payment = await prisma.invoicePayment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          select: {
            id: true,
            total: true,
            amountPaid: true,
            status: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 })
    }

    if (payment.invoiceId !== params.id) {
      return NextResponse.json(
        { error: 'Ce paiement n\'appartient pas à cette facture' },
        { status: 400 }
      )
    }

    // Calculate new amount paid
    const newAmountPaid = payment.invoice.amountPaid - payment.amount

    // Determine new status
    let newStatus: InvoiceStatus = payment.invoice.status as InvoiceStatus
    if (newAmountPaid <= 0) {
      newStatus = InvoiceStatus.SENT // Back to unpaid
    } else if (newAmountPaid < payment.invoice.total) {
      newStatus = InvoiceStatus.PARTIAL
    }

    // Delete payment and update invoice
    await prisma.$transaction([
      prisma.invoicePayment.delete({
        where: { id: paymentId },
      }),
      prisma.invoice.update({
        where: { id: params.id },
        data: {
          amountPaid: Math.max(0, newAmountPaid),
          status: newStatus,
          // Clear paidDate if no longer fully paid
          ...(newAmountPaid < payment.invoice.total && { paidDate: null }),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Paiement supprimé',
      newAmountPaid: Math.max(0, newAmountPaid),
      newStatus,
    })
  } catch (error) {
    console.error('Error deleting invoice payment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du paiement' },
      { status: 500 }
    )
  }
}
