'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ProductPerformance {
  id: string
  name: string
  sku: string
  price: number
  salePrice: number | null
  stock: number
  image: string | null
  categoryId: string
  categoryName: string
  unitsSold: number
  revenue: number
  orders: number
  averagePrice: number
}

interface ProductAnalytics {
  summary: {
    totalProducts: number
    productsWithSales: number
    productsWithoutSales: number
    totalUnitsSold: number
    totalRevenue: number
    averageUnitsPerProduct: number
    averageRevenuePerProduct: number
    lowStockProducts: number
    outOfStockProducts: number
  }
  topSellingByUnits: ProductPerformance[]
  topSellingByRevenue: ProductPerformance[]
  lowPerforming: ProductPerformance[]
  neverSold: Array<{ id: string; name: string; sku: string; stock: number; price: number }>
  outOfStockBestSellers: ProductPerformance[]
}

export default function ProductsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [activeTab, setActiveTab] = useState<
    'top-units' | 'top-revenue' | 'low-performing' | 'never-sold' | 'out-of-stock'
  >('top-units')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/admin/analytics/products?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching product analytics:', error)
      toast.error('Erreur lors du chargement des analytics produits')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`
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

  const renderProductList = (products: ProductPerformance[] | any[], showPerformance = true) => {
    if (products.length === 0) {
      return (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Aucun produit dans cette catégorie
        </div>
      )
    }

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-100 dark:bg-dark-800/50">
            <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Produit</th>
            <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Catégorie</th>
            <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Stock</th>
            {showPerformance && (
              <>
                <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Vendus</th>
                <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Revenu</th>
                <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Prix Moyen
                </th>
              </>
            )}
            {!showPerformance && (
              <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Prix</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50">
              <td className="px-6 py-4">
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{product.name}</p>
                  <p className="text-gray-500 text-sm">{product.sku}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-gray-600 dark:text-gray-300">{product.categoryName || 'N/A'}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <span
                  className={`font-medium ${
                    product.stock === 0
                      ? 'text-red-500'
                      : product.stock <= 10
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }`}
                >
                  {product.stock}
                </span>
              </td>
              {showPerformance && (
                <>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                    {product.unitsSold}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(product.averagePrice)}
                  </td>
                </>
              )}
              {!showPerformance && (
                <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                  {formatCurrency(product.price)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance des Produits</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyse détaillée des ventes par produit</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="flex gap-4">
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-5 w-5 text-blue-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Produits</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.totalProducts}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.summary.productsWithSales} avec ventes
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Unités Vendues</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.totalUnitsSold}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.summary.averageUnitsPerProduct.toFixed(1)} par produit
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Revenu Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(analytics.summary.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(analytics.summary.averageRevenuePerProduct)} par produit
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Alertes Stock</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.summary.lowStockProducts + analytics.summary.outOfStockProducts}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.summary.outOfStockProducts} ruptures
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-800">
        <button
          onClick={() => setActiveTab('top-units')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'top-units'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Top Ventes (Unités)
        </button>
        <button
          onClick={() => setActiveTab('top-revenue')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'top-revenue'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Top Ventes (Revenu)
        </button>
        <button
          onClick={() => setActiveTab('low-performing')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'low-performing'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Faible Performance
        </button>
        <button
          onClick={() => setActiveTab('never-sold')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'never-sold'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Jamais Vendus
        </button>
        <button
          onClick={() => setActiveTab('out-of-stock')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'out-of-stock'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Rupture (Meilleures Ventes)
        </button>
      </div>

      {/* Content */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
        {activeTab === 'top-units' && renderProductList(analytics.topSellingByUnits)}
        {activeTab === 'top-revenue' && renderProductList(analytics.topSellingByRevenue)}
        {activeTab === 'low-performing' && renderProductList(analytics.lowPerforming)}
        {activeTab === 'never-sold' && renderProductList(analytics.neverSold, false)}
        {activeTab === 'out-of-stock' && renderProductList(analytics.outOfStockBestSellers)}
      </div>
    </div>
  )
}
