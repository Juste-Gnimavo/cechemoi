import { prisma } from '@/lib/prisma'
import {
  formatXOF,
  labelCustomOrderStatus,
  periodLabel,
  resolveDateRange,
} from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'orderNumber', label: 'N° SM', width: 80 },
  { key: 'orderDate', label: 'Date cmd.', type: 'date', width: 60 },
  { key: 'pickupDate', label: 'Retrait', type: 'date', width: 60 },
  { key: 'customerName', label: 'Client', width: 120 },
  { key: 'customerPhone', label: 'Téléphone', width: 90 },
  { key: 'status', label: 'Statut', width: 80 },
  { key: 'priority', label: 'Priorité', width: 60 },
  { key: 'totalCost', label: 'Coût total', type: 'currency', width: 80, align: 'right' },
  { key: 'materialCost', label: 'Matériel', type: 'currency', width: 75, align: 'right' },
  { key: 'amountPaid', label: 'Encaissé', type: 'currency', width: 80, align: 'right' },
  { key: 'balance', label: 'Reliquat', type: 'currency', width: 80, align: 'right' },
]

export async function fetchCustomOrdersReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)

  const where: any = {
    orderDate: { gte: start, lte: end },
  }
  if (filters.status && filters.status !== 'all') where.status = filters.status

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25

  const [orders, total, agg, byStatus] = await Promise.all([
    prisma.customOrder.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { orderDate: 'desc' },
      ...(filters.exportMode
        ? {}
        : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.customOrder.count({ where }),
    prisma.customOrder.aggregate({
      where,
      _sum: { totalCost: true, materialCost: true },
    }),
    prisma.customOrder.groupBy({
      by: ['status'],
      where,
      _sum: { totalCost: true },
      _count: true,
    }),
  ])

  // Aggregate des paiements pour la période
  const paymentAgg = await prisma.customOrderPayment.aggregate({
    where: { customOrder: { orderDate: { gte: start, lte: end } } },
    _sum: { amount: true },
  })

  const rows = orders.map((o) => {
    const amountPaid = o.payments.reduce((s, p) => s + p.amount, 0)
    return {
      orderNumber: o.orderNumber,
      orderDate: o.orderDate,
      pickupDate: o.pickupDate,
      customerName: o.customer?.name || '—',
      customerPhone: o.customer?.phone || '—',
      status: labelCustomOrderStatus(o.status),
      priority: o.priority,
      totalCost: o.totalCost,
      materialCost: o.materialCost,
      amountPaid,
      balance: o.totalCost - amountPaid,
    }
  })

  return {
    family: 'custom-orders',
    title: FAMILY_TITLES['custom-orders'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de commandes', value: String(total) },
          { label: 'Coût total cumulé', value: formatXOF(agg._sum.totalCost || 0) },
          { label: 'Coût matériel cumulé', value: formatXOF(agg._sum.materialCost || 0) },
          { label: 'Total encaissé (période)', value: formatXOF(paymentAgg._sum.amount || 0) },
          {
            label: 'Reliquat estimé',
            value: formatXOF((agg._sum.totalCost || 0) - (paymentAgg._sum.amount || 0)),
          },
        ],
      },
      {
        title: 'Par statut',
        entries: byStatus.map((s) => ({
          label: `${labelCustomOrderStatus(s.status)} (${s._count})`,
          value: formatXOF(s._sum.totalCost || 0),
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
