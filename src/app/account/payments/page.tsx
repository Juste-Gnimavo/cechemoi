'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { CreditCard, Filter, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  method: string
  status: string
  reference: string | null
  transactionId: string | null
  createdAt: string
  order: {
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/payments')
      return
    }

    if (!session) return

    fetchPayments()
  }, [session, router, status, page, statusFilter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/account/payments?page=${page}&status=${statusFilter}`
      )
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'PROCESSING':
        return <AlertCircle className="h-5 w-5 text-blue-400" />
      case 'REFUNDED':
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      COMPLETED: 'bg-green-500/20 text-green-400',
      FAILED: 'bg-red-500/20 text-red-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      PROCESSING: 'bg-blue-500/20 text-blue-400',
      REFUNDED: 'bg-gray-500/20 text-gray-400',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: any = {
      CARD: 'Carte bancaire',
      MOBILE_MONEY: 'Mobile Money',
      WAVE: 'Wave',
      ORANGE_MONEY: 'Orange Money',
      MTN_MONEY: 'MTN Money',
      CASH_ON_DELIVERY: 'Paiement à la livraison',
    }
    return labels[method] || method
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      COMPLETED: 'Complété',
      FAILED: 'Échoué',
      PENDING: 'En attente',
      PROCESSING: 'En traitement',
      REFUNDED: 'Remboursé',
    }
    return labels[status] || status
  }

  if (status === 'loading' || loading) {
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historique des Paiements</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Suivez vos transactions et paiements
              </p>
            </div>
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
                <option value="all">Tous les paiements</option>
                <option value="COMPLETED">Complétés</option>
                <option value="PENDING">En attente</option>
                <option value="PROCESSING">En traitement</option>
                <option value="FAILED">Échoués</option>
                <option value="REFUNDED">Remboursés</option>
              </select>
            </div>
          </div>

          {/* Payments List */}
          {payments.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <CreditCard className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun paiement trouvé</p>
              <Link
                href="/"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg"
              >
                Commencer mes achats
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">
                          Commande #{payment.order.orderNumber}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Montant</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Méthode</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {getPaymentMethodLabel(payment.method)}
                      </p>
                    </div>
                    {payment.reference && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Référence</p>
                        <p className="text-gray-900 dark:text-white font-mono text-sm">
                          {payment.reference}
                        </p>
                      </div>
                    )}
                    {payment.transactionId && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Transaction</p>
                        <p className="text-gray-900 dark:text-white font-mono text-sm">
                          {payment.transactionId}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-dark-800">
                    <Link
                      href={`/account/orders/${payment.orderId}`}
                      className="flex items-center gap-2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm transition-all duration-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir la commande
                    </Link>
                    {payment.status === 'COMPLETED' && (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">
                        Total commande: {payment.order.total.toLocaleString()} CFA
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20"
              >
                Précédent
              </button>
              <span className="text-gray-900 dark:text-white px-4 py-2">
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
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
