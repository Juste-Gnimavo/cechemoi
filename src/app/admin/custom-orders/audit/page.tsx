'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  ShoppingBag,
  Users,
  Calendar,
  Filter,
  Loader2,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  status: string
  priority: string
  totalCost: number
  materialCost: number
  orderDate: string
  pickupDate: string
  customer: {
    id: string
    name: string
    phone: string
  }
  createdBy: {
    id: string
    name: string
  } | null
  _count: {
    items: number
    payments: number
  }
}

interface StaffStat {
  staffId: string
  staffName: string
  ordersCount: number
  totalValue: number
  avgValue: number
}

interface StaffMember {
  id: string
  name: string
  role: string
}

export default function CustomOrdersAuditPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [staffStats, setStaffStats] = useState<StaffStat[]>([])
  const [totals, setTotals] = useState({ orders: 0, value: 0, avgValue: 0 })
  const [allStaff, setAllStaff] = useState<StaffMember[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  // Filters
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [staffId, setStaffId] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    // Set default dates based on range
    const now = new Date()
    if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      setStartDate(weekAgo.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      setStartDate(monthAgo.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    }
  }, [dateRange])

  useEffect(() => {
    if (startDate && endDate) {
      fetchAuditData()
    }
  }, [startDate, endDate, staffId, page])

  const fetchAuditData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (staffId) params.set('staffId', staffId)

      const res = await fetch(`/api/admin/custom-orders/audit?${params}`)
      const data = await res.json()

      if (data.success) {
        setOrders(data.orders)
        setStaffStats(data.staffStats)
        setTotals(data.totals)
        setAllStaff(data.allStaff)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Error fetching audit data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'IN_PRODUCTION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'FITTING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'READY':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      IN_PRODUCTION: 'En production',
      FITTING: 'Essayage',
      ALTERATIONS: 'Retouches',
      READY: 'Prêt',
      DELIVERED: 'Livré',
      CANCELLED: 'Annulé',
    }
    return labels[status] || status
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/custom-orders"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary-500" />
              Audit des Commandes Sur-Mesure
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Suivez qui crée les commandes et quand
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres:</span>
          </div>

          {/* Date Range Selector */}
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 p-1">
            {[
              { value: 'week', label: 'Semaine' },
              { value: 'month', label: 'Mois' },
              { value: 'custom', label: 'Personnalisé' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as 'week' | 'month' | 'custom')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === option.value
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <span className="text-gray-400">à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
              />
            </>
          )}

          {/* Staff Filter */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Tous les membres</option>
              {allStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name || 'Sans nom'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total commandes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.orders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valeur totale</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totals.value.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Moyenne par commande</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totals.avgValue.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Performance Table */}
          {staffStats.length > 0 && (
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                Performance par membre
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membre</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Commandes</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur totale</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Moyenne</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {staffStats.map((stat) => (
                      <tr key={stat.staffId} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{stat.staffName}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {stat.ordersCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {stat.totalValue.toLocaleString()} FCFA
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {stat.avgValue.toLocaleString()} FCFA
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/team/${stat.staffId}`}
                            className="text-primary-500 hover:text-primary-400"
                          >
                            <ExternalLink className="h-4 w-4 inline" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary-500" />
              Commandes ({pagination.total})
            </h2>
            {orders.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé par</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/custom-orders/${order.id}`}
                              className="text-primary-500 hover:text-primary-400 font-medium text-sm"
                            >
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900 dark:text-white">{order.customer.name}</p>
                            <p className="text-xs text-gray-500">{order.customer.phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            {order.createdBy ? (
                              <Link
                                href={`/admin/team/${order.createdBy.id}`}
                                className="text-sm text-primary-500 hover:text-primary-400"
                              >
                                {order.createdBy.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                            {order.totalCost.toLocaleString()} FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <p className="text-sm text-gray-500">
                      Page {pagination.page} sur {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= pagination.totalPages}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune commande pour cette période</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
