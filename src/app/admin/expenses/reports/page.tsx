'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  FileText,
  Zap,
  Droplets,
  Car,
  Phone,
  Tv,
  Sparkles,
  Home,
  MoreHorizontal,
  Package,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReportData {
  period: {
    type: string
    start: string
    end: string
  }
  summary: {
    totalAmount: number
    count: number
  }
  byCategory: {
    category: {
      id: string
      name: string
      icon: string | null
      color: string | null
    }
    count: number
    totalAmount: number
  }[]
  byPaymentMethod: {
    method: string
    label: string
    count: number
    totalAmount: number
  }[]
  byStaff: {
    staff: {
      id: string
      name: string
      role: string
    }
    count: number
    totalAmount: number
  }[]
  byCreator: {
    creator: {
      id: string
      name: string
      role: string
    }
    count: number
    totalAmount: number
  }[]
  salaryByStaff: {
    staffId: string
    staffName: string
    staffRole: string
    count: number
    totalAmount: number
  }[]
}

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'year', label: 'Cette annee' },
  { value: 'custom', label: 'Personnalise' },
]

const ICONS: { [key: string]: any } = {
  Zap,
  Droplets,
  Users,
  Car,
  Phone,
  Tv,
  Sparkles,
  Home,
  FileText,
  MoreHorizontal,
  DollarSign,
  Package,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ExpenseReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)

  // Filter state
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchReport()
  }, [period, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom' && startDate) {
        params.set('startDate', startDate)
      }
      if (period === 'custom' && endDate) {
        params.set('endDate', endDate)
      }

      const res = await fetch(`/api/admin/expenses/reports?${params}`)
      const json = await res.json()

      if (json.success) {
        setData(json)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string | null) => {
    return ICONS[iconName || 'MoreHorizontal'] || MoreHorizontal
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/expenses"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rapports des Depenses
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Analyse detaillee de vos depenses
            </p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              Periode:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  period === p.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
        {data?.period && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Du {formatDate(data.period.start)} au {formatDate(data.period.end)}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Depenses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.summary.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nombre de depenses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.summary.count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Moyenne par depense</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.summary.count > 0
                      ? formatCurrency(Math.round(data.summary.totalAmount / data.summary.count))
                      : '0 CFA'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Category */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Par Categorie
                </h2>
              </div>
              <div className="p-4">
                {data.byCategory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune donnee
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.byCategory.map((item) => {
                      const Icon = getIcon(item.category?.icon)
                      const percentage = data.summary.totalAmount > 0
                        ? Math.round((item.totalAmount / data.summary.totalAmount) * 100)
                        : 0
                      return (
                        <div key={item.category?.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon
                                className="h-4 w-4"
                                style={{ color: item.category?.color || '#64748b' }}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {item.category?.name || 'Inconnu'}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: item.category?.color || '#64748b',
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{item.count} depense(s)</span>
                            <span>{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* By Payment Method */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  Par Mode de Paiement
                </h2>
              </div>
              <div className="p-4">
                {data.byPaymentMethod.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune donnee
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.byPaymentMethod.map((item) => {
                      const percentage = data.summary.totalAmount > 0
                        ? Math.round((item.totalAmount / data.summary.totalAmount) * 100)
                        : 0
                      return (
                        <div key={item.method} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{item.count} depense(s)</span>
                            <span>{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Salaries by Staff */}
            {data.salaryByStaff.length > 0 && (
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    Salaires par Membre
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {data.salaryByStaff.map((item) => (
                    <div key={item.staffId} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.staffName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.staffRole} - {item.count} paiement(s)
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Creator (who recorded) */}
            {data.byCreator.length > 0 && (
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    Enregistre par (Staff)
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {data.byCreator.map((item) => (
                    <div key={item.creator?.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.creator?.name || 'Inconnu'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.count} depense(s) enregistree(s)
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
