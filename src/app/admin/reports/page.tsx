'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  Calendar,
  FileText,
  Globe,
  Loader2,
  Receipt,
  RefreshCcw,
  Scissors,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ExportButtons, FinancialFamily } from '@/components/admin/ExportButtons'

const TABS: {
  id: FinancialFamily
  label: string
  icon: any
}[] = [
  { id: 'online-sales', label: 'Ventes en ligne', icon: Globe },
  { id: 'custom-orders', label: 'Sur mesure', icon: Scissors },
  { id: 'invoices', label: 'Factures', icon: FileText },
  { id: 'transactions', label: 'Transactions', icon: BarChart3 },
  { id: 'refunds', label: 'Remboursements', icon: RefreshCcw },
  { id: 'expenses', label: 'Dépenses', icon: Wallet },
  { id: 'clients', label: 'Clients', icon: Users },
]

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'year', label: '12 derniers mois' },
  { value: 'custom', label: 'Personnalisé' },
]

function formatXOF(n: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} F CFA`
}

function formatDate(s: string | Date | null | undefined): string {
  if (!s) return '—'
  const d = typeof s === 'string' ? new Date(s) : s
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR')
}

function formatDateTime(s: string | Date | null | undefined): string {
  if (!s) return '—'
  const d = typeof s === 'string' ? new Date(s) : s
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR')
}

interface Column {
  key: string
  label: string
  type?: 'string' | 'number' | 'currency' | 'date' | 'datetime'
  align?: 'left' | 'right' | 'center'
}

interface ReportPayload {
  family: FinancialFamily
  title: string
  period: { type: string; start: string; end: string; label: string }
  summary: { title: string; entries: { label: string; value: string }[] }[]
  columns: Column[]
  rows: Record<string, any>[]
  pagination?: { total: number; page: number; pageSize: number }
}

function renderCell(value: any, type?: Column['type']) {
  if (value == null || value === '') return '—'
  switch (type) {
    case 'currency':
      return formatXOF(Number(value))
    case 'date':
      return formatDate(value)
    case 'datetime':
      return formatDateTime(value)
    case 'number':
      return new Intl.NumberFormat('fr-FR').format(Number(value))
    default:
      return String(value)
  }
}

// Sub-filters configuration per family
function getSubFilters(family: FinancialFamily) {
  switch (family) {
    case 'online-sales':
      return [
        {
          key: 'paymentStatus',
          label: 'Paiement',
          options: [
            { value: 'paid', label: 'Payées (par défaut)' },
            { value: 'pending', label: 'En attente / échouées' },
            { value: 'all', label: 'Toutes' },
          ],
        },
        {
          key: 'status',
          label: 'Statut',
          options: [
            { value: 'all', label: 'Tous' },
            { value: 'PENDING', label: 'En attente' },
            { value: 'PROCESSING', label: 'En traitement' },
            { value: 'SHIPPED', label: 'Expédiée' },
            { value: 'DELIVERED', label: 'Livrée' },
            { value: 'CANCELLED', label: 'Annulée' },
            { value: 'REFUNDED', label: 'Remboursée' },
          ],
        },
        {
          key: 'paymentMethod',
          label: 'Méthode',
          options: [
            { value: 'all', label: 'Toutes' },
            { value: 'PAIEMENTPRO', label: 'PaiementPro' },
            { value: 'CASH_ON_DELIVERY', label: 'Paiement à la livraison' },
            { value: 'WAVE', label: 'Wave' },
            { value: 'ORANGE_MONEY', label: 'Orange Money' },
            { value: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money' },
            { value: 'STRIPE', label: 'Stripe' },
          ],
        },
      ]
    case 'custom-orders':
      return [
        {
          key: 'status',
          label: 'Statut',
          options: [
            { value: 'all', label: 'Tous' },
            { value: 'PENDING', label: 'En attente' },
            { value: 'IN_PRODUCTION', label: 'En production' },
            { value: 'FITTING', label: 'Essayage' },
            { value: 'ALTERATIONS', label: 'Retouches' },
            { value: 'READY', label: 'Prêt' },
            { value: 'DELIVERED', label: 'Livré' },
            { value: 'CANCELLED', label: 'Annulé' },
          ],
        },
      ]
    case 'invoices':
      return [
        {
          key: 'status',
          label: 'Statut',
          options: [
            { value: 'all', label: 'Tous' },
            { value: 'DRAFT', label: 'Brouillon' },
            { value: 'SENT', label: 'Envoyée' },
            { value: 'PARTIAL', label: 'Partiellement payée' },
            { value: 'PAID', label: 'Payée' },
            { value: 'OVERDUE', label: 'En retard' },
            { value: 'CANCELLED', label: 'Annulée' },
          ],
        },
        {
          key: 'source',
          label: 'Origine',
          options: [
            { value: 'all', label: 'Toutes' },
            { value: 'online', label: 'Ventes en ligne' },
            { value: 'custom', label: 'Sur mesure' },
            { value: 'standalone', label: 'Autonome' },
          ],
        },
      ]
    case 'transactions':
      return [
        {
          key: 'type',
          label: 'Source',
          options: [
            { value: 'all', label: 'Toutes' },
            { value: 'online', label: 'Ventes en ligne' },
            { value: 'custom', label: 'Sur mesure' },
            { value: 'invoice', label: 'Factures' },
            { value: 'standalone', label: 'Paiements autonomes' },
          ],
        },
      ]
    case 'refunds':
      return [
        {
          key: 'status',
          label: 'Statut',
          options: [
            { value: 'all', label: 'Tous' },
            { value: 'pending', label: 'En attente' },
            { value: 'processed', label: 'Traité' },
            { value: 'failed', label: 'Échec' },
          ],
        },
      ]
    case 'expenses':
      return [
        {
          key: 'paymentMethod',
          label: 'Méthode',
          options: [
            { value: 'all', label: 'Toutes' },
            { value: 'CASH', label: 'Espèces' },
            { value: 'BANK_TRANSFER', label: 'Virement' },
            { value: 'ORANGE_MONEY', label: 'Orange Money' },
            { value: 'MTN_MOMO', label: 'MTN MoMo' },
            { value: 'WAVE', label: 'Wave' },
            { value: 'CHECK', label: 'Chèque' },
            { value: 'CARD', label: 'Carte' },
          ],
        },
      ]
    case 'clients':
      return [
        {
          key: 'dateBasis',
          label: 'Base période',
          options: [
            { value: 'registered', label: 'Inscrits sur la période' },
            { value: 'active', label: 'Actifs (ont payé) sur la période' },
          ],
        },
        {
          key: 'segment',
          label: 'Segment',
          options: [
            { value: 'all', label: 'Tous' },
            { value: 'vip', label: 'VIP (5+ cmd ou 100k+)' },
            { value: 'loyal', label: 'Fidèles (2+ cmd)' },
            { value: 'one-time', label: 'Une seule commande' },
            { value: 'no-orders', label: 'Sans achat' },
            { value: 'inactive', label: 'Inactifs (90j+)' },
          ],
        },
      ]
    default:
      return []
  }
}

function ReportTab({ family }: { family: FinancialFamily }) {
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [subFilters, setSubFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [data, setData] = useState<ReportPayload | null>(null)
  const [loading, setLoading] = useState(false)

  const subFilterConfig = useMemo(() => getSubFilters(family), [family])

  // Init defaults for sub-filters. Pour 'paymentStatus' (online-sales), le
  // défaut est 'paid' — le rapport doit montrer le CA réalisé, pas les
  // commandes en attente. Le CEO peut basculer sur 'all' si besoin d'audit.
  useEffect(() => {
    const defaults: Record<string, string> = {}
    for (const f of subFilterConfig) {
      defaults[f.key] =
        f.key === 'paymentStatus' ? 'paid' : f.key === 'dateBasis' ? 'registered' : 'all'
    }
    setSubFilters(defaults)
    setPage(1)
  }, [family, subFilterConfig])

  const fetchData = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        page: String(page),
        pageSize: String(pageSize),
      })
      if (period === 'custom') {
        params.set('startDate', startDate)
        params.set('endDate', endDate)
      }
      for (const [k, v] of Object.entries(subFilters)) {
        if (v && v !== 'all') params.set(k, v)
      }
      const res = await fetch(`/api/admin/reports/financial/${family}?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur')
      setData(json as ReportPayload)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur de chargement')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [family, period, startDate, endDate, subFilters, page, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportFilters = useMemo(() => {
    const f: Record<string, string> = { period }
    if (period === 'custom') {
      f.startDate = startDate
      f.endDate = endDate
    }
    for (const [k, v] of Object.entries(subFilters)) {
      if (v && v !== 'all') f[k] = v
    }
    return f
  }, [period, startDate, endDate, subFilters])

  const totalPages = data?.pagination ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.pageSize)) : 1

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Période</label>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {period === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Du</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Au</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </>
            )}
            {subFilterConfig.map((sf) => (
              <div key={sf.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{sf.label}</label>
                <select
                  value={subFilters[sf.key] || 'all'}
                  onChange={(e) => {
                    setSubFilters({ ...subFilters, [sf.key]: e.target.value })
                    setPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {sf.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <ExportButtons family={family} filters={exportFilters} />
        </div>
        {data && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{data.period.label}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !data ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg text-gray-500">
          Aucune donnée
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.summary.map((group, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.entries.map((e, j) => (
                    <div key={j} className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-600">{e.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{e.value}</span>
                    </div>
                  ))}
                  {group.entries.length === 0 && (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">
                Détail ({data.pagination?.total ?? data.rows.length} ligne{(data.pagination?.total ?? data.rows.length) > 1 ? 's' : ''})
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Par page</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10))
                    setPage(1)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {data.columns.map((c) => (
                      <th
                        key={c.key}
                        className={`px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide ${
                          c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={data.columns.length} className="px-3 py-8 text-center text-gray-400 italic">
                        Aucune ligne pour la période et les filtres sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {data.columns.map((c) => (
                          <td
                            key={c.key}
                            className={`px-3 py-2 whitespace-nowrap ${
                              c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left'
                            } ${c.type === 'currency' ? 'font-medium text-gray-900' : 'text-gray-700'}`}
                          >
                            {renderCell(row[c.key], c.type)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data.pagination && totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Page {data.pagination.page} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ReportsPageInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const initialTab = (sp.get('tab') as FinancialFamily) || 'online-sales'
  const [activeTab, setActiveTab] = useState<FinancialFamily>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'online-sales'
  )

  useEffect(() => {
    const t = sp.get('tab') as FinancialFamily
    if (t && TABS.some((x) => x.id === t) && t !== activeTab) {
      setActiveTab(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  const changeTab = (id: FinancialFamily) => {
    setActiveTab(id)
    const params = new URLSearchParams(sp.toString())
    params.set('tab', id)
    router.replace(`/admin/reports?${params.toString()}`)
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports financiers</h1>
        <p className="text-sm text-gray-600 mt-1">
          Exports comptables Excel et PDF par période. Chaque onglet correspond à une famille comptable distincte — ne pas mélanger.
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap gap-1 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <ReportTab family={activeTab} />
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <ReportsPageInner />
    </Suspense>
  )
}
