'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import {
  FileText,
  Filter,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  status: string
  total: number
  issueDate: string
  dueDate: string | null
  paidDate: string | null
  order: {
    id: string
    orderNumber: string
  } | null
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/invoices')
    }
  }, [status, router])

  useEffect(() => {
    if (!session) return

    async function fetchInvoices() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(statusFilter !== 'all' && { status: statusFilter }),
        })
        const res = await fetch(`/api/account/invoices?${params}`)
        if (res.ok) {
          const data = await res.json()
          setInvoices(data.invoices)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [session, page, statusFilter])

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      SENT: { color: 'bg-blue-500/20 text-blue-400', icon: Clock, label: 'Envoyée' },
      PAID: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Payée' },
      OVERDUE: { color: 'bg-red-500/20 text-red-400', icon: AlertCircle, label: 'En retard' },
      CANCELLED: { color: 'bg-gray-500/20 text-gray-400', icon: XCircle, label: 'Annulée' },
      REFUNDED: { color: 'bg-purple-500/20 text-purple-400', icon: FileText, label: 'Remboursée' },
    }

    const badge = badges[status] || { color: 'bg-gray-500/20 text-gray-400', icon: FileText, label: status }
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${badge.color}`}>
        <Icon className="h-4 w-4" />
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Factures</h1>
            <Link
              href="/account"
              className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          {/* Filter */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
              >
                <option value="all">Toutes les factures</option>
                <option value="SENT">Envoyées</option>
                <option value="PAID">Payées</option>
                <option value="OVERDUE">En retard</option>
                <option value="CANCELLED">Annulées</option>
                <option value="REFUNDED">Remboursées</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune facture trouvée</p>
              <Link
                href="/"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg"
              >
                Commencer mes achats
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                        Facture {invoice.invoiceNumber}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Emise le {formatDate(invoice.issueDate)}
                      </p>
                      {invoice.order && (
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                          Commande #{invoice.order.orderNumber}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Montant</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">{formatCurrency(invoice.total)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Échéance</p>
                      <p className="text-gray-900 dark:text-white">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Date de paiement</p>
                      <p className={invoice.paidDate ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                        {invoice.paidDate ? formatDate(invoice.paidDate) : 'Non payée'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Link
                      href={`/account/invoices/${invoice.id}`}
                      className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      Voir les details
                    </Link>
                    {invoice.order && (
                      <Link
                        href={`/account/orders/${invoice.order.id}`}
                        className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm"
                      >
                        Voir la commande
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20"
              >
                Précédent
              </button>
              <span className="text-gray-900 dark:text-white px-4 py-2">
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
