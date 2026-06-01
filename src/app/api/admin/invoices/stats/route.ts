import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'
import { computeBilled, computeCashReceipts } from '@/lib/finance/aggregations'
import { resolveDateRange } from '@/lib/exports/formatters'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/invoices/stats - Get invoice statistics for a period
//
// Query params :
//   - period : 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom' (défaut: 'month' = 30 derniers jours)
//   - startDate / endDate : si period=custom
//
// Réponse :
//   - billedTotal     : Total facturé TTC (Invoice.total hors DRAFT/CANCELLED/REFUNDED, dans la période)
//   - cashReceipts    : Encaissé sur les factures autonomes dans la période
//   - outstanding     : Reste dû (billedTotal - amountPaid sur les factures de la période)
//   - byStatus        : Comptes par statut (toutes factures, peu importe la période — utile pour les badges de la liste)
//   - totalInvoices   : Compte global de factures (lifetime)
//   - thisMonth       : Bloc historique conservé pour back-compat (mois courant)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const { start, end } = resolveDateRange(
      searchParams.get('period'),
      searchParams.get('startDate'),
      searchParams.get('endDate'),
    )

    // ─── Counts par statut (lifetime) ───────────────────────────────────────
    // Sert à alimenter les badges "Brouillons", "Envoyées", "Payées" de la
    // page Caisse. Ces compteurs doivent rester globaux pour refléter l'état
    // de l'ensemble du carnet de factures, pas seulement la période.
    const allInvoices = await prisma.invoice.findMany({
      select: { id: true, status: true, dueDate: true },
    })

    const byStatus = {
      DRAFT: allInvoices.filter(i => i.status === InvoiceStatus.DRAFT).length,
      SENT: allInvoices.filter(i => i.status === InvoiceStatus.SENT).length,
      PAID: allInvoices.filter(i => i.status === InvoiceStatus.PAID).length,
      OVERDUE: allInvoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
      CANCELLED: allInvoices.filter(i => i.status === InvoiceStatus.CANCELLED).length,
      REFUNDED: allInvoices.filter(i => i.status === InvoiceStatus.REFUNDED).length,
    }

    // Mise à jour automatique des factures envoyées dont l'échéance est passée.
    const today = new Date()
    const overdueInvoices = allInvoices.filter(
      i => i.dueDate && new Date(i.dueDate) < today && i.status === InvoiceStatus.SENT,
    )
    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: { id: { in: overdueInvoices.map(i => i.id) } },
        data: { status: InvoiceStatus.OVERDUE },
      })
    }

    // ─── Période : facturé & encaissé via les helpers ───────────────────────
    const [billed, cashReceipts] = await Promise.all([
      computeBilled({ start, end }),
      computeCashReceipts({ start, end }),
    ])

    // Bloc historique "ce mois-ci" — conservé pour back-compat (consommé par
    // d'éventuels widgets historiques de la page invoices). Reste lifetime sur
    // le mois calendaire courant.
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthInvoicesCount = await prisma.invoice.count({
      where: { createdAt: { gte: firstDayOfMonth }, status: InvoiceStatus.PAID },
    })
    const thisMonthRevenueAgg = await prisma.invoice.aggregate({
      where: { createdAt: { gte: firstDayOfMonth }, status: InvoiceStatus.PAID },
      _sum: { total: true },
    })

    return NextResponse.json({
      success: true,
      stats: {
        // Compteurs globaux (lifetime, peu importe la période sélectionnée)
        totalInvoices: allInvoices.length,
        byStatus,
        // Période sélectionnée
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        billedTotal: billed.total,
        billedCount: billed.count,
        cashReceipts: cashReceipts.breakdown.standaloneInvoices,
        // Reste dû sur les factures émises dans la période
        outstanding: billed.outstanding,
        // Back-compat : valeurs historiques affichées par certains widgets
        totalRevenue: billed.paid,           // « Revenu » de la card = encaissé sur factures de la période
        overdueAmount: billed.byStatus.find(s => s.status === 'OVERDUE')?.total || 0,
        pendingAmount: billed.byStatus.find(s => s.status === 'SENT')?.total || 0,
        averageInvoiceValue: byStatus.PAID > 0 ? billed.paid / byStatus.PAID : 0,
        thisMonth: {
          invoices: thisMonthInvoicesCount,
          revenue: thisMonthRevenueAgg._sum.total || 0,
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
