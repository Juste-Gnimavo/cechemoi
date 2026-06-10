import { prisma } from '@/lib/prisma'
import { formatXOF, periodLabel, resolveDateRange } from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'name', label: 'Client', width: 130 },
  { key: 'phone', label: 'Téléphone', width: 90 },
  { key: 'email', label: 'Email', width: 130 },
  { key: 'city', label: 'Ville', width: 75 },
  { key: 'createdAt', label: 'Inscription', type: 'date', width: 65 },
  { key: 'ordersCount', label: 'Achats payés', type: 'number', width: 60, align: 'right' },
  { key: 'totalSpent', label: 'Total dépensé', type: 'currency', width: 90, align: 'right' },
  { key: 'avgOrderValue', label: 'Panier moyen', type: 'currency', width: 85, align: 'right' },
  { key: 'lastOrderAt', label: 'Dernier achat', type: 'date', width: 70 },
  { key: 'segment', label: 'Segment', width: 75 },
]

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000
const EXCLUDED_INVOICE_STATUSES = ['DRAFT', 'CANCELLED', 'REFUNDED']

/**
 * Rapport CRM — Clients.
 *
 * Deux lectures possibles via le filtre `dateBasis` :
 *  - 'registered' (défaut) : clients INSCRITS sur la période (cohorte d'acquisition).
 *  - 'active'              : clients ayant PAYÉ quelque chose sur la période
 *                            (commande en ligne encaissée OU versement facture).
 *
 * Les métriques par client sont TOUJOURS calculées sur la vie entière — la
 * période ne fait que sélectionner quels clients apparaissent.
 *
 * Le revenu par client est basé sur les FACTURES (source de vérité du CA :
 * les commandes en ligne, le sur-mesure et les ventes autonomes génèrent
 * toutes une facture). Sémantique identique au rapport Factures :
 * PAID → total TTC encaissé, sinon amountPaid (acomptes). Les commandes en
 * ligne COMPLETED sans facture (historique) sont ajoutées en complément.
 *
 * Rattachement facture → client :
 *  - facture de commande en ligne : order.userId
 *  - facture sur-mesure           : customOrder.customerId
 *  - facture autonome             : customerPhone == user.phone (même
 *    approche que /api/admin/customers)
 */
