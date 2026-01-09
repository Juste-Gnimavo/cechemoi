'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Scissors,
  Clock,
  CreditCard,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  BarChart3,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CustomOrder {
  id: string
  orderNumber: string
  orderDate: string
  pickupDate: string
  customerDeadline?: string
  status: string
  priority: string
  totalCost: number
  materialCost: number
  deposit: number
  balance: number
  itemCount: number
  garmentTypes: string[]
  notes?: string
  customer: {
    id: string
    name: string
    phone: string
  }
  items: Array<{
    id: string
    garmentType: string
    status: string
    tailor?: {
      id: string
      name: string
    }
  }>
  createdBy: {
    id: string
    name: string
  }
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'IN_PRODUCTION', label: 'En production' },
  { value: 'FITTING', label: 'Essayage' },
  { value: 'ALTERATIONS', label: 'Retouches' },
  { value: 'READY', label: 'Prêt' },
  { value: 'DELIVERED', label: 'Livré' },
  { value: 'CANCELLED', label: 'Annulé' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'VIP', label: 'VIP' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'IN_PRODUCTION':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'FITTING':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'ALTERATIONS':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
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
  const option = STATUS_OPTIONS.find((o) => o.value === status)
  return option?.label || status
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-500 text-white'
    case 'VIP':
      return 'bg-purple-500 text-white'
    default:
      return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }
}

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Record<string, number>>({})

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, priorityFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)

      const response = await fetch(`/api/admin/custom-orders?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!confirm(`Supprimer la commande ${orderNumber}?`)) return

    try {
      const response = await fetch(`/api/admin/custom-orders/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Commande supprimée')
        fetchOrders()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDownloadPdf = async (id: string, orderNumber: string) => {
    try {
      setDownloadingPdfId(id)
      const response = await fetch(`/api/admin/custom-orders/${id}/pdf`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `commande_${orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' F'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scissors className="h-6 w-6" />
            Commandes Sur-Mesure
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total} commande{total > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/custom-orders/audit"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700 rounded-lg transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            Audit
          </Link>
          <Link
            href="/admin/custom-orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvelle commande
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {STATUS_OPTIONS.filter((s) => s.value).map((status) => (
          <button
            key={status.value}
            onClick={() => {
              setStatusFilter(statusFilter === status.value ? '' : status.value)
              setPage(1)
            }}
            className={`p-3 rounded-lg border transition-all ${
              statusFilter === status.value
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
            }`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{status.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {stats[status.value] || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, client, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Rechercher
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white/80 dark:bg-dark-900/50 rounded-lg border border-gray-200 dark:border-dark-700/50">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucune commande sur-mesure</p>
          <Link
            href="/admin/custom-orders/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer une commande
          </Link>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Articles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Retrait
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Coût
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Matériel
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Avance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Reliquat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Couturier
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        {order.priority !== 'NORMAL' && (
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${getPriorityColor(order.priority)}`}
                          >
                            {order.priority}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customer.name || 'Client'}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {order.garmentTypes.join(', ')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span
                          className={
                            new Date(order.pickupDate) < new Date()
                              ? 'text-red-500 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }
                        >
                          {formatDate(order.pickupDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.customerDeadline ? (
                        <span
                          className={
                            new Date(order.customerDeadline) < new Date()
                              ? 'text-red-500 font-medium'
                              : 'text-orange-600 dark:text-orange-400'
                          }
                        >
                          {formatDate(order.customerDeadline)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(order.materialCost)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(order.deposit)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span
                        className={
                          order.balance > 0
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {formatCurrency(order.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        const tailors = order.items
                          .filter((item) => item.tailor?.name)
                          .map((item) => item.tailor!.name)
                        const uniqueTailors = [...new Set(tailors)]
                        if (uniqueTailors.length === 0) {
                          return <span className="text-gray-400">Non assigné</span>
                        }
                        return (
                          <span className="text-gray-900 dark:text-white truncate max-w-[100px] block">
                            {uniqueTailors.join(', ')}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/custom-orders/${order.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(order.id, order.orderNumber)}
                          disabled={downloadingPdfId === order.id}
                          className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                          title="Télécharger PDF"
                        >
                          {downloadingPdfId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(order.id, order.orderNumber)}
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
