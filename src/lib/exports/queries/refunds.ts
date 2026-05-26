import { prisma } from '@/lib/prisma'
import { formatXOF, periodLabel, resolveDateRange } from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processed: 'Traité',
  failed: 'Échec',
}

const COLUMNS: ReportColumn[] = [
  { key: 'createdAt', label: 'Demandé le', type: 'date', width: 80 },
  { key: 'processedAt', label: 'Traité le', type: 'date', width: 80 },
  { key: 'orderNumber', label: 'N° Commande', width: 100 },
  { key: 'customerName', label: 'Client', width: 140 },
  { key: 'refundType', label: 'Type', width: 70 },
  { key: 'status', label: 'Statut', width: 80 },
  { key: 'reason', label: 'Motif', width: 220 },
  { key: 'amount', label: 'Montant', type: 'currency', width: 90, align: 'right' },
]

export async function fetchRefundsReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)

  const where: any = {
    createdAt: { gte: start, lte: end },
  }
  if (filters.status && filters.status !== 'all') where.status = filters.status

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25

  const [refunds, total, agg, byStatus, byType] = await Promise.all([
    prisma.refund.findMany({
      where,
      include: {
        order: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      ...(filters.exportMode
        ? {}
        : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.refund.count({ where }),
    prisma.refund.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.refund.groupBy({
      by: ['status'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.refund.groupBy({
      by: ['refundType'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const rows = refunds.map((r) => ({
    createdAt: r.createdAt,
    processedAt: r.processedAt,
    orderNumber: r.order?.orderNumber || '—',
    customerName: r.order?.user?.name || '—',
    refundType: r.refundType === 'full' ? 'Total' : 'Partiel',
    status: STATUS_LABELS[r.status] || r.status,
    reason: r.reason || '—',
    amount: r.amount,
  }))

  return {
    family: 'refunds',
    title: FAMILY_TITLES['refunds'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de remboursements', value: String(total) },
          { label: 'Montant total remboursé', value: formatXOF(agg._sum.amount || 0) },
        ],
      },
      {
        title: 'Par statut',
        entries: byStatus.map((s) => ({
          label: `${STATUS_LABELS[s.status] || s.status} (${s._count})`,
          value: formatXOF(s._sum.amount || 0),
        })),
      },
      {
        title: 'Par type',
        entries: byType.map((t) => ({
          label: `${t.refundType === 'full' ? 'Total' : 'Partiel'} (${t._count})`,
          value: formatXOF(t._sum.amount || 0),
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
