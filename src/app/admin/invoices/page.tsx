'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  Mail,
  Trash2,
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string | null
  status: string
  total: number
  issueDate: string
  dueDate: string | null
  paidDate: string | null
  orderId: string | null
  order: any | null
}

interface Stats {
  totalInvoices: number
  byStatus: {
    DRAFT: number
    SENT: number
    PAID: number
    OVERDUE: number
    CANCELLED: number
    REFUNDED: number
  }
  totalRevenue: number
  overdueAmount: number
  pendingAmount: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit, setLimit] = useState(20)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [statusFilter, page, searchTerm, limit])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const res = await fetch(`/api/admin/invoices?${params}`)
      const data = await res.json()

      if (data.success) {
        setInvoices(data.invoices)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.totalCount || 0)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/invoices/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoiceNumber} ?\n\nCette action supprimera également les articles et paiements associés. Cette action est irréversible.`)) {
      return
    }

    try {
      setDeletingId(invoiceId)
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Facture supprimée avec succès')
        fetchInvoices()
        fetchStats()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: 'bg-gray-500/20 text-gray-400 border-gray-500', icon: FileText, label: 'Brouillon' },
      SENT: { color: 'bg-blue-500/20 text-blue-400 border-blue-500', icon: Mail, label: 'Envoyée' },
      PAID: { color: 'bg-green-500/20 text-green shadow-sm shadow-green-500/10-400 border-green-500', icon: CheckCircle, label: 'Payée' },
      OVERDUE: { color: 'bg-red-500/20 text-red shadow-sm shadow-red-500/10-400 border-red-500', icon: AlertCircle, label: 'En retard' },
      CANCELLED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500', icon: XCircle, label: 'Annulée' },
      REFUNDED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500', icon: TrendingUp, label: 'Remboursée' },
    }

    const badge = badges[status] || badges.DRAFT
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="h-3 w-3" />
        <span>{badge.label}</span>
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos factures et suivez les paiements</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Facture</span>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <AdminStatsHeader
          stats={[
            { label: 'Total', value: stats.totalInvoices, icon: FileText, color: 'primary' },
            { label: 'Payées', value: stats.byStatus.PAID, icon: CheckCircle, color: 'green' },
            { label: 'Envoyées', value: stats.byStatus.SENT, icon: Mail, color: 'blue' },
            { label: 'En retard', value: stats.byStatus.OVERDUE, icon: AlertCircle, color: 'red' },
            { label: 'Brouillons', value: stats.byStatus.DRAFT, icon: FileText, color: 'default' },
            { label: 'Revenu', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'green' },
            { label: 'En attente', value: formatCurrency(stats.pendingAmount), icon: Clock, color: 'yellow' },
          ]}
        />
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'].map(status => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
              }`}
            >
              {status === 'ALL' ? 'Toutes' : getStatusBadge(status).props.children[1]}
              {stats && status !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({stats.byStatus[status as keyof typeof stats.byStatus]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Aucune facture trouvée'
                : 'Aucune facture. Créez-en une !'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="text-primary-400 hover:text-primary-300 font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{invoice.customerName}</p>
                        {invoice.customerEmail && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customerEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.order ? (
                        <Link
                          href={`/admin/orders/${invoice.orderId}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {invoice.order.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-sm">Standalone</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 text-sm">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 text-sm">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-semibold">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/invoices/${invoice.id}`}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-all duration-200"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <a
                          href={`/api/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-all duration-200"
                          title="Voir PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                        <a
                          href={`/api/invoices/${invoice.id}/pdf`}
                          download={`facture-${invoice.invoiceNumber}.pdf`}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-all duration-200"
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                          disabled={deletingId === invoice.id}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className={`h-4 w-4 ${deletingId === invoice.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemName="factures"
        />
      )}
    </div>
  )
}
