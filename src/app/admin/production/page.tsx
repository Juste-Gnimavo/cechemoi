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

// Column definitions
const COLUMNS = [
  { id: 'PENDING', label: 'En attente', color: 'bg-gray-500', icon: Clock },
  { id: 'CUTTING', label: 'Coupe', color: 'bg-yellow-500', icon: Scissors },
  { id: 'SEWING', label: 'Couture', color: 'bg-blue-500', icon: Package },
  { id: 'FITTING', label: 'Essayage', color: 'bg-purple-500', icon: User },
  { id: 'ALTERATIONS', label: 'Retouches', color: 'bg-orange-500', icon: Scissors },
  { id: 'FINISHING', label: 'Finitions', color: 'bg-cyan-500', icon: CheckCircle },
  { id: 'COMPLETED', label: 'Terminé', color: 'bg-green-500', icon: CheckCircle },
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

export default function ProductionKanbanPage() {
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<Record<string, KanbanItem[]>>({})
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedTailor, setSelectedTailor] = useState('')
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null)
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

  const handleDragStart = (e: React.DragEvent, item: KanbanItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.status === newStatus) {
      setDraggedItem(null)
      return
    }

    setUpdating(draggedItem.id)

    try {
      const res = await fetch(`/api/admin/custom-orders/${draggedItem.customOrder.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: draggedItem.id,
          status: newStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Statut mis à jour')
        fetchData()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setDraggedItem(null)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tableau de suivi de la production - Glissez-déposez pour changer le statut
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

      {/* Filters */}
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

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const Icon = column.icon
          const items = columns[column.id] || []

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`${column.color} rounded-t-lg px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-white">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{column.label}</span>
                </div>
                <span className="bg-white/20 px-2 py-0.5 rounded text-white text-sm">{items.length}</span>
              </div>

              {/* Column Body */}
              <div className="bg-gray-100 dark:bg-dark-900 rounded-b-lg min-h-[400px] p-2 space-y-2">
                {items.map((item) => {
                  const daysUntil = getDaysUntilPickup(item.customOrder.pickupDate)
                  const isUrgent = daysUntil <= 3
                  const isLate = daysUntil <= 0

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={`bg-white dark:bg-dark-800 rounded-lg p-3 shadow-sm cursor-move hover:shadow-md transition-shadow ${PRIORITY_COLORS[item.customOrder.priority]} ${updating === item.id ? 'opacity-50' : ''}`}
                    >
                      {/* Order info */}
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/admin/custom-orders/${item.customOrder.id}`}
                          className="text-xs font-medium text-primary-500 hover:text-primary-400"
                          onClick={(e) => e.stopPropagation()}
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

                      {/* Tailor */}
                      {item.tailor ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {item.tailor.name}
                        </p>
                      ) : (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Non assigné
                        </p>
                      )}

                      {/* Pickup date */}
                      <div
                        className={`text-xs mt-2 flex items-center gap-1 ${isLate ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-400'}`}
                      >
                        <Calendar className="h-3 w-3" />
                        {new Date(item.customOrder.pickupDate).toLocaleDateString('fr-FR')}
                        {isLate && ' (EN RETARD)'}
                        {!isLate && isUrgent && ` (J-${daysUntil})`}
                      </div>
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Aucun article</div>
                )}
              </div>
            </div>
          )
        })}
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
