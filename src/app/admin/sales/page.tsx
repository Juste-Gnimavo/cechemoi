'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface SalesData {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalCustomers: number
  }
  byCategory: Array<{ name: string; revenue: number; orders: number }>
  byProduct: Array<{ id: string; name: string; revenue: number; quantity: number; orders: number }>
  byPaymentMethod: Array<{ method: string; revenue: number; orders: number }>
  dailyRevenue: Array<{ date: string; revenue: number }>
  topCustomers: Array<{ id: string; name: string; email: string; revenue: number; orders: number }>
  orders: Array<any>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function SalesReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SalesData | null>(null)
  const [period, setPeriod] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchSalesData()
  }, [period, startDate, endDate])

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (period !== 'custom') {
        params.append('period', period)
      } else if (startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }

      const res = await fetch(`/api/admin/sales?${params.toString()}`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return

    const csv: string[] = []

    // Header
    csv.push('Rapport de Ventes')
    csv.push(`Période: ${period}`)
    csv.push('')

    // Summary
    csv.push('Résumé')
    csv.push('Métrique,Valeur')
    csv.push(`Revenus totaux,${data.summary.totalRevenue}`)
    csv.push(`Commandes,${data.summary.totalOrders}`)
    csv.push(`Panier moyen,${data.summary.averageOrderValue}`)
    csv.push(`Clients,${data.summary.totalCustomers}`)
    csv.push('')

    // By category
    csv.push('Ventes par catégorie')
    csv.push('Catégorie,Revenus,Commandes')
    data.byCategory.forEach(cat => {
      csv.push(`${cat.name},${cat.revenue},${cat.orders}`)
    })
    csv.push('')

    // By product
    csv.push('Ventes par produit')
    csv.push('Produit,Revenus,Quantité,Commandes')
    data.byProduct.forEach(prod => {
      csv.push(`${prod.name},${prod.revenue},${prod.quantity},${prod.orders}`)
    })

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-ventes-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentMethodLabels: Record<string, string> = {
    CASH_ON_DELIVERY: 'Paiement à la livraison',
    ORANGE_MONEY: 'Orange Money',
    MTN_MOBILE_MONEY: 'MTN Mobile Money',
    WAVE: 'Wave',
    PAIEMENTPRO: 'PaiementPro',
    STRIPE: 'Stripe',
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Chargement...</div>
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Erreur de chargement des données</div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports de Ventes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Analyse complète des ventes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Link
          href="/admin/sales"
          className={`p-3 rounded-lg text-center transition-colors ${
            period === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Toutes
        </Link>
        <Link
          href="/admin/sales/today"
          className={`p-3 rounded-lg text-center transition-colors ${
            period === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Aujourd'hui
        </Link>
        <Link
          href="/admin/sales/week"
          className={`p-3 rounded-lg text-center transition-colors ${
            period === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          7 jours
        </Link>
        <Link
          href="/admin/sales/month"
          className={`p-3 rounded-lg text-center transition-colors ${
            period === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Ce mois
        </Link>
        <Link
          href="/admin/sales/year"
          className={`p-3 rounded-lg text-center transition-colors ${
            period === 'year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Cette année
        </Link>
      </div>

      {/* Custom Date Range */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 flex items-center gap-4 border border-gray-200 dark:border-transparent">
        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Période personnalisée:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value)
            setPeriod('custom')
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
        />
        <span className="text-gray-500 dark:text-gray-400">à</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value)
            setPeriod('custom')
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600/20 dark:to-blue-900/20 border border-blue-300 dark:border-blue-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenus totaux</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalRevenue.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-600/20 dark:to-green-900/20 border border-green-300 dark:border-green-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Commandes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-600/20 dark:to-purple-900/20 border border-purple-300 dark:border-purple-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(data.summary.averageOrderValue).toLocaleString()} CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-600/20 dark:to-yellow-900/20 border border-yellow-300 dark:border-yellow-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Users className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution des revenus</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ventes par catégorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.byCategory}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.name}
              >
                {data.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Produits</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Produit</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Quantité</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Commandes</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Revenus</th>
              </tr>
            </thead>
            <tbody>
              {data.byProduct.slice(0, 10).map((product) => (
                <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{product.name}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{product.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{product.orders}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{product.revenue.toLocaleString()} CFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Modes de paiement</h3>
          <div className="space-y-3">
            {data.byPaymentMethod.map((method) => (
              <div key={method.method} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{paymentMethodLabels[method.method] || method.method}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{method.orders} commandes</p>
                </div>
                <p className="font-semibold text-green-500 dark:text-green-400">{method.revenue.toLocaleString()} CFA</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meilleurs clients</h3>
          <div className="space-y-3">
            {data.topCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.orders} commandes</p>
                </div>
                <p className="font-semibold text-blue-500 dark:text-blue-400">{customer.revenue.toLocaleString()} CFA</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
