import { prisma } from '@/lib/prisma'
import { formatXOF, labelPaymentMethod, periodLabel, resolveDateRange } from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'paymentDate', label: 'Date', type: 'date', width: 70 },
  { key: 'category', label: 'Catégorie', width: 120 },
  { key: 'description', label: 'Description', width: 220 },
  { key: 'reference', label: 'Référence', width: 100 },
  { key: 'paymentMethod', label: 'Méthode', width: 100 },
  { key: 'staffName', label: 'Bénéficiaire', width: 120 },
  { key: 'createdByName', label: 'Saisi par', width: 100 },
  { key: 'amount', label: 'Montant', type: 'currency', width: 95, align: 'right' },
]

export async function fetchExpensesReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)

  const where: any = {
    paymentDate: { gte: start, lte: end },
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'all') where.paymentMethod = filters.paymentMethod

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25

  const [expenses, total, agg, byCategoryRaw, byMethod] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: { select: { name: true } },
        staff: { select: { name: true } },
      },
      orderBy: { paymentDate: 'desc' },
      ...(filters.exportMode
        ? {}
        : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
  ])

  // Charger noms de catégories
  const categoryIds = byCategoryRaw.map((c) => c.categoryId)
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const rows = expenses.map((e) => ({
    paymentDate: e.paymentDate,
    category: e.category?.name || '—',
    description: e.description,
    reference: e.reference || '—',
    paymentMethod: labelPaymentMethod(e.paymentMethod),
    staffName: e.staff?.name || '—',
    createdByName: e.createdByName || '—',
    amount: e.amount,
  }))

  return {
    family: 'expenses',
    title: FAMILY_TITLES['expenses'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de dépenses', value: String(total) },
          { label: 'Montant total dépensé', value: formatXOF(agg._sum.amount || 0) },
        ],
      },
      {
        title: 'Par catégorie',
        entries: byCategoryRaw.map((c) => ({
          label: `${categoryMap.get(c.categoryId) || '—'} (${c._count})`,
          value: formatXOF(c._sum.amount || 0),
        })),
      },
      {
        title: 'Par méthode',
        entries: byMethod.map((m) => ({
          label: `${labelPaymentMethod(m.paymentMethod)} (${m._count})`,
          value: formatXOF(m._sum.amount || 0),
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
