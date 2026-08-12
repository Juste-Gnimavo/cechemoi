// Types partagés entre query helpers, routes API et générateurs (Excel/PDF)

export type FinancialFamily =
  | 'online-sales'
  | 'custom-orders'
  | 'invoices'
  | 'transactions'
  | 'refunds'
  | 'expenses'
  | 'clients'

export interface ReportFilters {
  period?: string
  startDate?: string
  endDate?: string
  status?: string
  paymentStatus?: string // pour online-sales: 'paid' | 'pending' | 'all' (défaut: paid)
  paymentMethod?: string
  source?: string // pour invoices: 'online' | 'custom' | 'standalone' | 'all'
  type?: string   // pour transactions: 'online' | 'custom' | 'invoice' | 'standalone' | 'all'
  dateBasis?: string // pour clients: 'registered' (défaut) | 'active'
  segment?: string   // pour clients: 'vip' | 'loyal' | 'one-time' | 'no-orders' | 'inactive' | 'all'
  page?: number
  pageSize?: number
  exportMode?: boolean
}

export interface ReportColumn {
  key: string
  label: string
  type?: 'string' | 'number' | 'currency' | 'date' | 'datetime'
  align?: 'left' | 'right' | 'center'
  width?: number // largeur logique (utilisée par le PDF, scalée)
}

export interface SummaryEntry {
  label: string
  value: string
}

export interface SummaryGroup {
  title: string
  entries: SummaryEntry[]
}

// --- Enrichissement visuel (page /admin/reports uniquement) ---
// Les exports Excel/PDF continuent de consommer `summary` tel quel ; les
// champs ci-dessous sont optionnels et servent aux cartes KPI et aux barres
// de progression de l'UI.

export interface ReportKpi {
  label: string
  value: string // déjà formaté (montant ou nombre)
  sub?: string // ligne secondaire optionnelle
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}

export interface BreakdownItem {
  label: string
  value: number // valeur numérique (montant ou compte) — sert au calcul des %
  count?: number // nombre d'éléments (affiché sous la barre)
  color?: string // couleur hex optionnelle (catégories de dépenses)
  href?: string // deep-link optionnel vers la liste détaillée filtrée
  children?: BreakdownItem[] // sous-lignes (ex. sous-catégories de dépenses)
}

export interface ReportBreakdown {
  title: string
  items: BreakdownItem[]
  format?: 'currency' | 'number' // format d'affichage de `value` (défaut: currency)
  total?: number // base des pourcentages (défaut: somme des items)
}

export interface FinancialReportData {
  family: FinancialFamily
  title: string
  period: { start: Date; end: Date; label: string; type: string }
  summary: SummaryGroup[]
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  pagination?: { total: number; page: number; pageSize: number }
  kpis?: ReportKpi[]
  breakdowns?: ReportBreakdown[]
  details?: SummaryGroup[] // groupes label/valeur non représentables en barres
}

export const FAMILY_TITLES: Record<FinancialFamily, string> = {
  'online-sales': 'Rapport — Ventes boutique en ligne',
  'custom-orders': 'Rapport — Commandes sur mesure',
  invoices: 'Rapport — Factures',
  transactions: 'Rapport — Transactions encaissées',
  refunds: 'Rapport — Remboursements',
  expenses: 'Rapport — Dépenses',
  clients: 'Rapport — Clients',
}
