// Types partagés entre query helpers, routes API et générateurs (Excel/PDF)

export type FinancialFamily =
  | 'online-sales'
  | 'custom-orders'
  | 'invoices'
  | 'transactions'
  | 'refunds'
  | 'expenses'

export interface ReportFilters {
  period?: string
  startDate?: string
  endDate?: string
  status?: string
  paymentMethod?: string
  source?: string // pour invoices: 'online' | 'custom' | 'standalone' | 'all'
  type?: string   // pour transactions: 'online' | 'custom' | 'invoice' | 'standalone' | 'all'
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

export interface FinancialReportData {
  family: FinancialFamily
  title: string
  period: { start: Date; end: Date; label: string; type: string }
  summary: SummaryGroup[]
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  pagination?: { total: number; page: number; pageSize: number }
}

export const FAMILY_TITLES: Record<FinancialFamily, string> = {
  'online-sales': 'Rapport — Ventes boutique en ligne',
  'custom-orders': 'Rapport — Commandes sur mesure',
  invoices: 'Rapport — Factures',
  transactions: 'Rapport — Transactions encaissées',
  refunds: 'Rapport — Remboursements',
  expenses: 'Rapport — Dépenses',
}
