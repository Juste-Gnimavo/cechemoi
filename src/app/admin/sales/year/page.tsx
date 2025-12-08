'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
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
  byPaymentMethod: Array<{ method: string; revenue: number; orders: number }>
  dailyRevenue: Array<{ date: string; revenue: number }>
  topCustomers: Array<{ id: string; name: string; email: string; revenue: number; orders: number }>
}

export default function YearSalesPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SalesData | null>(null)

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sales?period=year')
      if (!res.ok) throw new Error('Erreur de chargement')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group daily revenue by month for yearly view
  const getMonthlyRevenue = () => {
    if (!data) return []

    const monthlyMap = new Map<string, number>()
    data.dailyRevenue.forEach(day => {
      const month = day.date.substring(0, 7) // Get YYYY-MM
      const existing = monthlyMap.get(month)
      monthlyMap.set(month, (existing || 0) + day.revenue)
    })

    return Array.from(monthlyMap.entries())
      .map(([month, revenue]) => ({
        month,
        revenue,
        monthLabel: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' })
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
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

  const currentYear = new Date().getFullYear()
  const monthlyRevenue = getMonthlyRevenue()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventes de l'année {currentYear}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Rapport annuel complet</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Clients uniques</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution mensuelle des revenus</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="monthLabel"
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
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribution par catégorie</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data.byCategory}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={(entry) => `${entry.name} (${((entry.revenue / data.summary.totalRevenue) * 100).toFixed(1)}%)`}
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

        {/* Payment Methods */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenus par mode de paiement</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.byPaymentMethod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="method"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: any, props: any) => [
                  `${value.toLocaleString()} CFA`,
                  paymentMethodLabels[props.payload.method] || props.payload.method
                ]}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 20 produits de l'année</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.byProduct.slice(0, 20).map((product, idx) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full text-sm font-bold text-blue-600 dark:text-blue-300">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.quantity} unités • {product.orders} commandes</p>
                </div>
              </div>
              <p className="font-semibold text-green-500 dark:text-green-400">{product.revenue.toLocaleString()} CFA</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 15 clients de l'année</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.topCustomers.slice(0, 15).map((customer, idx) => (
            <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                  idx === 1 ? 'bg-gray-400/20 text-gray-600 dark:text-gray-300' :
                  idx === 2 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                  'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                }`}>
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{customer.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{customer.orders} cmd</p>
                </div>
              </div>
              <p className="font-semibold text-blue-500 dark:text-blue-400 text-sm">{customer.revenue.toLocaleString()} CFA</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
