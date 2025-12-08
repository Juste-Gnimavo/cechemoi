'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Award, TrendingUp, Gift, ArrowUp, ArrowDown, Star } from 'lucide-react'
import Link from 'next/link'
import { useConfetti } from '@/hooks/useConfetti'

interface LoyaltyData {
  id: string
  points: number
  lifetimePoints: number
  tier: string
  createdAt: string
  updatedAt: string
}

interface LoyaltyTransaction {
  id: string
  points: number
  type: string
  description: string | null
  orderId: string | null
  createdAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function LoyaltyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { reward } = useConfetti()
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const confettiFired = useRef(false)

  // Check for tier upgrade and fire reward confetti
  useEffect(() => {
    if (loyalty && !loading && !confettiFired.current) {
      const previousTier = sessionStorage.getItem('loyaltyTier')
      const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum']
      const tier = loyalty.tier ?? 'Bronze'
      const previousIndex = previousTier ? tierOrder.indexOf(previousTier) : -1
      const currentIndex = tierOrder.indexOf(tier)

      // Fire confetti if tier upgraded or first time viewing Gold/Platinum
      if (currentIndex > previousIndex && currentIndex >= 2) {
        confettiFired.current = true
        reward({ duration: 2500 })
      }

      // Save current tier for next comparison
      sessionStorage.setItem('loyaltyTier', tier)
    }
  }, [loyalty, loading, reward])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/loyalty')
      return
    }

    if (!session) return

    fetchLoyalty()
  }, [session, router, status, page])

  const fetchLoyalty = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/account/loyalty?page=${page}`)
      if (res.ok) {
        const data = await res.json()
        setLoyalty(data.loyalty)
        setTransactions(data.transactions)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching loyalty:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    const colors: any = {
      Bronze: 'from-orange-800 to-orange-600',
      Silver: 'from-gray-400 to-gray-300',
      Gold: 'from-yellow-600 to-yellow-400',
      Platinum: 'from-purple-600 to-purple-400',
    }
    return colors[tier] || 'from-gray-600 to-gray-500'
  }

  const getTierBadgeColor = (tier: string) => {
    const colors: any = {
      Bronze: 'bg-orange-500/20 text-orange-400',
      Silver: 'bg-gray-400/20 text-gray-300',
      Gold: 'bg-yellow-500/20 text-yellow-400',
      Platinum: 'bg-purple-500/20 text-purple-400',
    }
    return colors[tier] || 'bg-gray-500/20 text-gray-400'
  }

  const getNextTier = (currentTier: string) => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
    const currentIndex = tiers.indexOf(currentTier)
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
  }

  const getPointsForNextTier = (currentTier: string) => {
    const thresholds: any = {
      Bronze: 1000,
      Silver: 2500,
      Gold: 5000,
      Platinum: 10000,
    }
    const nextTier = getNextTier(currentTier)
    return nextTier ? thresholds[nextTier] : null
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: any = {
      EARNED: 'Gagné',
      REDEEMED: 'Utilisé',
      EXPIRED: 'Expiré',
      BONUS: 'Bonus',
      REFUND: 'Remboursement',
    }
    return labels[type] || type
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!loyalty) return null

  // Default values for loyalty fields that might be undefined
  const currentPoints = loyalty.points ?? 0
  const lifetimePoints = loyalty.lifetimePoints ?? 0
  const currentTier = loyalty.tier ?? 'Bronze'

  const nextTier = getNextTier(currentTier)
  const pointsForNext = getPointsForNextTier(currentTier)
  const progress = pointsForNext ? (lifetimePoints / pointsForNext) * 100 : 100

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Programme de Fidélité</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Gagnez des points à chaque achat et profitez d'avantages exclusifs
              </p>
            </div>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          {/* Points Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Current Points Card */}
            <div className={`bg-gradient-to-br ${getTierColor(currentTier)} rounded-lg p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierBadgeColor(currentTier)}`}>
                  {currentTier}
                </span>
              </div>
              <p className="text-white/80 text-sm mb-2">Points disponibles</p>
              <p className="text-4xl font-bold">{currentPoints.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-2">
                1 point = 1 CFA de réduction
              </p>
            </div>

            {/* Lifetime Points */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Points à vie</p>
                  <p className="text-gray-900 dark:text-white text-2xl font-bold">
                    {lifetimePoints.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Total de points accumulés depuis votre inscription
              </p>
            </div>

            {/* Next Tier */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Prochain niveau</p>
                  <p className="text-gray-900 dark:text-white text-xl font-bold">
                    {nextTier || 'Niveau Max'}
                  </p>
                </div>
              </div>
              {nextTier && pointsForNext && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-dark-800 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {Math.max(0, pointsForNext - lifetimePoints)} points restants
                  </p>
                </>
              )}
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary-500" />
              Comment ça marche ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-400 font-bold">1</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Achetez</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Gagnez 1 point pour chaque 100 CFA dépensé
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-400 font-bold">2</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Accumulez</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Montez en niveau pour débloquer plus d'avantages
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-400 font-bold">3</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Utilisez</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Échangez vos points contre des réductions
                </p>
              </div>
            </div>
          </div>

          {/* Transactions History */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Historique des points</h2>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune transaction trouvée</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Commencez vos achats pour gagner des points
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-100 dark:bg-dark-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        transaction.points > 0
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        {transaction.points > 0 ? (
                          <ArrowUp className="h-5 w-5 text-green-400" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {getTransactionTypeLabel(transaction.type)}
                        </p>
                        {transaction.description && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">{transaction.description}</p>
                        )}
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                          {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xl font-bold ${
                      transaction.points > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-gray-200 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-gray-900 dark:text-white px-4 py-2">
                  Page {page} sur {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="bg-gray-200 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
