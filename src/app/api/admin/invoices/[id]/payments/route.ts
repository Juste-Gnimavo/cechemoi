import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus, InvoicePaymentType } from '@prisma/client'
import { z } from 'zod'
import { generateReceiptNumber, getPaymentMethodLabel } from '@/lib/receipt-generator'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Payment methods for manual recording
const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'ORANGE_MONEY',    // Direct deposit to business Orange Money
  'MTN_MOBILE_MONEY', // Direct deposit to business MTN
  'MOOV_MONEY',      // Direct deposit to business Moov
  'WAVE',            // Direct deposit to business Wave
  'PAIEMENTPRO',     // Via PaiementPro gateway
  'CARD',            // Direct card payment
  'PAYPAL',          // Via PayPal link
  'OTHER',
] as const

// Payment types
const PAYMENT_TYPES = ['DEPOSIT', 'INSTALLMENT', 'FINAL'] as const

const addPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  paymentMethod: z.enum(PAYMENT_METHODS as unknown as [string, ...string[]]),
  paymentType: z.enum(PAYMENT_TYPES as unknown as [string, ...string[]]).optional(),
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
        receipt: {
          select: {
            id: true,
            receiptNumber: true,
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

    const { amount, paymentMethod, paymentType, reference, paidAt, notes } = validationResult.data

    // Get the invoice with customer info for receipt
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        amountPaid: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
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

    // Check if this is the first payment (for auto-detect DEPOSIT)
    const existingPaymentsCount = await prisma.invoicePayment.count({
      where: { invoiceId: params.id },
    })

    // Determine payment type:
    // - If balance = 0 after this payment → FINAL
    // - If no payment type specified and first payment → DEPOSIT
    // - Otherwise use specified type or default INSTALLMENT
    let finalPaymentType: InvoicePaymentType
    if (isFullyPaid) {
      finalPaymentType = InvoicePaymentType.FINAL
    } else if (paymentType) {
      finalPaymentType = paymentType as InvoicePaymentType
    } else if (existingPaymentsCount === 0) {
      finalPaymentType = InvoicePaymentType.DEPOSIT
    } else {
      finalPaymentType = InvoicePaymentType.INSTALLMENT
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date()

    // Generate receipt number for this payment
    const receiptNumber = await generateReceiptNumber()

    // Create payment, receipt, and update invoice in a transaction
    const [payment, receipt, updatedInvoice] = await prisma.$transaction([
      // Create the payment record
      prisma.invoicePayment.create({
        data: {
          invoiceId: params.id,
          amount,
          paymentMethod: paymentMethod as any,
          paymentType: finalPaymentType,
          reference: reference || null,
          paidAt: paymentDate,
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
      // Create receipt for this payment
      prisma.receipt.create({
        data: {
          receiptNumber,
          invoiceId: params.id,
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone || null,
          customerEmail: invoice.customerEmail || null,
          amount,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          createdById: (session.user as any).id,
          createdByName: (session.user as any).name || 'Admin',
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

    // Link receipt to payment
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { invoicePaymentId: payment.id },
    })

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        receipt: {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
        },
      },
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
      },
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

    // Get the payment with its receipt
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
        receipt: {
          select: {
            id: true,
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

    // Build transaction operations
    const transactionOperations = []

    // Delete associated receipt first if exists
    if (payment.receipt) {
      transactionOperations.push(
        prisma.receipt.delete({
          where: { id: payment.receipt.id },
        })
      )
    }

    // Delete payment
    transactionOperations.push(
      prisma.invoicePayment.delete({
        where: { id: paymentId },
      })
    )

    // Update invoice
    transactionOperations.push(
      prisma.invoice.update({
        where: { id: params.id },
        data: {
          amountPaid: Math.max(0, newAmountPaid),
          status: newStatus,
          // Clear paidDate if no longer fully paid
          ...(newAmountPaid < payment.invoice.total && { paidDate: null }),
        },
      })
    )

    // Execute transaction
    await prisma.$transaction(transactionOperations)

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
