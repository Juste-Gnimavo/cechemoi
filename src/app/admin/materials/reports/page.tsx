'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  User,
  FolderOpen,
  AlertTriangle,
  TrendingUp,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReportData {
  period: { type: string; start: string; end: string }
  summary: {
    entries: { count: number; totalCost: number; totalQuantity: number }
    exits: { count: number; totalCost: number; totalQuantity: number }
    lowStockCount: number
    totalMaterials: number
    totalStockValue: number
  }
  byTailor: Array<{
    tailor: { id: string; name: string; phone: string }
    count: number
    totalCost: number
    totalQuantity: number
  }>
  byCategory: Array<{
    categoryId: string
    categoryName: string
    count: number
    totalCost: number
    totalQuantity: number
  }>
  topMaterials: Array<{
    material: { id: string; name: string; unit: string; category: { name: string } }
    count: number
    totalCost: number
    totalQuantity: number
  }>
  lowStockItems: Array<{
    id: string
    name: string
    stock: number
    lowStockThreshold: number
    unit: string
    category: { name: string }
  }>
  recentMovements: any[]
}

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'year', label: "Annee en cours" },
  { value: 'custom', label: 'Personnalise' },
]

export default function MaterialReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchReport()
  }, [period, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('period', period)
      if (period === 'custom' && startDate && endDate) {
        params.set('startDate', startDate)
        params.set('endDate', endDate)
      }

      const res = await fetch(`/api/admin/materials/reports?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Erreur lors du chargement du rapport')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' CFA'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/materials"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rapports Materiels
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Statistiques et analyses du stock atelier
            </p>
          </div>
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Periode:</span>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {period === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
              />
            </>
          )}
          {data && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(data.period.start)} - {formatDate(data.period.end)}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : !data ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Erreur lors du chargement des donnees</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ArrowDownCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Entrees</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.summary.entries.count}
                  </p>
                  <p className="text-sm text-green-500">{formatPrice(data.summary.entries.totalCost)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <ArrowUpCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sorties</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.summary.exits.count}
                  </p>
                  <p className="text-sm text-orange-500">{formatPrice(data.summary.exits.totalCost)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stock bas</p>
                  <p className="text-xl font-bold text-red-500">{data.summary.lowStockCount}</p>
                  <p className="text-sm text-gray-500">/ {data.summary.totalMaterials} materiels</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valeur stock</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(data.summary.totalStockValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Tailor */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-500" />
                  Sorties par Couturier
                </h2>
              </div>
              <div className="p-4">
                {data.byTailor.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune sortie sur cette periode
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.byTailor.map((item, index) => (
                      <div
                        key={item.tailor?.id || index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.tailor?.name || 'Non assigne'}
                          </p>
                          <p className="text-sm text-gray-500">{item.count} mouvements</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-500">
                            {formatPrice(item.totalCost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary-500" />
                  Sorties par Categorie
                </h2>
              </div>
              <div className="p-4">
                {data.byCategory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune sortie sur cette periode
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.byCategory.map((item) => (
                      <div
                        key={item.categoryId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.categoryName}
                          </p>
                          <p className="text-sm text-gray-500">{item.count} mouvements</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-500">
                            {formatPrice(item.totalCost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Materials */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary-500" />
                  Materiels les plus utilises
                </h2>
              </div>
              <div className="p-4">
                {data.topMaterials.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune donnee sur cette periode
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.topMaterials.map((item, index) => (
                      <div
                        key={item.material?.id || index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.material?.name || 'Inconnu'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.totalQuantity} {item.material?.unit || 'unites'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formatPrice(item.totalCost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Alertes Stock Bas
                </h2>
              </div>
              <div className="p-4">
                {data.lowStockItems.length === 0 ? (
                  <p className="text-green-500 text-center py-4">
                    Aucun materiel en stock bas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.lowStockItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.category.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500">
                            {item.stock} {item.unit}
                          </p>
                          <p className="text-xs text-gray-500">Seuil: {item.lowStockThreshold}</p>
                        </div>
                      </div>
                    ))}
                    {data.lowStockItems.length > 5 && (
                      <Link
                        href="/admin/materials?lowStock=true"
                        className="block text-center text-sm text-primary-500 hover:text-primary-400 py-2"
                      >
                        Voir tous les {data.lowStockItems.length} materiels en stock bas
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
