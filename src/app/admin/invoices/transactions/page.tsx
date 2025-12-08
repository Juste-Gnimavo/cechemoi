'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  Search,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Phone,
  User,
  Calendar,
  Hash,
  TrendingUp,
  FileText,
  ShoppingCart,
  Wallet,
  Package,
  Receipt
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Transaction {
  id: string
  type: 'order' | 'standalone' | 'invoice'
  reference: string
  amount: number
  customerName: string
  customerPhone: string | null
  channel: string | null
  status: string
  createdAt: string
  paidAt: string | null
  relatedId: string | null
  relatedNumber: string | null
}

interface Stats {
  total: number
  pending: number
  completed: number
  failed: number
  totalAmount: number
  byType: {
    order: number
    standalone: number
    invoice: number
  }
}

export default function AllTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    fetchTransactions()
  }, [statusFilter, typeFilter, page, searchTerm, limit])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const res = await fetch(`/api/admin/transactions?${params}`)
      const data = await res.json()

      if (data.success) {
        setTransactions(data.transactions)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.totalCount || 0)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500', icon: Clock, label: 'En attente' },
      COMPLETED: { color: 'bg-green-500/20 text-green-400 border-green-500', icon: CheckCircle, label: 'Payé' },
      FAILED: { color: 'bg-red-500/20 text-red-400 border-red-500', icon: XCircle, label: 'Échoué' },
      REFUNDED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500', icon: RefreshCw, label: 'Remboursé' },
    }
    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {badge.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { color: string; icon: any; label: string }> = {
      order: { color: 'bg-blue-500/20 text-blue-400 border-blue-500', icon: ShoppingCart, label: 'Commande' },
      standalone: { color: 'bg-purple-500/20 text-purple-400 border-purple-500', icon: Wallet, label: 'Autonome' },
      invoice: { color: 'bg-amber-500/20 text-amber-400 border-amber-500', icon: Receipt, label: 'Facture' },
    }
    const badge = types[type] || types.standalone
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {badge.label}
      </span>
    )
  }

  const getChannelLabel = (channel: string | null) => {
    const channels: Record<string, string> = {
      OMCIV2: 'Orange Money',
      MOMOCI: 'MTN MoMo',
      FLOOZ: 'Moov Money',
      WAVECI: 'Wave',
      CARD: 'Carte',
      PAYPAL: 'PayPal',
    }
    return channel ? channels[channel] || channel : '-'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const getDetailLink = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'order':
        return `/admin/orders/${transaction.relatedId}`
      case 'standalone':
        return `/admin/invoices/standalone-payments/${transaction.id}`
      case 'invoice':
        return `/admin/invoices/${transaction.relatedId}`
      default:
        return '#'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary-500" />
            Toutes les transactions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vue unifiée de tous les paiements (commandes, autonomes, factures)
          </p>
        </div>
        <button
          onClick={() => fetchTransactions()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
                <p className="text-xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payés</p>
                <p className="text-xl font-bold text-green-500">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Échoués</p>
                <p className="text-xl font-bold text-red-500">{stats.failed}</p>
              </div>
            </div>
          </div>

          {/* Type breakdown */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Commandes</p>
                <p className="text-xl font-bold text-blue-500">{stats.byType.order}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Autonomes</p>
                <p className="text-xl font-bold text-purple-500">{stats.byType.standalone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                <p className="text-lg font-bold text-primary-500">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, nom, téléphone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Tous les types</option>
            <option value="order">Commandes</option>
            <option value="standalone">Autonomes</option>
            <option value="invoice">Factures</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="COMPLETED">Payés</option>
            <option value="FAILED">Échoués</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {transactions.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-4">
                      {getTypeBadge(transaction.type)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[120px]">
                            {transaction.reference}
                          </span>
                        </div>
                        {transaction.relatedNumber && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.type === 'order' ? 'Cmd: ' : transaction.type === 'invoice' ? 'Fac: ' : ''}
                            {transaction.relatedNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                            {transaction.customerName}
                          </span>
                        </div>
                        {transaction.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.customerPhone}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatAmount(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getChannelLabel(transaction.channel)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {formatDate(transaction.createdAt)}
                        </div>
                        {transaction.paidAt && (
                          <div className="flex items-center gap-2 text-xs text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Payé: {formatDate(transaction.paidAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={getDetailLink(transaction)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-dark-700 p-4">
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
