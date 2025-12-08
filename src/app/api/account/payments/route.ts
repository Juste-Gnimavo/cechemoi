import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = user.id
    const userPhone = user.phone

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    // Build where clause for order-linked payments
    const where: any = {
      order: {
        userId,
      },
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Fetch order payments with pagination
    const [payments, paymentsTotal] = await Promise.all([
      prisma.payment.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ])

    // Fetch PAID standalone invoices for this user (matched by phone)
    const standaloneInvoiceWhere: any = {
      orderId: null, // Standalone invoices only
      status: 'PAID',
      customerPhone: userPhone,
    }

    const [standaloneInvoices, invoicesTotal] = await Promise.all([
      prisma.invoice.findMany({
        where: standaloneInvoiceWhere,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { paidDate: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          customerName: true,
          paidDate: true,
          createdAt: true,
        },
      }),
      prisma.invoice.count({ where: standaloneInvoiceWhere }),
    ])

    // Transform standalone invoices to match payment format
    const invoicePayments = standaloneInvoices.map(inv => ({
      id: `inv_${inv.id}`,
      type: 'STANDALONE_INVOICE',
      amount: inv.total,
      status: 'COMPLETED',
      createdAt: inv.paidDate || inv.createdAt,
      invoice: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        customerName: inv.customerName,
      },
    }))

    const total = paymentsTotal + invoicesTotal

    return NextResponse.json({
      payments,
      standaloneInvoicePayments: invoicePayments,
      stats: {
        orderPayments: paymentsTotal,
        standaloneInvoicePayments: invoicesTotal,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Payments fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
