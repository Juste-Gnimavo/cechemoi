'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Printer, Download, RefreshCw, Plus, ShoppingBag, Clock, Truck, CheckCircle, XCircle, Calendar, TrendingUp, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Order {
  id: string
  orderNumber: string
  customer: string
  date: string
  status: string
  paymentStatus: string
  total: number
  items: number
}

interface Stats {
  total: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  today: number
  week: number
  month: number
  year: number
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  PROCESSING: 'bg-blue-500/10 text-blue-500',
  SHIPPED: 'bg-purple-500/10 text-purple-500',
  DELIVERED: 'bg-green-500/10 text-green-500',
  CANCELLED: 'bg-red-500/10 text-red-500',
  REFUNDED: 'bg-gray-500/10 text-gray-500',
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En traitement',
  SHIPPED: 'Expedie',
  DELIVERED: 'Livre',
  CANCELLED: 'Annule',
  REFUNDED: 'Rembourse',
}

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  COMPLETED: 'bg-green-500/10 text-green-500',
  FAILED: 'bg-red-500/10 text-red-500',
  REFUNDED: 'bg-gray-500/10 text-gray-500',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [filters, activeTab, pagination.page, pagination.limit])

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filters, activeTab])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      // Apply tab filter
      if (activeTab !== 'all') {
        if (activeTab === 'pending') {
          params.append('status', 'PENDING')
        } else if (activeTab === 'active') {
          params.append('status', 'PROCESSING,SHIPPED')
        } else if (activeTab === 'completed') {
          params.append('status', 'DELIVERED')
        } else if (activeTab === 'cancelled') {
          params.append('status', 'CANCELLED,REFUNDED')
        }
      } else if (filters.status) {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        // Transform data to match component interface
        const transformedOrders = data.orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.user?.name || 'Client',
          date: order.createdAt,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          items: order.items?.length || 0,
        }))
        setOrders(transformedOrders)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      alert('Veuillez selectionner au moins une commande')
      return
    }

    try {
      const response = await fetch('/api/admin/orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          action: action,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`${data.count} commande(s) mise(s) a jour avec succes`)
        setSelectedOrders([])
        fetchOrders()
      } else {
        alert(data.error || 'Erreur lors de l\'action groupee')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Erreur lors de l\'action groupee')
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleAllOrders = () => {
    setSelectedOrders(
      selectedOrders.length === orders.length
        ? []
        : orders.map(o => o.id)
    )
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la commande #${orderNumber} ?\n\nCette action supprimera également la facture, les articles, les notes et remboursements associés. Cette action est irréversible.`)) {
      return
    }

    try {
      setDeletingId(orderId)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Commande supprimée avec succès')
        fetchOrders()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des commandes
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Gerez toutes vos commandes et leur statut
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200">
            <Download className="h-4 w-4" />
            Exporter CSV
          </button>
          <Link
            href="/admin/orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Link>
        </div>
      </div>

      {/* Stats Header */}
      {stats && (
        <AdminStatsHeader
          stats={[
            { label: 'Total', value: stats.total, icon: ShoppingBag, color: 'primary' },
            { label: 'En attente', value: stats.pending, icon: Clock, color: 'yellow' },
            { label: 'En cours', value: stats.processing, icon: Truck, color: 'blue' },
            { label: 'Livrees', value: stats.delivered, icon: CheckCircle, color: 'green' },
            { label: 'Annulees', value: stats.cancelled, icon: XCircle, color: 'red' },
            { label: "Aujourd'hui", value: stats.today, icon: Calendar, color: 'blue' },
            { label: 'Cette semaine', value: stats.week, icon: TrendingUp, color: 'purple' },
            { label: 'Ce mois', value: stats.month, icon: TrendingUp, color: 'default' },
          ]}
        />
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-dark-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'text-primary-500 dark:text-primary-400 border-b-2 border-primary-500 dark:border-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Toutes ({stats?.total || 0})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'pending'
              ? 'text-yellow-500 dark:text-yellow-400 border-b-2 border-yellow-500 dark:border-yellow-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          En attente ({stats?.pending || 0})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'active'
              ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Actives ({(stats?.processing || 0) + (stats?.shipped || 0)})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'completed'
              ? 'text-green-500 dark:text-green-400 border-b-2 border-green-500 dark:border-green-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Livrees ({stats?.delivered || 0})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cancelled'
              ? 'text-red-500 dark:text-red-400 border-b-2 border-red-500 dark:border-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Annulees ({stats?.cancelled || 0})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par N commande, client..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PROCESSING">En traitement</option>
            <option value="SHIPPED">Expedie</option>
            <option value="DELIVERED">Livre</option>
            <option value="CANCELLED">Annule</option>
            <option value="REFUNDED">Rembourse</option>
          </select>

          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          >
            <option value="">Paiement</option>
            <option value="PENDING">En attente</option>
            <option value="COMPLETED">Paye</option>
            <option value="FAILED">Echoue</option>
            <option value="REFUNDED">Rembourse</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-primary-500/10 border border-primary-500 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 dark:text-white font-semibold">
              {selectedOrders.length} commande(s) selectionnee(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('markProcessing')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
              >
                Mettre en traitement
              </button>
              <button
                onClick={() => handleBulkAction('markShipped')}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm"
              >
                Marquer comme expedie
              </button>
              <button
                onClick={() => handleBulkAction('markDelivered')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
              >
                Marquer comme livre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Chargement...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Aucune commande trouvee
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-800/50">
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length}
                        onChange={toggleAllOrders}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Commande
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Client
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Statut
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Paiement
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Total
                    </th>
                    <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/30">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-semibold"
                        >
                          #{order.orderNumber}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.items} article{order.items > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(order.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusColors[order.paymentStatus]}`}>
                          {order.paymentStatus === 'COMPLETED' ? 'Paye' : order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-semibold">
                        {order.total.toLocaleString()} CFA
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
                            title="Voir details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
                            title="Imprimer"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            disabled={deletingId === order.id}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all duration-200"
                            title="Supprimer"
                          >
                            <Trash2 className={`h-4 w-4 ${deletingId === order.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemName="commandes"
            />
          </>
        )}
      </div>
    </div>
  )
}
