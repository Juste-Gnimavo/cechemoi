import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/invoices/stats - Get invoice statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get all invoices
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        status: true,
        total: true,
        dueDate: true,
        paidDate: true,
        createdAt: true,
      },
    })

    // Calculate statistics
    const totalInvoices = invoices.length

    const byStatus = {
      DRAFT: invoices.filter(i => i.status === InvoiceStatus.DRAFT).length,
      SENT: invoices.filter(i => i.status === InvoiceStatus.SENT).length,
      PAID: invoices.filter(i => i.status === InvoiceStatus.PAID).length,
      OVERDUE: invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
      CANCELLED: invoices.filter(i => i.status === InvoiceStatus.CANCELLED).length,
      REFUNDED: invoices.filter(i => i.status === InvoiceStatus.REFUNDED).length,
    }

    // Total revenue (paid invoices only)
    const totalRevenue = invoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + i.total, 0)

    // Overdue amount
    const overdueAmount = invoices
      .filter(i => i.status === InvoiceStatus.OVERDUE)
      .reduce((sum, i) => sum + i.total, 0)

    // Pending amount (DRAFT + SENT)
    const pendingAmount = invoices
      .filter(i => i.status === InvoiceStatus.DRAFT || i.status === InvoiceStatus.SENT)
      .reduce((sum, i) => sum + i.total, 0)

    // Average invoice value
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / byStatus.PAID : 0

    // This month statistics
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisMonthInvoices = invoices.filter(
      i => new Date(i.createdAt) >= firstDayOfMonth
    )

    const thisMonthRevenue = thisMonthInvoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + i.total, 0)

    // Check for overdue invoices (update status if needed)
    const today = new Date()
    const overdueInvoices = invoices.filter(
      i =>
        i.dueDate &&
        new Date(i.dueDate) < today &&
        i.status === InvoiceStatus.SENT
    )

    // Update overdue invoices status
    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: {
          id: {
            in: overdueInvoices.map(i => i.id),
          },
        },
        data: {
          status: InvoiceStatus.OVERDUE,
        },
      })
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalInvoices,
        byStatus,
        totalRevenue,
        overdueAmount,
        pendingAmount,
        averageInvoiceValue,
        thisMonth: {
          invoices: thisMonthInvoices.length,
          revenue: thisMonthRevenue,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching invoice stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
