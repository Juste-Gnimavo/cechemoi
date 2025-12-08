'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Bell, Package, CreditCard, Gift, Info, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  channel?: string
  orderId?: string
  createdAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/notifications')
      return
    }

    if (!session) return

    fetchNotifications()
  }, [session, router, status, page])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/account/notifications?page=${page}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    // Handle trigger types from NotificationLog
    if (type.includes('ORDER') || type.includes('INVOICE')) {
      return <Package className="h-5 w-5 text-blue-400" />
    }
    if (type.includes('PAYMENT')) {
      return <CreditCard className="h-5 w-5 text-green-400" />
    }
    if (type.includes('LOYALTY') || type.includes('PROMO')) {
      return <Gift className="h-5 w-5 text-primary-400" />
    }
    if (type.includes('CANCEL') || type.includes('FAIL') || type.includes('REFUND')) {
      return <AlertCircle className="h-5 w-5 text-red-400" />
    }
    return <Info className="h-5 w-5 text-gray-400" />
  }

  const getNotificationBgColor = (type: string) => {
    if (type.includes('ORDER') || type.includes('INVOICE')) {
      return 'bg-blue-500/10'
    }
    if (type.includes('PAYMENT')) {
      return 'bg-green-500/10'
    }
    if (type.includes('LOYALTY') || type.includes('PROMO')) {
      return 'bg-primary-500/10'
    }
    if (type.includes('CANCEL') || type.includes('FAIL') || type.includes('REFUND')) {
      return 'bg-red-500/10'
    }
    return 'bg-gray-500/10'
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          {/* Info */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary-400" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Historique de vos notifications SMS et WhatsApp
              </p>
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <Bell className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">Aucune notification</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Vous recevrez ici les notifications sur vos commandes et promotions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white dark:bg-dark-900 rounded-lg p-4 border border-gray-200 dark:border-dark-800 transition-colors hover:border-gray-300 dark:hover:border-dark-700"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getNotificationBgColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {notification.channel && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-dark-800 px-2 py-0.5 rounded">
                            {notification.channel}
                          </span>
                        )}
                      </div>

                      <p className="text-sm mb-3 text-gray-500 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {notification.orderId && (
                          <Link
                            href={`/account/orders/${notification.orderId}`}
                            className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded hover:bg-primary-500/10 transition-all duration-200"
                          >
                            Voir la commande →
                          </Link>
                        )}
                      </div>
                    </div>
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
