import { prisma } from '@/lib/prisma'
import {
  formatXOF,
  labelInvoiceSource,
  labelInvoiceStatus,
  periodLabel,
  resolveDateRange,
} from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'invoiceNumber', label: 'N° Facture', width: 95 },
  { key: 'issueDate', label: 'Émise le', type: 'date', width: 65 },
  { key: 'dueDate', label: 'Échéance', type: 'date', width: 65 },
  { key: 'paidDate', label: 'Payée le', type: 'date', width: 65 },
  { key: 'source', label: 'Origine', width: 70 },
  { key: 'customerName', label: 'Client', width: 130 },
  { key: 'status', label: 'Statut', width: 80 },
  { key: 'subtotal', label: 'Sous-total', type: 'currency', width: 80, align: 'right' },
  { key: 'tax', label: 'TVA', type: 'currency', width: 60, align: 'right' },
  { key: 'total', label: 'Total TTC', type: 'currency', width: 80, align: 'right' },
  { key: 'amountPaid', label: 'Encaissé', type: 'currency', width: 80, align: 'right' },
  { key: 'balance', label: 'Reste dû', type: 'currency', width: 80, align: 'right' },
]

export async function fetchInvoicesReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)

  const where: any = {
    issueDate: { gte: start, lte: end },
  }
  // Par défaut, on ne considère facturé QUE les factures émises et non annulées.
  // Une DRAFT n'a juridiquement pas été envoyée, une CANCELLED/REFUNDED ne
  // représente plus un montant dû. Si le user sélectionne explicitement un
  // de ces statuts, on respecte son choix (override volontaire pour audit).
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  } else {
    where.status = { notIn: ['DRAFT', 'CANCELLED', 'REFUNDED'] }
  }

  // Filtre par origine
  if (filters.source === 'online') where.orderId = { not: null }
  else if (filters.source === 'custom') where.customOrderId = { not: null }
  else if (filters.source === 'standalone') {
    where.orderId = null
    where.customOrderId = null
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25

  const [invoices, total, agg, byStatus] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      ...(filters.exportMode
        ? {}
        : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: { total: true, subtotal: true, tax: true, amountPaid: true },
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where,
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),
  ])

  // Encaissé : PAID compté comme totalement encaissé (source de vérité = status,
  // pas amountPaid, à cause des dérives historiques). Voir Billed.paid.
  const totalEncaisse = byStatus.reduce((acc, g) => {
    if (g.status === 'PAID') return acc + (g._sum.total || 0)
    return acc + (g._sum.amountPaid || 0)
  }, 0)
  const totalFacture = agg._sum.total || 0

  // Ventilation par origine
  const allForSource = await prisma.invoice.findMany({
    where,
    select: { orderId: true, customOrderId: true, total: true, amountPaid: true },
  })
  const bySource = { online: { count: 0, total: 0 }, custom: { count: 0, total: 0 }, standalone: { count: 0, total: 0 } }
  for (const inv of allForSource) {
    if (inv.orderId) {
      bySource.online.count++
      bySource.online.total += inv.total
    } else if (inv.customOrderId) {
      bySource.custom.count++
      bySource.custom.total += inv.total
    } else {
      bySource.standalone.count++
      bySource.standalone.total += inv.total
    }
  }

  const rows = invoices.map((i) => ({
    invoiceNumber: i.invoiceNumber,
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    paidDate: i.paidDate,
    source: labelInvoiceSource(i),
    customerName: i.customerName,
    status: labelInvoiceStatus(i.status),
    subtotal: i.subtotal,
    tax: i.tax,
    total: i.total,
    amountPaid: i.amountPaid,
    balance: i.total - i.amountPaid,
  }))

  // Détail des encaissements pour le bloc "Détail" — aide le CEO à comprendre
  // d'où sortent le Total encaissé et le Reste dû, en décomposant par statut.
  const paidStatus = byStatus.find(s => s.status === 'PAID')
  const partialStatus = byStatus.find(s => s.status === 'PARTIAL')
  const sentStatus = byStatus.find(s => s.status === 'SENT')
  const overdueStatus = byStatus.find(s => s.status === 'OVERDUE')

  const encaissePaid = paidStatus?._sum.total || 0
  const encaissePartialAcomptes = partialStatus?._sum.amountPaid || 0
  const restePartialSolde = (partialStatus?._sum.total || 0) - encaissePartialAcomptes
  const resteSent = sentStatus?._sum.total || 0
  const resteOverdue = overdueStatus?._sum.total || 0

  return {
    family: 'invoices',
    title: FAMILY_TITLES['invoices'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de factures', value: String(total) },
          { label: 'Total facturé TTC', value: formatXOF(totalFacture) },
          { label: 'Total encaissé', value: formatXOF(totalEncaisse) },
          { label: 'Reste dû', value: formatXOF(Math.max(0, totalFacture - totalEncaisse)) },
        ],
      },
      {
        title: 'Détail encaissement / reste dû',
        entries: [
          { label: `Factures totalement payées (${paidStatus?._count || 0})`, value: formatXOF(encaissePaid) },
          { label: `Acomptes reçus sur partielles (${partialStatus?._count || 0})`, value: formatXOF(encaissePartialAcomptes) },
          { label: `Solde restant sur partielles`, value: formatXOF(Math.max(0, restePartialSolde)) },
          { label: `Factures envoyées non payées (${sentStatus?._count || 0})`, value: formatXOF(resteSent) },
          { label: `Factures en retard (${overdueStatus?._count || 0})`, value: formatXOF(resteOverdue) },
        ],
      },
      {
        title: 'Par origine',
        entries: [
          { label: `En ligne (${bySource.online.count})`, value: formatXOF(bySource.online.total) },
          { label: `Sur mesure (${bySource.custom.count})`, value: formatXOF(bySource.custom.total) },
          { label: `Autonome (${bySource.standalone.count})`, value: formatXOF(bySource.standalone.total) },
        ],
      },
      {
        title: 'Par statut',
        entries: byStatus.map((s) => ({
          label: `${labelInvoiceStatus(s.status)} (${s._count})`,
          value: formatXOF(s._sum.total || 0),
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