export async function fetchClientsReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)
  const dateBasis = filters.dateBasis === 'active' ? 'active' : 'registered'
  const segment = filters.segment && filters.segment !== 'all' ? filters.segment : null

  const userWhere: any = { role: 'CUSTOMER' }

  if (dateBasis === 'registered') {
    userWhere.createdAt = { gte: start, lte: end }
  } else {
    // Mode 'active' : clients ayant encaissé une commande en ligne sur la
    // période OU dont une facture a reçu un paiement sur la période.
    const [activeGroups, activeInvoices] = await Promise.all([
      prisma.order.groupBy({
        by: ['userId'],
        where: { paymentStatus: 'COMPLETED', createdAt: { gte: start, lte: end } },
      }),
      prisma.invoice.findMany({
        where: {
          status: { notIn: EXCLUDED_INVOICE_STATUSES as any },
          OR: [
            { paidDate: { gte: start, lte: end } },
            { payments: { some: { paidAt: { gte: start, lte: end } } } },
          ],
        },
        select: {
          customerPhone: true,
          order: { select: { userId: true } },
          customOrder: { select: { customerId: true } },
        },
      }),
    ])
    const activeIds = new Set<string>(activeGroups.map((g) => g.userId))
    const activePhones = new Set<string>()
    for (const inv of activeInvoices) {
      const uid = inv.order?.userId ?? inv.customOrder?.customerId
      if (uid) activeIds.add(uid)
      else if (inv.customerPhone) activePhones.add(inv.customerPhone)
    }
    if (activeIds.size === 0 && activePhones.size === 0) {
      return emptyReport(start, end, period)
    }
    userWhere.OR = [
      ...(activeIds.size ? [{ id: { in: Array.from(activeIds) } }] : []),
      ...(activePhones.size ? [{ phone: { in: Array.from(activePhones) } }] : []),
    ]
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      city: true,
      howDidYouHearAboutUs: true,
      createdAt: true,
      orders: {
        select: {
          total: true,
          createdAt: true,
          paymentStatus: true,
          invoice: { select: { id: true } },
        },
      },
    },
  })

  // Factures rattachées à la cohorte (vie entière, hors brouillons/annulées)
  const userIds = users.map((u) => u.id)
  const phones = users.map((u) => u.phone).filter(Boolean) as string[]
  const phoneToUserId = new Map<string, string>()
  for (const u of users) {
    if (u.phone && !phoneToUserId.has(u.phone)) phoneToUserId.set(u.phone, u.id)
  }

  const invoices = userIds.length
    ? await prisma.invoice.findMany({
        where: {
          status: { notIn: EXCLUDED_INVOICE_STATUSES as any },
          OR: [
            { order: { userId: { in: userIds } } },
            { customOrder: { customerId: { in: userIds } } },
            ...(phones.length
              ? [{ orderId: null, customOrderId: null, customerPhone: { in: phones } }]
              : []),
          ],
        },
        select: {
          status: true,
          total: true,
          amountPaid: true,
          issueDate: true,
          paidDate: true,
          customerPhone: true,
          order: { select: { userId: true, paymentStatus: true } },
          customOrder: { select: { customerId: true } },
        },
      })
    : []

  // Agrégats par client à partir des factures
  type Spend = { purchases: number; totalSpent: number; lastPurchaseAt: Date | null }
  const spendByUser = new Map<string, Spend>()
  const bump = (userId: string, amount: number, at: Date | null) => {
    const s = spendByUser.get(userId) || { purchases: 0, totalSpent: 0, lastPurchaseAt: null }
    if (amount > 0) {
      s.purchases += 1
      s.totalSpent += amount
      if (at && (!s.lastPurchaseAt || at > s.lastPurchaseAt)) s.lastPurchaseAt = at
    }
    spendByUser.set(userId, s)
  }

  for (const inv of invoices) {
    const userId =
      inv.order?.userId ??
      inv.customOrder?.customerId ??
      (inv.customerPhone ? phoneToUserId.get(inv.customerPhone) : undefined)
    if (!userId) continue
    // Encaissé : PAID → total TTC (source de vérité = status, comme le rapport
    // Factures). Une facture de commande en ligne dont la commande est
    // COMPLETED est considérée payée même si le statut facture a dérivé.
    const fullyPaid = inv.status === 'PAID' || inv.order?.paymentStatus === 'COMPLETED'
    const collected = fullyPaid ? inv.total : inv.amountPaid || 0
    bump(userId, collected, inv.paidDate ?? inv.issueDate)
  }

  // Complément : commandes en ligne encaissées SANS facture (historique).
  // Les commandes avec facture sont déjà comptées via la facture.
  for (const u of users) {
    for (const o of u.orders) {
      if (o.paymentStatus === 'COMPLETED' && !o.invoice) {
        bump(u.id, o.total, o.createdAt)
      }
    }
  }

  const now = new Date()

  const records = users.map((u) => {
    const spend = spendByUser.get(u.id) || { purchases: 0, totalSpent: 0, lastPurchaseAt: null }
    const { purchases, totalSpent, lastPurchaseAt } = spend
    const avgOrderValue = purchases > 0 ? totalSpent / purchases : 0
    const isVip = purchases >= 5 || totalSpent >= 100000
    const isInactive =
      purchases >= 1 && !!lastPurchaseAt && now.getTime() - lastPurchaseAt.getTime() > NINETY_DAYS_MS
    const seg = isVip
      ? 'VIP'
      : purchases >= 2
        ? 'Fidèle'
        : purchases === 1
          ? 'Acheteur'
          : 'Sans achat'

    return {
      id: u.id,
      name: u.name || '—',
      phone: u.phone || '—',
      email: u.email || '—',
      city: u.city || '—',
      source: u.howDidYouHearAboutUs || null,
      registeredAt: u.createdAt,
      createdAt: u.createdAt,
      ordersCount: purchases,
      totalSpent,
      avgOrderValue,
      lastOrderAt: lastPurchaseAt,
      segment: isInactive ? `${seg} (inactif)` : seg,
      isVip,
      isInactive,
      paidOrders: purchases,
    }
  })

  // Filtre segment (prédicats, non mutuellement exclusifs)
  let filtered = records
  switch (segment) {
    case 'vip':
      filtered = records.filter((r) => r.isVip)
      break
    case 'loyal':
      filtered = records.filter((r) => r.paidOrders >= 2)
      break
    case 'one-time':
      filtered = records.filter((r) => r.paidOrders === 1)
      break
    case 'no-orders':
      filtered = records.filter((r) => r.paidOrders === 0)
      break
    case 'inactive':
      filtered = records.filter((r) => r.isInactive)
      break
    default:
      break
  }

  // Tri par valeur décroissante (les meilleurs clients en tête)
  filtered.sort((a, b) => b.totalSpent - a.totalSpent)

  // Agrégats résumé (sur la cohorte filtrée)
  const totalClients = filtered.length
  const totalRevenue = filtered.reduce((s, r) => s + r.totalSpent, 0)
  const totalPaidOrders = filtered.reduce((s, r) => s + r.paidOrders, 0)
  const avgLtv = totalClients > 0 ? totalRevenue / totalClients : 0
  const avgBasket = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0
  const newInPeriod = filtered.filter(
    (r) => r.registeredAt >= start && r.registeredAt <= end
  ).length

  const vipCount = filtered.filter((r) => r.isVip).length
  const loyalCount = filtered.filter((r) => r.paidOrders >= 2).length
  const oneTimeCount = filtered.filter((r) => r.paidOrders === 1).length
  const noOrderCount = filtered.filter((r) => r.paidOrders === 0).length
  const inactiveCount = filtered.filter((r) => r.isInactive).length

  // Acquisition par source (top)
  const sourceCounts = new Map<string, number>()
  for (const r of filtered) {
    const key = r.source && r.source.trim() ? r.source.trim() : 'Non renseigné'
    sourceCounts.set(key, (sourceCounts.get(key) || 0) + 1)
  }
  const topSources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const basisLabel =
    dateBasis === 'active'
      ? 'Clients ayant payé sur la période'
      : 'Clients inscrits sur la période'

  // Pagination en mémoire
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25
  const rows = filters.exportMode
    ? filtered
    : filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return {
    family: 'clients',
    title: FAMILY_TITLES.clients,
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: "Vue d'ensemble",
        entries: [
          { label: basisLabel, value: String(totalClients) },
          { label: 'Dont nouveaux (inscrits sur la période)', value: String(newInPeriod) },
          { label: 'Achats payés (cumul)', value: String(totalPaidOrders) },
        ],
      },
      {
        title: 'Valeur (CA encaissé, vie entière)',
        entries: [
          { label: 'Total dépensé par ces clients', value: formatXOF(totalRevenue) },
          { label: 'Valeur moyenne par client (LTV)', value: formatXOF(avgLtv) },
          { label: 'Panier moyen', value: formatXOF(avgBasket) },
        ],
      },
      {
        title: 'Segments',
        entries: [
          { label: 'VIP (5+ achats ou 100k+)', value: String(vipCount) },
          { label: 'Fidèles (2+ achats)', value: String(loyalCount) },
          { label: 'Un seul achat', value: String(oneTimeCount) },
          { label: 'Sans achat', value: String(noOrderCount) },
          { label: 'Inactifs (aucun achat 90j+)', value: String(inactiveCount) },
        ],
      },
      {
        title: 'Acquisition (source déclarée)',
        entries: topSources.map(([label, count]) => ({
          label,
          value: String(count),
        })),
      },
    ],
    columns: COLUMNS,
    rows,
    pagination: filters.exportMode ? undefined : { total: totalClients, page, pageSize },
  }
}

function emptyReport(start: Date, end: Date, period: string): FinancialReportData {
  return {
    family: 'clients',
    title: FAMILY_TITLES.clients,
    period: { start, end, type: period, label: periodLabel(start, end) },
    summary: [
      {
        title: "Vue d'ensemble",
        entries: [
          { label: 'Clients ayant payé sur la période', value: '0' },
          { label: 'Dont nouveaux (inscrits sur la période)', value: '0' },
          { label: 'Achats payés (cumul)', value: '0' },
        ],
      },
      { title: 'Valeur (CA encaissé, vie entière)', entries: [] },
      { title: 'Segments', entries: [] },
      { title: 'Acquisition (source déclarée)', entries: [] },
    ],
    columns: COLUMNS,
    rows: [],
    pagination: { total: 0, page: 1, pageSize: 25 },
  }
}
