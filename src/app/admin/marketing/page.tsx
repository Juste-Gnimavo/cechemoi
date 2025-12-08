'use client'

import { useState, useEffect } from 'react'
import { Package, ShoppingCart, Award, TrendingUp, Mail, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Bundle {
  id: string
  name: string
  bundlePrice: number
  regularPrice: number
  discount: number
  enabled: boolean
  items: Array<{
    quantity: number
    product: {
      name: string
      price: number
    }
  }>
}

interface LoyaltyAccount {
  id: string
  points: number
  totalEarned: number
  tier: string
  user: {
    name: string | null
    phone: string
  }
}

interface AbandonedCart {
  id: string
  subtotal: number
  emailSent: boolean
  createdAt: Date
  user: {
    name: string | null
    phone: string
  } | null
  guestEmail: string | null
  guestPhone: string | null
}

export default function MarketingDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([])
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'bundles', label: 'Packs Produits', icon: Package },
    { id: 'loyalty', label: 'Fidélité', icon: Award },
    { id: 'abandoned', label: 'Paniers Abandonnés', icon: ShoppingCart },
  ]

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (activeTab === 'bundles' || activeTab === 'overview') {
        const bundlesRes = await fetch('/api/admin/marketing/bundles')
        const bundlesData = await bundlesRes.json()
        if (bundlesData.success) setBundles(bundlesData.bundles)
      }

      if (activeTab === 'loyalty' || activeTab === 'overview') {
        const loyaltyRes = await fetch('/api/admin/marketing/loyalty')
        const loyaltyData = await loyaltyRes.json()
        if (loyaltyData.success) {
          setLoyaltyAccounts(loyaltyData.accounts)
          if (loyaltyData.stats) setStats((prev: any) => ({ ...prev, loyalty: loyaltyData.stats }))
        }
      }

      if (activeTab === 'abandoned' || activeTab === 'overview') {
        const cartsRes = await fetch('/api/admin/marketing/abandoned-carts')
        const cartsData = await cartsRes.json()
        if (cartsData.success) {
          setAbandonedCarts(cartsData.carts)
          if (cartsData.stats) setStats((prev: any) => ({ ...prev, carts: cartsData.stats }))
        }
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRecoveryEmail = async (cartId: string) => {
    try {
      const response = await fetch('/api/admin/marketing/abandoned-carts/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Email envoyé')
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'text-orange-600',
      silver: 'text-gray-400',
      gold: 'text-yellow-500',
      platinum: 'text-purple-500',
    }
    return colors[tier] || 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Outils marketing et fidélisation client</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Packs Produits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{bundles.length}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {bundles.filter(b => b.enabled).length} actifs
              </p>
            </div>

            {stats?.loyalty && (
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Comptes Fidélité</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.loyalty.totalAccounts}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {stats.loyalty.totalPoints._sum.points || 0} points actifs
                </p>
              </div>
            )}

            {stats?.carts && (
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Paniers Abandonnés</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.carts.pending}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {formatCurrency(stats.carts.potentialRevenue)} potentiel
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Bundles */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Packs Populaires</h3>
              <div className="space-y-3">
                {bundles.slice(0, 5).map((bundle) => (
                  <div key={bundle.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{bundle.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {bundle.items.length} produits • {bundle.discount.toFixed(0)}% réduction
                      </p>
                    </div>
                    <p className="text-primary-500 font-semibold">
                      {formatCurrency(bundle.bundlePrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Loyalty Members */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Fidélité</h3>
              <div className="space-y-3">
                {loyaltyAccounts.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {account.user.name || account.user.phone}
                      </p>
                      <p className={`text-sm capitalize ${getTierColor(account.tier)}`}>
                        {account.tier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white font-semibold">{account.points} pts</p>
                      <p className="text-xs text-gray-500">
                        {account.totalEarned} gagnés
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bundles Tab */}
      {activeTab === 'bundles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href="/admin/marketing/bundles/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Créer un Pack
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{bundle.name}</h3>
                  {bundle.enabled ? (
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500/10 text-gray-500 text-xs rounded">
                      Inactif
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Prix régulier:</span>
                    <span className="text-gray-500 dark:text-gray-400 line-through">
                      {formatCurrency(bundle.regularPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900 dark:text-white font-medium">Prix pack:</span>
                    <span className="text-primary-500 font-semibold">
                      {formatCurrency(bundle.bundlePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Économie:</span>
                    <span className="text-green-500">
                      {bundle.discount.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-dark-800 pt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Produits inclus:</p>
                  <ul className="space-y-1">
                    {bundle.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                        {item.quantity}x {item.product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loyalty Tab */}
      {activeTab === 'loyalty' && (
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th className="text-left p-4 text-gray-500 dark:text-gray-300">Client</th>
                  <th className="text-left p-4 text-gray-500 dark:text-gray-300">Niveau</th>
                  <th className="text-right p-4 text-gray-500 dark:text-gray-300">Points</th>
                  <th className="text-right p-4 text-gray-500 dark:text-gray-300">Total Gagné</th>
                  <th className="text-right p-4 text-gray-500 dark:text-gray-300">Total Dépensé</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyAccounts.map((account) => (
                  <tr key={account.id} className="border-t border-gray-200 dark:border-dark-800">
                    <td className="p-4 text-gray-900 dark:text-white">
                      {account.user.name || account.user.phone}
                    </td>
                    <td className="p-4">
                      <span className={`capitalize ${getTierColor(account.tier)}`}>
                        {account.tier}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-900 dark:text-white font-semibold">
                      {account.points}
                    </td>
                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">
                      {account.totalEarned}
                    </td>
                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">
                      {(account as any).totalSpent || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Abandoned Carts Tab */}
      {activeTab === 'abandoned' && stats?.carts && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.carts.total}</p>
            </div>
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <p className="text-gray-500 dark:text-gray-400 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.carts.pending}</p>
            </div>
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Récupérés</p>
              <p className="text-2xl font-bold text-green-500">{stats.carts.recovered}</p>
            </div>
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Taux de récupération</p>
              <p className="text-2xl font-bold text-primary-500">
                {stats.carts.recoveryRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Carts List */}
          <div className="space-y-3">
            {abandonedCarts.map((cart) => (
              <div
                key={cart.id}
                className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {cart.user?.name || cart.guestEmail || cart.guestPhone || 'Invité'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(cart.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(cart.subtotal)}
                      </p>
                      {cart.emailSent && (
                        <p className="text-xs text-gray-500">Email envoyé</p>
                      )}
                    </div>
                    {!cart.emailSent && (
                      <button
                        onClick={() => handleSendRecoveryEmail(cart.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        <Send className="h-4 w-4" />
                        Envoyer Email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
