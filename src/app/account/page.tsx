'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { UserProfileCard } from '@/components/user-profile-card'
import { useLoginTracking } from '@/hooks/useLoginTracking'
import { Package, Heart, MapPin, LogOut, User } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  user: any
  stats: {
    orders: number
    wishlist: number
    addresses: number
    loyaltyPoints: number
    loyaltyTier: string
  }
  recentOrders: any[]
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Track login info (IP, browser)
  useLoginTracking()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/account/dashboard')
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboard()
    }
  }, [session])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  const user = dashboardData?.user || session.user

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg p-6 mb-8 border border-primary-500/30 shadow-lg shadow-primary-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Bienvenue, {user.name?.split(' ')[0] || 'Utilisateur'}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Gérez votre compte et suivez vos commandes
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-primary-500/20 rounded-full p-4">
                  <User className="h-12 w-12 text-primary-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="bg-primary-500/20 rounded-full p-3">
                  <Package className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Commandes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : dashboardData?.stats.orders || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-red-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/20 rounded-full p-3">
                  <Heart className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Favoris</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : dashboardData?.stats.wishlist || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-blue-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/20 rounded-full p-3">
                  <MapPin className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Adresses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : dashboardData?.stats.addresses || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-1 space-y-4">
              <UserProfileCard
                user={user}
                variant="vertical"
                onImageUpdate={(url) => {
                  if (dashboardData) {
                    setDashboardData({
                      ...dashboardData,
                      user: { ...dashboardData.user, image: url }
                    })
                  }
                }}
              />

              <button
                onClick={() => signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-lg transition-all duration-200 border border-red-500/20 hover:shadow-lg hover:shadow-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>

            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary-500" />
                    Commandes récentes
                  </h2>
                  <Link
                    href="/account/orders"
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors duration-200"
                  >
                    Voir tout
                  </Link>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : !dashboardData?.recentOrders || dashboardData.recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune commande pour le moment</p>
                    <Link
                      href="/"
                      className="inline-block bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      Commencer mes achats
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.recentOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className="bg-gray-100 dark:bg-dark-800/50 rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 hover:border-primary-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-gray-900 dark:text-white font-semibold">#{order.orderNumber}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 dark:text-white font-bold">{order.total} CFA</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                              order.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                              order.status === 'SHIPPED' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {order.items?.length || 0} article(s)
                          </p>
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                          >
                            Détails →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
