'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react'
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
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface SalesData {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalCustomers: number
  }
  byCategory: Array<{ name: string; revenue: number; orders: number }>
  byProduct: Array<{ id: string; name: string; revenue: number; quantity: number; orders: number }>
  dailyRevenue: Array<{ date: string; revenue: number }>
  topCustomers: Array<{ id: string; name: string; email: string; revenue: number; orders: number }>
}

export default function MonthSalesPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SalesData | null>(null)

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sales?period=month')
      if (!res.ok) throw new Error('Erreur de chargement')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Chargement...</div>
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Erreur de chargement des données</div>
  }

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventes de {currentMonth}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Rapport mensuel</p>
        </div>
        <Link
          href="/admin/sales"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
        >
          Voir tous les rapports
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600/20 dark:to-blue-900/20 border border-blue-300 dark:border-blue-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenus</p>
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
        {/* Daily Revenue */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution quotidienne</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
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

        {/* Category Pie Chart */}
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Produits les plus vendus ce mois</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Rang</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Produit</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Quantité</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Commandes</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Revenus</th>
              </tr>
            </thead>
            <tbody>
              {data.byProduct.slice(0, 15).map((product, idx) => (
                <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/30">
                  <td className="py-3 px-4">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full text-sm font-bold text-blue-600 dark:text-blue-300">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{product.name}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{product.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{product.orders}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-500 dark:text-green-400">{product.revenue.toLocaleString()} CFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 clients du mois</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.topCustomers.slice(0, 10).map((customer, idx) => (
            <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-full font-bold text-purple-600 dark:text-purple-300">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.orders} commandes</p>
                </div>
              </div>
              <p className="font-semibold text-blue-500 dark:text-blue-400">{customer.revenue.toLocaleString()} CFA</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
