'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Package,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RevenueAnalytics {
  revenue: {
    total: number
    subtotal: number
    tax: number
    shipping: number
    discount: number
    orders: number
    averageOrderValue: number
    growth: number
    previousPeriod: {
      revenue: number
      orders: number
    }
  }
  byPeriod: Array<{
    period: string
    revenue: number
    orders: number
    subtotal: number
    tax: number
    shipping: number
    discount: number
    averageOrderValue: number
  }>
  byPaymentMethod: Record<string, { revenue: number; orders: number }>
  byCategory: Array<{
    id: string
    name: string
    revenue: number
    orders: number
  }>
}

export default function RevenueAnalyticsPage() {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchAnalytics()
  }, [period, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ period })
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/admin/analytics/revenue?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
      toast.error('Erreur lors du chargement des analytics de revenu')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Aucune donnée disponible</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/analytics"
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics de Revenu</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyse détaillée des revenus et tendances</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Période</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="year">Année</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Date de début</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Date de fin</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
            className="px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            {analytics.revenue.growth !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  analytics.revenue.growth > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {analytics.revenue.growth > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercentage(analytics.revenue.growth)}
              </div>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Revenu Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(analytics.revenue.total)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            vs {formatCurrency(analytics.revenue.previousPeriod.revenue)} (période précédente)
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-2">
            <Package className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Commandes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.revenue.orders}</p>
          <p className="text-xs text-gray-500 mt-2">
            vs {analytics.revenue.previousPeriod.orders} (période précédente)
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-2">
            <DollarSign className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Panier Moyen</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(analytics.revenue.averageOrderValue)}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="p-3 bg-yellow-500/10 rounded-lg w-fit mb-2">
            <TrendingDown className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Réductions</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            -{formatCurrency(analytics.revenue.discount)}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Composition du Revenu</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sous-total Produits</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(analytics.revenue.subtotal)}
            </p>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${(analytics.revenue.subtotal / analytics.revenue.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Taxes Collectées</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(analytics.revenue.tax)}
            </p>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(analytics.revenue.tax / analytics.revenue.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Frais de Livraison</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(analytics.revenue.shipping)}
            </p>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500"
                style={{
                  width: `${(analytics.revenue.shipping / analytics.revenue.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Réductions Appliquées</p>
            <p className="text-xl font-bold text-red-500 mt-1">
              -{formatCurrency(analytics.revenue.discount)}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue by Period */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenu par {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-800">
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Période
                </th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Commandes
                </th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Revenu
                </th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Panier Moyen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
              {analytics.byPeriod.map((item) => (
                <tr key={item.period} className="hover:bg-gray-100 dark:hover:bg-dark-800/50">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.period}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{item.orders}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.averageOrderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Category and Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenu par Catégorie</h2>
          <div className="space-y-3">
            {analytics.byCategory.slice(0, 10).map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.orders} commandes</p>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(category.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenu par Mode de Paiement</h2>
          <div className="space-y-3">
            {Object.entries(analytics.byPaymentMethod).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{method.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{data.orders} commandes</p>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(data.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
