'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  RotateCcw,
  Package,
  User,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Movement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUST' | 'RETURN'
  quantity: number
  unitPrice: number
  totalCost: number
  previousStock: number
  newStock: number
  notes: string | null
  reference: string | null
  createdAt: string
  material: {
    id: string
    name: string
    unit: string
    category: { name: string }
  }
  tailor: { id: string; name: string; phone: string } | null
  customOrder: {
    id: string
    orderNumber: string
    customer: { name: string }
  } | null
  createdBy: { id: string; name: string } | null
  createdByName: string | null
}

const TYPE_CONFIG = {
  IN: {
    label: 'Entree',
    icon: ArrowDownCircle,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  OUT: {
    label: 'Sortie',
    icon: ArrowUpCircle,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  ADJUST: {
    label: 'Ajustement',
    icon: RefreshCcw,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  RETURN: {
    label: 'Retour',
    icon: RotateCcw,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
}

function MovementsContent() {
  const searchParams = useSearchParams()
  const initialMaterialId = searchParams.get('materialId')
  const initialTailorId = searchParams.get('tailorId')
  const initialOrderId = searchParams.get('customOrderId')

  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState<any>(null)

  // Filters
  const [materialId, setMaterialId] = useState(initialMaterialId || '')
  const [tailorId, setTailorId] = useState(initialTailorId || '')
  const [customOrderId, setCustomOrderId] = useState(initialOrderId || '')
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter options
  const [materials, setMaterials] = useState<any[]>([])
  const [tailors, setTailors] = useState<any[]>([])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchMovements()
  }, [materialId, tailorId, customOrderId, type, startDate, endDate])

  const fetchFilterOptions = async () => {
    try {
      const [matRes, tailorRes] = await Promise.all([
        fetch('/api/admin/materials?limit=1000'),
        fetch('/api/admin/tailors'),
      ])
      const matData = await matRes.json()
      const tailorData = await tailorRes.json()

      if (matData.success) setMaterials(matData.materials)
      if (tailorData.success) setTailors(tailorData.tailors)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (materialId) params.set('materialId', materialId)
      if (tailorId) params.set('tailorId', tailorId)
      if (customOrderId) params.set('customOrderId', customOrderId)
      if (type) params.set('type', type)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      params.set('limit', '100')

      const res = await fetch(`/api/admin/materials/movements?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setMovements(data.movements)
        setTotals(data.totals)
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setMaterialId('')
    setTailorId('')
    setCustomOrderId('')
    setType('')
    setStartDate('')
    setEndDate('')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' CFA'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/materials"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Historique des Mouvements
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Toutes les entrees et sorties de materiels
            </p>
          </div>
        </div>
        <button
          onClick={fetchMovements}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total mouvements</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{movements.length}</p>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Valeur totale</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(totals.totalCost)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tous les types</option>
            <option value="IN">Entrees</option>
            <option value="OUT">Sorties</option>
            <option value="ADJUST">Ajustements</option>
            <option value="RETURN">Retours</option>
          </select>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tous les materiels</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={tailorId}
            onChange={(e) => setTailorId(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tous les couturiers</option>
            {tailors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
            placeholder="Date debut"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
            placeholder="Date fin"
          />
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
          >
            Effacer filtres
          </button>
        </div>
      </div>

      {/* Movements List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : movements.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun mouvement trouve
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucun mouvement ne correspond a vos criteres de recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {movements.map((movement) => {
            const config = TYPE_CONFIG[movement.type]
            const Icon = config.icon

            return (
              <div
                key={movement.id}
                className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {movement.material.name}
                          <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                            ({movement.material.category.name})
                          </span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className={`font-medium ${config.color}`}>{config.label}</span>
                          {' - '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {movement.quantity} {movement.material.unit}
                          </span>
                          {' @ '}
                          {formatPrice(movement.unitPrice)}
                          {' = '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatPrice(movement.totalCost)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500 dark:text-gray-400">
                          {formatDate(movement.createdAt)}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500">
                          Stock: {movement.previousStock} → {movement.newStock}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      {movement.tailor && (
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4" />
                          {movement.tailor.name}
                        </span>
                      )}
                      {movement.customOrder && (
                        <Link
                          href={`/admin/custom-orders/${movement.customOrder.id}`}
                          className="flex items-center gap-1 text-primary-500 hover:text-primary-400"
                        >
                          <FileText className="h-4 w-4" />
                          {movement.customOrder.orderNumber}
                        </Link>
                      )}
                      {(movement.createdBy || movement.createdByName) && (
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
                          Par: {movement.createdBy?.name || movement.createdByName}
                        </span>
                      )}
                      {movement.reference && (
                        <span className="text-gray-500 dark:text-gray-500">
                          Ref: {movement.reference}
                        </span>
                      )}
                    </div>

                    {movement.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                        "{movement.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MovementsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    }>
      <MovementsContent />
    </Suspense>
  )
}
