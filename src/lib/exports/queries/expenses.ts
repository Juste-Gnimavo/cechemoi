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

  // Charger toutes les catégories (table courte) : un parent sans dépense
  // directe doit apparaître si ses sous-catégories en ont
  const categories = await prisma.expenseCategory.findMany({
    select: { id: true, name: true, color: true, parentId: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  // Roll-up hiérarchique : sous-catégories agrégées dans leur catégorie
  // principale, détail par enfant conservé
  type CategoryAgg = {
    id: string
    name: string
    color: string | null
    count: number
    totalAmount: number
    children: { id: string; name: string; count: number; totalAmount: number }[]
  }
  const rollup = new Map<string, CategoryAgg>()
  for (const c of byCategoryRaw) {
    const cat = categoryMap.get(c.categoryId)
    if (!cat) continue
    const parent = cat.parentId ? categoryMap.get(cat.parentId) : undefined
    const root = parent || cat
    let agg = rollup.get(root.id)
    if (!agg) {
      agg = { id: root.id, name: root.name, color: root.color, count: 0, totalAmount: 0, children: [] }
      rollup.set(root.id, agg)
    }
    agg.count += c._count
    agg.totalAmount += c._sum.amount || 0
    if (parent) {
      agg.children.push({
        id: cat.id,
        name: cat.name,
        count: c._count,
        totalAmount: c._sum.amount || 0,
      })
    }
  }
  const rolledCategories = Array.from(rollup.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  )
  for (const agg of rolledCategories) {
    agg.children.sort((a, b) => b.totalAmount - a.totalAmount)
  }

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

  const totalAmount = agg._sum.amount || 0
  const sortedByMethod = [...byMethod].sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
  const dateParams = `startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}`

  return {
    family: 'expenses',
    title: FAMILY_TITLES['expenses'],
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: 'Totaux',
        entries: [
          { label: 'Nombre de dépenses', value: String(total) },
          { label: 'Montant total dépensé', value: formatXOF(totalAmount) },
        ],
      },
      {
        title: 'Par catégorie',
        // Parent puis sous-catégories indentées. « dont » explicite que le
        // montant enfant est déjà inclus dans le total parent (pas de double
        // comptage à la somme de la colonne dans Excel).
        entries: rolledCategories.flatMap((c) => [
          { label: `${c.name} (${c.count})`, value: formatXOF(c.totalAmount) },
          ...c.children.map((child) => ({
            label: `    dont ${child.name} (${child.count})`,
            value: formatXOF(child.totalAmount),
          })),
        ]),
      },
      {
        title: 'Par méthode',
        entries: sortedByMethod.map((m) => ({
          label: `${labelPaymentMethod(m.paymentMethod)} (${m._count})`,
          value: formatXOF(m._sum.amount || 0),
        })),
      },
    ],
    kpis: [
      { label: 'Total dépenses', value: formatXOF(totalAmount), tone: 'negative' },
      { label: 'Nombre de dépenses', value: String(total) },
      {
        label: 'Moyenne par dépense',
        value: total > 0 ? formatXOF(Math.round(totalAmount / total)) : formatXOF(0),
      },
    ],
    breakdowns: [
      {
        title: 'Par catégorie',
        total: totalAmount,
        items: rolledCategories.map((c) => ({
          label: c.name,
          value: c.totalAmount,
          count: c.count,
          color: c.color || undefined,
          href: `/admin/expenses?categoryId=${c.id}&${dateParams}`,
          children: c.children.map((child) => ({
            label: child.name,
            value: child.totalAmount,
            count: child.count,
            href: `/admin/expenses?categoryId=${child.id}&${dateParams}`,
          })),
        })),
      },
      {
        title: 'Par mode de paiement',
        total: totalAmount,
        items: sortedByMethod.map((m) => ({
          label: labelPaymentMethod(m.paymentMethod),
          value: m._sum.amount || 0,
          count: m._count,
          href: `/admin/expenses?paymentMethod=${m.paymentMethod}&${dateParams}`,
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total, page, pageSize },
  }
}
