'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StockMovement {
  id: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  notes?: string
  reference?: string
  performedByName?: string
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    images: string[]
  }
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    fetchMovements()
  }, [filters])

  const fetchMovements = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/admin/inventory/movements?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setMovements(data.movements)
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
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
      purchase: 'bg-green-500/10 text-green-500 border-green-500/20',
      sale: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      adjustment: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      return: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      damaged: 'bg-red-500/10 text-red-500 border-red-500/20',
    }
    return colors[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inventory"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique des mouvements</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Tous les changements de stock</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les types</option>
              <option value="purchase">Achat</option>
              <option value="sale">Vente</option>
              <option value="adjustment">Ajustement</option>
              <option value="return">Retour</option>
              <option value="damaged">Endommagé</option>
            </select>
          </div>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
          </div>
        ) : movements.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Aucun mouvement trouvé</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-100 dark:bg-dark-800/50">
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    Produit
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Type</th>
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    Quantité
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    Avant → Après
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    Raison
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                    Effectué par
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-dark-800 rounded overflow-hidden flex-shrink-0">
                          {movement.product.images[0] ? (
                            <img
                              src={movement.product.images[0]}
                              alt={movement.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 dark:text-gray-600 text-xs">N/A</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{movement.product.name}</p>
                          <p className="text-gray-500 text-sm">{movement.product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs border ${getMovementTypeColor(
                          movement.type
                        )}`}
                      >
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${
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
                      <p className="text-gray-700 dark:text-gray-300 text-sm max-w-xs truncate">
                        {movement.reason || movement.reference || '-'}
                      </p>
                      {movement.notes && (
                        <p className="text-gray-500 text-xs mt-1">{movement.notes}</p>
                      )}
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
                          year: 'numeric',
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
        )}
      </div>
    </div>
  )
}
