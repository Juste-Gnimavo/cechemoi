'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  User,
  Calendar,
  AlertTriangle,
  Package,
  Scissors,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Suivi de production (voir messages/04) : étapes en menu latéral, contenu de
// l'étape à droite. Les changements d'étape et l'assignation couturier se font
// par sélecteurs — utilisable au doigt sur iPhone/iPad, contrairement à
// l'ancien kanban drag & drop.

const STAGES = [
  { id: 'PENDING', label: 'En attente', dot: 'bg-gray-500', icon: Clock },
  { id: 'CUTTING', label: 'Coupe', dot: 'bg-yellow-500', icon: Scissors },
  { id: 'SEWING', label: 'Couture', dot: 'bg-blue-500', icon: Package },
  { id: 'FITTING', label: 'Essayage', dot: 'bg-purple-500', icon: User },
  { id: 'ALTERATIONS', label: 'Retouches', dot: 'bg-orange-500', icon: Scissors },
  { id: 'FINISHING', label: 'Finitions', dot: 'bg-cyan-500', icon: CheckCircle },
  { id: 'COMPLETED', label: 'Terminé', dot: 'bg-green-500', icon: CheckCircle },
]

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: '',
  URGENT: 'border-l-4 border-l-orange-500',
  VIP: 'border-l-4 border-l-red-500',
}

interface KanbanItem {
  id: string
  garmentType: string
  customType?: string
  description?: string
  quantity: number
  status: string
  tailorId?: string
  tailor?: {
    id: string
    name: string
  }
  customOrder: {
    id: string
    orderNumber: string
    pickupDate: string
    priority: string
    customer: {
      id: string
      name: string
      phone: string
    }
  }
}

interface Tailor {
  id: string
  name: string
  activeItems: number
}

export default function ProductionPage() {
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<Record<string, KanbanItem[]>>({})
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedTailor, setSelectedTailor] = useState('')
  const [selectedStage, setSelectedStage] = useState('PENDING')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedTailor])

  const fetchData = async () => {
    try {
      const url = selectedTailor
        ? `/api/admin/production?tailorId=${selectedTailor}`
        : '/api/admin/production'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setColumns(data.columns)
        setTailors(data.tailors)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching production data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (
    item: KanbanItem,
    payload: { status?: string; tailorId?: string | null },
    successMessage: string
  ) => {
    setUpdating(item.id)
    try {
      const res = await fetch(`/api/admin/custom-orders/${item.customOrder.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, ...payload }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(successMessage)
        fetchData()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  const getDaysUntilPickup = (pickupDate: string) => {
    return Math.ceil((new Date(pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  const currentStage = STAGES.find((s) => s.id === selectedStage) || STAGES[0]
  const items = columns[selectedStage] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Choisissez une étape à gauche — changez l&apos;étape ou le couturier
            directement sur chaque article. La cliente est notifiée
            automatiquement aux étapes clés de sa commande.
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total en cours</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Urgent/VIP</p>
            <p className="text-2xl font-bold text-orange-500">{stats.urgent}</p>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Non assignés</p>
            <p className="text-2xl font-bold text-red-500">{stats.unassigned}</p>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Terminés</p>
            <p className="text-2xl font-bold text-green-500">{columns.COMPLETED?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Filtre couturier */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtrer par couturier:</span>
        </div>
        <select
          value={selectedTailor}
          onChange={(e) => setSelectedTailor(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
        >
          <option value="">Tous les couturiers</option>
          {tailors.map((tailor) => (
            <option key={tailor.id} value={tailor.id}>
              {tailor.name} ({tailor.activeItems})
            </option>
          ))}
        </select>
      </div>

      {/* Étapes (sidebar) + contenu */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Menu des étapes — vertical sur desktop, chips horizontales sur mobile */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {STAGES.map((stage) => {
              const count = (columns[stage.id] || []).length
              const active = selectedStage === stage.id
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap lg:w-full ${
                    active
                      ? 'bg-primary-500 text-white font-semibold shadow-sm'
                      : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                    {stage.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      active
                        ? 'bg-white/20 text-white'
                        : count > 0
                          ? 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                          : 'text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Contenu de l'étape sélectionnée */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-3 h-3 rounded-full ${currentStage.dot}`} />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {currentStage.label}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              — {items.length} article{items.length > 1 ? 's' : ''}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center text-gray-400">
              Aucun article à cette étape.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((item) => {
                const daysUntil = getDaysUntilPickup(item.customOrder.pickupDate)
                const isUrgent = daysUntil <= 3
                const isLate = daysUntil <= 0

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-3 shadow-sm ${PRIORITY_COLORS[item.customOrder.priority]} ${
                      updating === item.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Order info */}
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        href={`/admin/custom-orders/${item.customOrder.id}`}
                        className="text-xs font-medium text-primary-500 hover:text-primary-400"
                      >
                        {item.customOrder.orderNumber}
                      </Link>
                      {item.customOrder.priority !== 'NORMAL' && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${item.customOrder.priority === 'VIP' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}
                        >
                          {item.customOrder.priority}
                        </span>
                      )}
                    </div>

                    {/* Garment type */}
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.garmentType}
                      {item.customType && ` (${item.customType})`}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </p>

                    {/* Customer */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.customOrder.customer.name}
                    </p>

                    {/* Pickup date */}
                    <div
                      className={`text-xs mt-1.5 flex items-center gap-1 ${isLate ? 'text-red-500 font-medium' : isUrgent ? 'text-orange-500' : 'text-gray-400'}`}
                    >
                      <Calendar className="h-3 w-3" />
                      Retrait : {new Date(item.customOrder.pickupDate).toLocaleDateString('fr-FR')}
                      {isLate && ' (EN RETARD)'}
                      {!isLate && isUrgent && ` (J-${daysUntil})`}
                    </div>

                    {/* Actions : couturier + étape */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700 space-y-2">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                          Couturier
                        </label>
                        <select
                          value={item.tailorId || ''}
                          onChange={(e) =>
                            updateItem(
                              item,
                              { tailorId: e.target.value || null },
                              e.target.value ? 'Couturier assigné' : 'Couturier retiré'
                            )
                          }
                          className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                            item.tailorId
                              ? 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white'
                              : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                          }`}
                        >
                          <option value="">Non assigné</option>
                          {tailors.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                          Étape
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateItem(item, { status: e.target.value }, 'Étape mise à jour')
                          }
                          className="w-full px-2 py-1.5 text-xs rounded-lg border bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-l-4 border-l-red-500 bg-white dark:bg-dark-800 rounded"></div>
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-l-4 border-l-orange-500 bg-white dark:bg-dark-800 rounded"></div>
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span>Non assigné</span>
        </div>
      </div>
    </div>
  )
}
