'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Bell,
  History,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface InventoryOverview {
  totalProducts: number
  publishedProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalStockValue: number
  totalStockQuantity: number
}

interface Product {
  id: string
  name: string
  sku: string
  stock: number
  lowStockThreshold: number
  price: number
  category: {
    name: string
  }
}

interface StockMovement {
  id: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  performedByName?: string
  createdAt: string
  product: {
    name: string
    sku: string
  }
}

interface CategoryStat {
  category: string
  products: number
  totalStock: number
  stockValue: number
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<InventoryOverview | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([])
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [stockByCategory, setStockByCategory] = useState<CategoryStat[]>([])
  const [sendingAlerts, setSendingAlerts] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/inventory/overview')
      const data = await response.json()

      if (data.success) {
        setOverview(data.overview)
        setLowStockProducts(data.lowStockProducts)
        setOutOfStockProducts(data.outOfStockProducts)
        setRecentMovements(data.recentMovements)
        setStockByCategory(data.stockByCategory)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Erreur lors du chargement de l\'inventaire')
    } finally {
      setLoading(false)
    }
  }

  const handleSendAlerts = async () => {
    try {
      setSendingAlerts(true)
      const response = await fetch('/api/admin/inventory/alerts/send', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending alerts:', error)
      toast.error('Erreur lors de l\'envoi des alertes')
    } finally {
      setSendingAlerts(false)
    }
  }

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Achat',
      sale: 'Vente',
      adjustment: 'Ajustement',
      return: 'Retour',
      damaged: 'Endommagé',
    }
    return labels[type] || type
  }

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      purchase: 'text-green-500',
      sale: 'text-blue-500',
      adjustment: 'text-yellow-500',
      return: 'text-purple-500',
      damaged: 'text-red-500',
    }
    return colors[type] || 'text-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion de l'inventaire</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble et gestion des stocks</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
          <button
            onClick={handleSendAlerts}
            disabled={sendingAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white rounded-lg transition-all duration-200"
          >
            <Bell className="h-4 w-4" />
            {sendingAlerts ? 'Envoi...' : 'Envoyer alertes'}
          </button>
          <Link
            href="/admin/inventory/movements"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <History className="h-4 w-4" />
            Historique
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Produits totaux</span>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalProducts}</div>
            <p className="text-sm text-gray-500 mt-1">
              {overview.publishedProducts} publiés
            </p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">En stock</span>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.inStock}</div>
            <p className="text-sm text-gray-500 mt-1">Disponibles</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Stock faible</span>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.lowStock}</div>
            <p className="text-sm text-gray-500 mt-1">Besoin de réapprovisionnement</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Rupture de stock</span>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.outOfStock}</div>
            <p className="text-sm text-gray-500 mt-1">Indisponibles</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Valeur totale du stock</span>
              <DollarSign className="h-5 w-5 text-primary-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {overview.totalStockValue.toLocaleString()} CFA
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {overview.totalStockQuantity.toLocaleString()} unités
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Stock faible
            </h2>
            <Link
              href="/admin/inventory/alerts?type=low"
              className="text-primary-500 text-sm hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun produit en stock faible</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-dark-800 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">{product.name}</p>
                      <p className="text-gray-500 text-sm">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-600 dark:text-yellow-500 font-bold">
                        {product.stock} / {product.lowStockThreshold}
                      </p>
                      <p className="text-gray-500 text-xs">{product.category.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Rupture de stock
            </h2>
            <Link
              href="/admin/inventory/alerts?type=out"
              className="text-primary-500 text-sm hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="p-6">
            {outOfStockProducts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun produit en rupture</p>
            ) : (
              <div className="space-y-3">
                {outOfStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-dark-800 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">{product.name}</p>
                      <p className="text-gray-500 text-sm">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-500 font-bold">0</p>
                      <p className="text-gray-500 text-xs">{product.category.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-primary-500" />
            Mouvements récents
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-100 dark:bg-dark-800/50">
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Produit
                </th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">Type</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Quantité
                </th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">Stock</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">Par</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
              {recentMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{movement.product.name}</p>
                      <p className="text-gray-500 text-sm">{movement.product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getMovementTypeColor(movement.type)}>
                      {getMovementTypeLabel(movement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-semibold ${
                        movement.quantity > 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {movement.quantity > 0 ? '+' : ''}
                      {movement.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 dark:text-gray-300">
                      {movement.previousStock} → {movement.newStock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {movement.performedByName || 'Système'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock by Category */}
      {stockByCategory.length > 0 && (
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock par catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockByCategory.map((stat) => (
              <div key={stat.category} className="bg-gray-100 dark:bg-dark-800/50 rounded-lg p-4">
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">{stat.category}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Produits:</span>
                    <span className="text-gray-900 dark:text-white">{stat.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Stock total:</span>
                    <span className="text-gray-900 dark:text-white">{stat.totalStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Valeur:</span>
                    <span className="text-gray-900 dark:text-white">{stat.stockValue.toLocaleString()} CFA</span>
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
