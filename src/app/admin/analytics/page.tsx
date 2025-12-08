'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AnalyticsData {
  revenue: {
    total: number
    subtotal: number
    tax: number
    shipping: number
    discount: number
  }
  orders: {
    total: number
    byStatus: Record<string, number>
    byPaymentStatus: Record<string, number>
    byPaymentMethod: Record<string, number>
    averageValue: number
  }
  items: {
    totalSold: number
  }
  customers: {
    total: number
  }
  products: {
    total: number
  }
  revenueByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
  topProducts: Array<{
    id: string
    name: string
    quantity: number
    revenue: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/admin/analytics/overview?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Erreur lors du chargement des analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const params = new URLSearchParams({ type })
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/admin/analytics/export?${params.toString()}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${type}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export réussi')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Chargement des analytics...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Rapports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble des performances</p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('revenue')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export Revenu
          </button>
          <button
            onClick={() => handleExport('orders')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export Commandes
          </button>
          <button
            onClick={() => handleExport('products')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export Produits
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <div className="flex gap-4 flex-1">
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
            <div className="flex items-end">
              <button
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                className="px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Revenu Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(analytics.revenue.total)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.orders.total} commandes
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Panier Moyen</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(analytics.orders.averageValue)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.items.totalSold} articles vendus
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Clients</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.customers.total}</p>
          <p className="text-xs text-gray-500 mt-2">
            {(analytics.orders.total / analytics.customers.total || 0).toFixed(1)} commandes/client
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Produits</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.products.total}</p>
          <p className="text-xs text-gray-500 mt-2">Catalogue actif</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détail du Revenu</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sous-total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(analytics.revenue.subtotal)}
            </p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Taxes</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(analytics.revenue.tax)}
            </p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Livraison</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(analytics.revenue.shipping)}
            </p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Réductions</p>
            <p className="text-xl font-bold text-red-500 mt-1">
              -{formatCurrency(analytics.revenue.discount)}
            </p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Produits</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-800">
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Produit
                </th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Unités
                </th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Revenu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
              {analytics.topProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono">#{index + 1}</span>
                      <span className="text-gray-900 dark:text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                    {product.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Commandes par Statut</h2>
          <div className="space-y-3">
            {Object.entries(analytics.orders.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 capitalize">{status.toLowerCase()}</span>
                <span className="text-gray-900 dark:text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Commandes par Mode de Paiement
          </h2>
          <div className="space-y-3">
            {Object.entries(analytics.orders.byPaymentMethod).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{method.replace(/_/g, ' ')}</span>
                <span className="text-gray-900 dark:text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
