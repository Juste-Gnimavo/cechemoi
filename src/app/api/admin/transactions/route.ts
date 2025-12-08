/**
 * API Route: Admin All Transactions
 * GET /api/admin/transactions - List all payment transactions from all sources
 *
 * Combines:
 * - Order payments (Payment table)
 * - Standalone payments (StandalonePayment table)
 * - Invoice payments (InvoicePayment table)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface UnifiedTransaction {
  id: string
  type: 'order' | 'standalone' | 'invoice'
  reference: string
  amount: number
  customerName: string
  customerPhone: string | null
  channel: string | null
  status: string
  createdAt: string
  paidAt: string | null
  relatedId: string | null
  relatedNumber: string | null
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Fetch from all sources
    const [orderPayments, standalonePayments, invoicePayments] = await Promise.all([
      // Order payments
      prisma.payment.findMany({
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              user: { select: { name: true, phone: true } },
              shippingAddress: { select: { fullName: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Standalone payments
      prisma.standalonePayment.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      // Invoice payments
      prisma.invoicePayment.findMany({
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Transform to unified format
    const allTransactions: UnifiedTransaction[] = []

    // Add order payments
    for (const p of orderPayments) {
      const customerName = p.order?.shippingAddress?.fullName || p.order?.user?.name || p.customerFirstName + ' ' + p.customerLastName
      const customerPhone = p.order?.shippingAddress?.phone || p.order?.user?.phone || p.customerPhone

      allTransactions.push({
        id: p.id,
        type: 'order',
        reference: p.reference || p.id,
        amount: p.amount,
        customerName: customerName || 'Client',
        customerPhone,
        channel: p.channel,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.transactionDate?.toISOString() || null,
        relatedId: p.orderId,
        relatedNumber: p.order?.orderNumber || null,
      })
    }

    // Add standalone payments
    for (const p of standalonePayments) {
      allTransactions.push({
        id: p.id,
        type: 'standalone',
        reference: p.reference,
        amount: p.amount,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        channel: p.channel,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() || null,
        relatedId: null,
        relatedNumber: null,
      })
    }

    // Add invoice payments
    for (const p of invoicePayments) {
      allTransactions.push({
        id: p.id,
        type: 'invoice',
        reference: p.reference || p.id,
        amount: p.amount,
        customerName: p.invoice.customerName,
        customerPhone: p.invoice.customerPhone,
        channel: null, // InvoicePayment doesn't track channel separately
        status: 'COMPLETED', // If payment exists, it was successful
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() || null,
        relatedId: p.invoiceId,
        relatedNumber: p.invoice.invoiceNumber,
      })
    }

    // Sort by creation date (newest first)
    allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply filters
    let filtered = allTransactions

    if (status && status !== 'ALL') {
      filtered = filtered.filter(t => t.status === status)
    }

    if (type && type !== 'ALL') {
      filtered = filtered.filter(t => t.type === type)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(t =>
        t.reference?.toLowerCase().includes(searchLower) ||
        t.customerName.toLowerCase().includes(searchLower) ||
        t.customerPhone?.toLowerCase().includes(searchLower) ||
        t.relatedNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate stats from filtered data
    const stats = {
      total: allTransactions.length,
      pending: allTransactions.filter(t => t.status === 'PENDING').length,
      completed: allTransactions.filter(t => t.status === 'COMPLETED').length,
      failed: allTransactions.filter(t => t.status === 'FAILED').length,
      totalAmount: allTransactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0),
      byType: {
        order: allTransactions.filter(t => t.type === 'order').length,
        standalone: allTransactions.filter(t => t.type === 'standalone').length,
        invoice: allTransactions.filter(t => t.type === 'invoice').length,
      },
    }

    // Paginate
    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const paginated = filtered.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      transactions: paginated,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('[Admin Transactions] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
