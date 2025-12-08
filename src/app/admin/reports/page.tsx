'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Download,
  Calendar,
  Save,
  Play,
  Trash2,
  Plus,
  FileText,
  Clock,
} from 'lucide-react'

interface AnalyticsData {
  sales?: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalTax: number
    totalShipping: number
    revenueByPeriod: Array<{ date: string; revenue: number }>
    topProducts: Array<{
      product: { id: string; name: string; images: string[] }
      quantity: number
      revenue: number
    }>
  }
  customers?: {
    newCustomers: number
    totalCustomers: number
    repeatCustomers: number
    repeatCustomerRate: number
    averageLTV: number
    topCustomers: Array<{
      id: string
      name: string
      phone: string
      email: string
      totalSpent: number
      orderCount: number
    }>
  }
  products?: {
    totalProducts: number
    topSellingProducts: Array<any>
    topRevenueProducts: Array<any>
    lowStockProducts: Array<any>
    categoryPerformance: Array<any>
  }
  inventory?: {
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    totalInventoryValue: number
    stockByCategory: Record<string, any>
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData>({})
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])

  // Custom report builder state
  const [reportName, setReportName] = useState('')
  const [reportType, setReportType] = useState('sales')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAnalytics('overview')
    } else if (activeTab === 'saved') {
      fetchSavedReports()
    } else if (activeTab === 'scheduled') {
      fetchSchedules()
    }
  }, [activeTab, dateRange, startDate, endDate])

  const fetchAnalytics = async (type: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type,
        dateRange,
        ...(dateRange === 'custom' && { startDate, endDate }),
      })

      const res = await fetch(`/api/admin/reports/analytics?${params}`)
      const result = await res.json()

      if (result.success) {
        setAnalytics(result.data)
      } else {
        toast.error(result.error || 'Erreur lors du chargement des analyses')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Erreur lors du chargement des analyses')
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedReports = async () => {
    try {
      const res = await fetch('/api/admin/reports/saved')
      const result = await res.json()

      if (result.success) {
        setSavedReports(result.reports)
      }
    } catch (error) {
      console.error('Error fetching saved reports:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/admin/reports/schedules')
      const result = await res.json()

      if (result.success) {
        setSchedules(result.schedules)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const saveReport = async () => {
    if (!reportName || selectedColumns.length === 0) {
      toast.error('Nom et colonnes requis')
      return
    }

    try {
      const res = await fetch('/api/admin/reports/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          reportType,
          dateRange,
          startDate: dateRange === 'custom' ? startDate : null,
          endDate: dateRange === 'custom' ? endDate : null,
          columns: selectedColumns,
        }),
      })

      const result = await res.json()

      if (result.success) {
        toast.success('Rapport sauvegardé')
        setReportName('')
        setSelectedColumns([])
        fetchSavedReports()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Supprimer ce rapport ?')) return

    try {
      const res = await fetch(`/api/admin/reports/saved/${id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (result.success) {
        toast.success('Rapport supprimé')
        fetchSavedReports()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const deleteSchedule = async (id: string) => {
    if (!confirm('Supprimer cette planification ?')) return

    try {
      const res = await fetch(`/api/admin/reports/schedules/${id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (result.success) {
        toast.success('Planification supprimée')
        fetchSchedules()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const exportReport = async (format: string) => {
    try {
      const res = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: activeTab === 'overview' ? 'sales' : reportType,
          dateRange,
          startDate,
          endDate,
          format,
        }),
      })

      if (format === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Rapport exporté')
      } else {
        const result = await res.json()
        toast.success(result.message || 'Export en cours')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'exportation')
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} CFA`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">Rapports & Analyses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyses avancées et rapports personnalisés</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-600"
          >
            <FileText className="h-4 w-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white/80 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-transparent">
        <div className="flex gap-4 items-center">
          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-transparent"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="custom">Personnalisé</option>
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-transparent"
              />
              <span className="text-gray-500 dark:text-gray-400">à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-transparent"
              />
            </>
          )}

          <button
            onClick={() => fetchAnalytics(activeTab)}
            className="px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded-lg hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'custom', label: 'Rapport personnalisé', icon: Plus },
            { id: 'saved', label: 'Rapports sauvegardés', icon: Save },
            { id: 'scheduled', label: 'Rapports planifiés', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">Chargement...</div>
          ) : (
            <>
              {/* Sales Analytics */}
              {analytics.sales && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Analyses des Ventes
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Revenu Total</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {formatCurrency(analytics.sales.totalRevenue)}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Commandes</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {analytics.sales.totalOrders}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Valeur Moyenne</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {formatCurrency(analytics.sales.averageOrderValue)}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Taxes Collectées</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {formatCurrency(analytics.sales.totalTax)}
                      </div>
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
                      Top 10 Produits
                    </h3>
                    <div className="space-y-3">
                      {analytics.sales.topProducts.slice(0, 10).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-gray-500 dark:text-gray-400 font-mono">#{idx + 1}</div>
                            {item.product.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="text-gray-900 dark:text-gray-900 dark:text-white font-medium">
                                {item.product.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-sm">
                                {item.quantity} vendus
                              </div>
                            </div>
                          </div>
                          <div className="text-green-500 font-semibold">
                            {formatCurrency(item.revenue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Analytics */}
              {analytics.customers && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Analyses des Clients
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Nouveaux Clients</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {analytics.customers.newCustomers}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Total Clients</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {analytics.customers.totalCustomers}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">Taux de Fidélité</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {analytics.customers.repeatCustomerRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <div className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm mb-2">LTV Moyenne</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">
                        {formatCurrency(analytics.customers.averageLTV)}
                      </div>
                    </div>
                  </div>

                  {/* Top Customers */}
                  <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
                      Top 10 Clients
                    </h3>
                    <div className="space-y-3">
                      {analytics.customers.topCustomers.slice(0, 10).map((customer, idx) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-gray-500 dark:text-gray-400 font-mono">#{idx + 1}</div>
                            <div>
                              <div className="text-gray-900 dark:text-gray-900 dark:text-white font-medium">{customer.name}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-sm">
                                {customer.orderCount} commandes
                              </div>
                            </div>
                          </div>
                          <div className="text-green-500 font-semibold">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Performance */}
              {analytics.products && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Performance des Produits
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top Selling */}
                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
                        Plus Vendus
                      </h3>
                      <div className="space-y-2">
                        {analytics.products.topSellingProducts.slice(0, 5).map((product) => (
                          <div
                            key={product.id}
                            className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                          >
                            <span className="text-gray-900 dark:text-white">{product.name}</span>
                            <span className="text-blue-500 font-semibold">
                              {product.totalSold} vendus
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Low Stock */}
                    <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
                        Stock Faible
                      </h3>
                      <div className="space-y-2">
                        {analytics.products.lowStockProducts.slice(0, 5).map((product) => (
                          <div
                            key={product.id}
                            className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                          >
                            <span className="text-gray-900 dark:text-white">{product.name}</span>
                            <span className="text-red-500 font-semibold">
                              {product.stock} restants
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Custom Report Builder Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
              Créer un Rapport Personnalisé
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-400 mb-2">Nom du rapport</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                  placeholder="Mon rapport personnalisé"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-400 mb-2">Type de rapport</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                >
                  <option value="sales">Ventes</option>
                  <option value="customers">Clients</option>
                  <option value="products">Produits</option>
                  <option value="inventory">Inventaire</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-400 mb-2">Colonnes à inclure</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {reportType === 'sales' &&
                    ['orderId', 'date', 'customer', 'total', 'status'].map((col) => (
                      <label key={col} className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns([...selectedColumns, col])
                            } else {
                              setSelectedColumns(selectedColumns.filter((c) => c !== col))
                            }
                          }}
                          className="rounded"
                        />
                        {col}
                      </label>
                    ))}

                  {reportType === 'products' &&
                    ['name', 'sku', 'category', 'price', 'stock', 'totalSold'].map(
                      (col) => (
                        <label key={col} className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns([...selectedColumns, col])
                              } else {
                                setSelectedColumns(selectedColumns.filter((c) => c !== col))
                              }
                            }}
                            className="rounded"
                          />
                          {col}
                        </label>
                      )
                    )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveReport}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-gray-900 dark:text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={() => fetchAnalytics(reportType)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-gray-900 dark:text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                  Exécuter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white">Rapports Sauvegardés</h2>

          {savedReports.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-800 p-12 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-transparent">
              Aucun rapport sauvegardé
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map((report) => (
                <div key={report.id} className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{report.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{report.reportType}</p>
                    </div>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                    {report.description || 'Aucune description'}
                  </div>

                  <div className="text-gray-500 text-xs">
                    Période: {report.dateRange}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Colonnes: {report.columns.join(', ')}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                    <button
                      onClick={() => {
                        setReportName(report.name)
                        setReportType(report.reportType)
                        setSelectedColumns(report.columns)
                        setActiveTab('custom')
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Exécuter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white">Rapports Planifiés</h2>

          {schedules.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-800 p-12 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-transparent">
              Aucun rapport planifié
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white/80 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-transparent flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold">
                      {schedule.report.name}
                    </h3>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Fréquence: {schedule.frequency} à {schedule.time}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Destinataires: {schedule.recipients.join(', ')}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Format: {schedule.format.toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded text-sm ${
                        schedule.enabled
                          ? 'bg-green-600 text-gray-900 dark:text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {schedule.enabled ? 'Actif' : 'Inactif'}
                    </div>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
