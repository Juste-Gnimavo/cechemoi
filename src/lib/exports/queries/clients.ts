import { prisma } from '@/lib/prisma'
import { formatXOF, periodLabel, resolveDateRange } from '../formatters'
import { FAMILY_TITLES, FinancialReportData, ReportColumn, ReportFilters } from '../types'

const COLUMNS: ReportColumn[] = [
  { key: 'name', label: 'Client', width: 130 },
  { key: 'phone', label: 'Téléphone', width: 90 },
  { key: 'email', label: 'Email', width: 130 },
  { key: 'city', label: 'Ville', width: 75 },
  { key: 'createdAt', label: 'Inscription', type: 'date', width: 65 },
  { key: 'ordersCount', label: 'Cmd. payées', type: 'number', width: 60, align: 'right' },
  { key: 'totalSpent', label: 'Total dépensé', type: 'currency', width: 90, align: 'right' },
  { key: 'avgOrderValue', label: 'Panier moyen', type: 'currency', width: 85, align: 'right' },
  { key: 'lastOrderAt', label: 'Dernière cmd.', type: 'date', width: 70 },
  { key: 'loyaltyTier', label: 'Fidélité', width: 60 },
  { key: 'segment', label: 'Segment', width: 75 },
]

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function labelTier(tier: string | null | undefined): string {
  if (!tier) return '—'
  const map: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
  }
  return map[tier] || tier
}

/**
 * Rapport CRM — Clients.
 *
 * Deux lectures possibles via le filtre `dateBasis` :
 *  - 'registered' (défaut) : clients INSCRITS sur la période (cohorte d'acquisition).
 *  - 'active'              : clients ayant PAYÉ au moins une commande sur la période.
 *
 * Les métriques par client sont TOUJOURS calculées sur la vie entière (LTV,
 * nombre de commandes payées, panier moyen, dernière commande) — la période ne
 * fait que sélectionner quels clients apparaissent. Le revenu est strictement
 * basé sur les commandes encaissées (paymentStatus = COMPLETED), cohérent avec
 * les autres rapports financiers (CA réalisé, pas le pipeline).
 *
 * Calcul en mémoire sur la cohorte sélectionnée (clients inscrits OU actifs sur
 * la période), pas sur l'ensemble de la base — même approche que
 * /api/admin/customers/stats, mais bornée à la cohorte pour rester efficace.
 */
export async function fetchClientsReport(filters: ReportFilters): Promise<FinancialReportData> {
  const { start, end, period } = resolveDateRange(filters.period, filters.startDate, filters.endDate)
  const dateBasis = filters.dateBasis === 'active' ? 'active' : 'registered'
  const segment = filters.segment && filters.segment !== 'all' ? filters.segment : null

  const userWhere: any = { role: 'CUSTOMER' }

  if (dateBasis === 'registered') {
    userWhere.createdAt = { gte: start, lte: end }
  } else {
    // Mode 'active' : on récupère d'abord les clients ayant une commande payée
    // sur la période, puis on charge ces clients-là.
    const activeGroups = await prisma.order.groupBy({
      by: ['userId'],
      where: { paymentStatus: 'COMPLETED', createdAt: { gte: start, lte: end } },
    })
    const activeUserIds = activeGroups.map((g) => g.userId)
    if (activeUserIds.length === 0) {
      return emptyReport(start, end, period)
    }
    userWhere.id = { in: activeUserIds }
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
      loyaltyPoints: { select: { points: true, tier: true } },
      orders: { select: { total: true, createdAt: true, paymentStatus: true } },
    },
  })

  const now = new Date()

  const records = users.map((u) => {
    const paid = u.orders.filter((o) => o.paymentStatus === 'COMPLETED')
    const paidOrders = paid.length
    const totalSpent = paid.reduce((s, o) => s + o.total, 0)
    const lastOrderAt = paid.length
      ? paid.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).createdAt
      : null
    const avgOrderValue = paidOrders > 0 ? totalSpent / paidOrders : 0
    const isVip = paidOrders >= 5 || totalSpent >= 100000
    const isInactive =
      paidOrders >= 1 && !!lastOrderAt && now.getTime() - lastOrderAt.getTime() > NINETY_DAYS_MS
    const seg = isVip
      ? 'VIP'
      : paidOrders >= 2
        ? 'Fidèle'
        : paidOrders === 1
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
      ordersCount: paidOrders,
      totalSpent,
      avgOrderValue,
      lastOrderAt,
      loyaltyTier: labelTier(u.loyaltyPoints?.tier),
      loyaltyPoints: u.loyaltyPoints?.points ?? 0,
      segment: isInactive ? `${seg} (inactif)` : seg,
      isVip,
      isInactive,
      paidOrders,
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
      ? 'Clients ayant payé une commande sur la période'
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
          { label: 'Commandes payées (cumul)', value: String(totalPaidOrders) },
        ],
      },
      {
        title: 'Valeur (CA réalisé, vie entière)',
        entries: [
          { label: 'Total dépensé par ces clients', value: formatXOF(totalRevenue) },
          { label: 'Valeur moyenne par client (LTV)', value: formatXOF(avgLtv) },
          { label: 'Panier moyen', value: formatXOF(avgBasket) },
        ],
      },
      {
        title: 'Segments',
        entries: [
          { label: 'VIP (5+ cmd ou 100k+)', value: String(vipCount) },
          { label: 'Fidèles (2+ commandes)', value: String(loyalCount) },
          { label: 'Une seule commande', value: String(oneTimeCount) },
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
          { label: 'Clients ayant payé une commande sur la période', value: '0' },
          { label: 'Dont nouveaux (inscrits sur la période)', value: '0' },
          { label: 'Commandes payées (cumul)', value: '0' },
        ],
      },
      { title: 'Valeur (CA réalisé, vie entière)', entries: [] },
      { title: 'Segments', entries: [] },
      { title: 'Acquisition (source déclarée)', entries: [] },
    ],
    columns: COLUMNS,
    rows: [],
    pagination: { total: 0, page: 1, pageSize: 25 },
  }
}
