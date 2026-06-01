import { prisma } from '@/lib/prisma'
import {
  formatXOF,
  labelChannel,
  labelCustomPaymentType,
  labelPaymentMethod,
  labelTransactionSource,
  periodLabel,
  resolveDateRange,
} from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'paidAt', label: 'Date', type: 'datetime', width: 90 },
  { key: 'reference', label: 'Référence', width: 110 },
  { key: 'source', label: 'Source', width: 80 },
  { key: 'linkedTo', label: 'Pièce liée', width: 110 },
  { key: 'customer', label: 'Client', width: 130 },
  { key: 'method', label: 'Méthode', width: 100 },
  { key: 'type', label: 'Type', width: 70 },
  { key: 'amount', label: 'Montant', type: 'currency', width: 90, align: 'right' },
]

export async function fetchTransactionsReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)
  const wantedType = filters.type && filters.type !== 'all' ? filters.type : null

  // 1. Paiements Order (Payment) — uniquement statut COMPLETED
  const orderPaymentsPromise =
    !wantedType || wantedType === 'online'
      ? prisma.payment.findMany({
          where: {
            status: 'COMPLETED',
            transactionDate: { gte: start, lte: end },
          },
          include: {
            order: { select: { orderNumber: true, user: { select: { name: true, phone: true } } } },
          },
        })
      : Promise.resolve([] as any[])

  // 2. CustomOrderPayment
  const customPaymentsPromise =
    !wantedType || wantedType === 'custom'
      ? prisma.customOrderPayment.findMany({
          where: { paidAt: { gte: start, lte: end } },
          include: {
            customOrder: {
              select: { orderNumber: true, customer: { select: { name: true, phone: true } } },
            },
          },
        })
      : Promise.resolve([] as any[])

  // 3. InvoicePayment — uniquement sur factures AUTONOMES.
  // Les paiements de factures liées à un Order sont déjà dans (1) via Payment,
  // ceux liés à un CustomOrder dans (2) via CustomOrderPayment. Sans ce filtre
  // on double-compterait le même flux d'argent.
  const invoicePaymentsPromise =
    !wantedType || wantedType === 'invoice'
      ? prisma.invoicePayment.findMany({
          where: {
            paidAt: { gte: start, lte: end },
            invoice: { orderId: null, customOrderId: null },
          },
          include: {
            invoice: { select: { invoiceNumber: true, customerName: true, customerPhone: true } },
          },
        })
      : Promise.resolve([] as any[])

  // 4. StandalonePayment
  const standalonePaymentsPromise =
    !wantedType || wantedType === 'standalone'
      ? prisma.standalonePayment.findMany({
          where: {
            status: 'COMPLETED',
            paidAt: { gte: start, lte: end },
          },
        })
      : Promise.resolve([] as any[])

  const [orderPayments, customPayments, invoicePayments, standalonePayments] = await Promise.all([
    orderPaymentsPromise,
    customPaymentsPromise,
    invoicePaymentsPromise,
    standalonePaymentsPromise,
  ])

  type Row = {
    paidAt: Date
    reference: string
    source: string
    linkedTo: string
    customer: string
    method: string
    type: string
    amount: number
  }

  const allRows: Row[] = []

  for (const p of orderPayments) {
    allRows.push({
      paidAt: p.transactionDate || p.createdAt,
      reference: p.reference,
      source: labelTransactionSource('online'),
      linkedTo: p.order?.orderNumber || '—',
      customer: p.order?.user?.name || `${p.customerFirstName} ${p.customerLastName}`.trim(),
      method: labelChannel(p.channel) !== '—' ? labelChannel(p.channel) : labelPaymentMethod(p.provider),
      type: 'Vente',
      amount: p.amount,
    })
  }

  for (const p of customPayments) {
    allRows.push({
      paidAt: p.paidAt,
      reference: p.id.slice(0, 12),
      source: labelTransactionSource('custom'),
      linkedTo: p.customOrder?.orderNumber || '—',
      customer: p.customOrder?.customer?.name || '—',
      method: labelPaymentMethod(p.paymentMethod || ''),
      type: labelCustomPaymentType(p.paymentType),
      amount: p.amount,
    })
  }

  for (const p of invoicePayments) {
    allRows.push({
      paidAt: p.paidAt,
      reference: p.reference || p.id.slice(0, 12),
      source: labelTransactionSource('invoice'),
      linkedTo: p.invoice?.invoiceNumber || '—',
      customer: p.invoice?.customerName || '—',
      method: labelPaymentMethod(p.paymentMethod),
      type: labelCustomPaymentType(p.paymentType),
      amount: p.amount,
    })
  }

  for (const p of standalonePayments) {
    allRows.push({
      paidAt: p.paidAt || p.createdAt,
      reference: p.reference,
      source: labelTransactionSource('standalone'),
      linkedTo: '—',
      customer: p.customerName,
      method: labelChannel(p.channel),
      type: 'Paiement',
      amount: p.amount,
    })
  }

  // Filtre méthode (sur libellé)
  let filteredRows = allRows
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    const target = labelPaymentMethod(filters.paymentMethod)
    filteredRows = filteredRows.filter((r) => r.method === target || r.method === labelChannel(filters.paymentMethod!))
  }

  // Tri par date desc
  filteredRows.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())

  const total = filteredRows.length
  const totalAmount = filteredRows.reduce((s, r) => s + r.amount, 0)

  // Ventilation par source
  const sourceMap = new Map<string, { count: number; total: number }>()
  for (const r of filteredRows) {
    const k = r.source
    const cur = sourceMap.get(k) || { count: 0, total: 0 }
    cur.count++
    cur.total += r.amount
    sourceMap.set(k, cur)
  }

  // Ventilation par méthode
  const methodMap = new Map<string, { count: number; total: number }>()
  for (const r of filteredRows) {
    const k = r.method || '—'
    const cur = methodMap.get(k) || { count: 0, total: 0 }
    cur.count++
    cur.total += r.amount
    methodMap.set(k, cur)
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25
  const rows = filters.exportMode
    ? filteredRows
    : filteredRows.slice((page - 1) * pageSize, page * pageSize)

  return {
    family: 'transactions',
    title: FAMILY_TITLES['transactions'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de transactions', value: String(total) },
          { label: 'Montant total encaissé', value: formatXOF(totalAmount) },
        ],
      },
      {
        title: 'Par source',
        entries: Array.from(sourceMap.entries()).map(([k, v]) => ({
          label: `${k} (${v.count})`,
          value: formatXOF(v.total),
        })),
      },
      {
        title: 'Par méthode',
        entries: Array.from(methodMap.entries()).map(([k, v]) => ({
          label: `${k} (${v.count})`,
          value: formatXOF(v.total),
        })),
      },
    ],
    columns: COLUMNS,
    rows: rows as unknown as Record<string, unknown>[],
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
