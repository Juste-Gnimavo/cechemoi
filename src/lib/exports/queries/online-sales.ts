import { prisma } from '@/lib/prisma'
import {
  formatXOF,
  labelOrderStatus,
  labelPaymentMethod,
  labelPaymentStatus,
  periodLabel,
  resolveDateRange,
} from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'orderNumber', label: 'N° Commande', width: 90 },
  { key: 'createdAt', label: 'Date', type: 'date', width: 60 },
  { key: 'customerName', label: 'Client', width: 130 },
  { key: 'customerPhone', label: 'Téléphone', width: 90 },
  { key: 'status', label: 'Statut', width: 75 },
  { key: 'paymentStatus', label: 'Paiement', width: 75 },
  { key: 'paymentMethod', label: 'Méthode', width: 90 },
  { key: 'subtotal', label: 'Sous-total', type: 'currency', width: 80, align: 'right' },
  { key: 'tax', label: 'Taxe', type: 'currency', width: 60, align: 'right' },
  { key: 'shippingCost', label: 'Livraison', type: 'currency', width: 70, align: 'right' },
  { key: 'discount', label: 'Remise', type: 'currency', width: 65, align: 'right' },
  { key: 'total', label: 'Total TTC', type: 'currency', width: 80, align: 'right' },
]

export async function fetchOnlineSalesReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)

  const where: any = {
    createdAt: { gte: start, lte: end },
  }
  if (filters.status && filters.status !== 'all') where.status = filters.status
  if (filters.paymentMethod && filters.paymentMethod !== 'all') where.paymentMethod = filters.paymentMethod

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25

  const [orders, total, agg, byPaymentMethod, byStatus] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...(filters.exportMode
        ? {}
        : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where,
      _sum: {
        total: true,
        subtotal: true,
        tax: true,
        shippingCost: true,
        discount: true,
      },
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _sum: { total: true },
      _count: true,
    }),
  ])

  const rows = orders.map((o) => ({
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    customerName: o.user?.name || '—',
    customerPhone: o.user?.phone || '—',
    status: labelOrderStatus(o.status),
    paymentStatus: labelPaymentStatus(o.paymentStatus),
    paymentMethod: labelPaymentMethod(o.paymentMethod),
    subtotal: o.subtotal,
    tax: o.tax,
    shippingCost: o.shippingCost,
    discount: o.discount,
    total: o.total,
  }))

  return {
    family: 'online-sales',
    title: FAMILY_TITLES['online-sales'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de commandes', value: String(total) },
          { label: 'Chiffre d\'affaires TTC', value: formatXOF(agg._sum.total || 0) },
          { label: 'Sous-total HT', value: formatXOF(agg._sum.subtotal || 0) },
          { label: 'Taxes', value: formatXOF(agg._sum.tax || 0) },
          { label: 'Livraison', value: formatXOF(agg._sum.shippingCost || 0) },
          { label: 'Remises accordées', value: formatXOF(agg._sum.discount || 0) },
        ],
      },
      {
        title: 'Par méthode de paiement',
        entries: byPaymentMethod.map((m) => ({
          label: `${labelPaymentMethod(m.paymentMethod)} (${m._count})`,
          value: formatXOF(m._sum.total || 0),
        })),
      },
      {
        title: 'Par statut',
        entries: byStatus.map((s) => ({
          label: `${labelOrderStatus(s.status)} (${s._count})`,
          value: formatXOF(s._sum.total || 0),
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
