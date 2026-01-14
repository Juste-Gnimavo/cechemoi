import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import {
  syncPaymentToInvoice,
  deletePaymentAndSync,
} from '@/lib/custom-order-invoice-sync'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id]/payments - Get payments for order
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check order exists
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true, totalCost: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const payments = await prisma.customOrderPayment.findMany({
      where: { customOrderId: params.id },
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
    })

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = order.totalCost - totalPaid

    return NextResponse.json({
      success: true,
      payments,
      summary: {
        totalCost: order.totalCost,
        totalPaid,
        balance,
        isPaidInFull: balance <= 0,
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/custom-orders/[id]/payments - Add payment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, paymentType = 'INSTALLMENT', paymentMethod, notes, paidAt } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant requis et doit être positif' }, { status: 400 })
    }

    // Check order exists
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: { id: true, totalCost: true, orderNumber: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Get current total paid
    const existingPayments = await prisma.customOrderPayment.aggregate({
      where: { customOrderId: params.id },
      _sum: { amount: true },
    })

    const currentPaid = existingPayments._sum.amount || 0
    const newTotal = currentPaid + amount
    const balance = order.totalCost - newTotal

    // Determine payment type
    let finalPaymentType = paymentType
    if (balance <= 0) {
      finalPaymentType = 'FINAL'
    }

    // Create payment
    const payment = await prisma.customOrderPayment.create({
      data: {
        customOrderId: params.id,
        amount,
        paymentType: finalPaymentType,
        paymentMethod,
        notes,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        receivedById: (session.user as any).id,
      },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Sync payment to invoice and create receipt
    let receiptInfo = null
    try {
      const syncResult = await syncPaymentToInvoice(
        payment.id,
        params.id,
        (session.user as any).id
      )

      // Get the receipt info
      const receipt = await prisma.receipt.findUnique({
        where: { id: syncResult.receiptId },
        select: { id: true, receiptNumber: true },
      })
      receiptInfo = receipt
    } catch (syncError) {
      console.error('Error syncing payment:', syncError)
      // Continue even if sync fails
    }

    // Add timeline entry
    const paymentTypeLabels: Record<string, string> = {
      DEPOSIT: 'Avance',
      INSTALLMENT: 'Acompte',
      FINAL: 'Solde',
    }

    // Format amounts without toLocaleString to avoid Unicode issues
    const formatAmount = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: params.id,
        event: `Paiement reçu: ${paymentTypeLabels[finalPaymentType] || finalPaymentType}`,
        description: `${formatAmount(amount)} FCFA reçu${paymentMethod ? ` via ${paymentMethod}` : ''}. ${balance <= 0 ? 'Commande entièrement payée!' : `Reste: ${formatAmount(balance)} FCFA`}${receiptInfo ? ` - Reçu ${receiptInfo.receiptNumber}` : ''}`,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        receipt: receiptInfo,
      },
      summary: {
        totalCost: order.totalCost,
        totalPaid: newTotal,
        balance,
        isPaidInFull: balance <= 0,
      },
      receipt: receiptInfo,
      message: balance <= 0 ? 'Paiement complet!' : `Paiement enregistré. Reste: ${formatAmount(balance)} FCFA`,
    })
  } catch (error) {
    console.error('Error adding payment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/custom-orders/[id]/payments - Delete payment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN and MANAGER can delete payments
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: 'ID paiement requis' }, { status: 400 })
    }

    // Check payment exists
    const payment = await prisma.customOrderPayment.findFirst({
      where: {
        id: paymentId,
        customOrderId: params.id,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 })
    }

    // Delete payment and synced data (receipt, invoice payment)
    await deletePaymentAndSync(paymentId)

    // Format amount without toLocaleString
    const formatAmount = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    // Add timeline entry
    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: params.id,
        event: 'Paiement supprimé',
        description: `Paiement de ${formatAmount(payment.amount)} FCFA annulé`,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Paiement supprimé',
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
