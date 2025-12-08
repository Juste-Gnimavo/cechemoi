'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Package, Filter, FileText } from 'lucide-react'
import Link from 'next/link'

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/orders')
    }
  }, [status, router])

  useEffect(() => {
    if (!session) return

    async function fetchOrders() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/account/orders?page=${page}&status=${statusFilter}`
        )
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [session, page, statusFilter])

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'En attente' },
      PROCESSING: { color: 'bg-blue-500/20 text-blue-400', label: 'En cours' },
      SHIPPED: { color: 'bg-purple-500/20 text-purple-400', label: 'Expédiée' },
      DELIVERED: { color: 'bg-green-500/20 text-green-400', label: 'Livrée' },
      CANCELLED: { color: 'bg-red-500/20 text-red-400', label: 'Annulée' },
      REFUNDED: { color: 'bg-gray-500/20 text-gray-400', label: 'Remboursée' },
    }
    return statuses[status] || { color: 'bg-gray-500/20 text-gray-400', label: status }
  }

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Payé',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
    }
    return statuses[status] || status
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Commandes</h1>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

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
                <option value="all">Toutes les commandes</option>
                <option value="PENDING">En attente</option>
                <option value="PROCESSING">En traitement</option>
                <option value="SHIPPED">Expédiée</option>
                <option value="DELIVERED">Livrée</option>
                <option value="CANCELLED">Annulée</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune commande trouvée</p>
              <Link
                href="/"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg"
              >
                Commencer mes achats
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                        Commande #{order.orderNumber}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusInfo(order.status).color}`}>
                      {getStatusInfo(order.status).label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Articles</p>
                      <p className="text-gray-900 dark:text-white font-medium">{order.items.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
                      <p className="text-gray-900 dark:text-white font-bold">{order.total.toLocaleString()} CFA</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Paiement</p>
                      <span className={`text-sm ${
                        order.paymentStatus === 'COMPLETED' ? 'text-green-400' :
                        order.paymentStatus === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    >
                      Voir les détails
                    </Link>
                    {order.invoice && (
                      <Link
                        href={`/account/invoices/${order.invoice.id}`}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        Facture
                      </Link>
                    )}
                    {order.trackingNumber && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Suivi: {order.trackingNumber}
                      </span>
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
