'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Loader2,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  RotateCcw,
  Package,
  Pencil,
  History,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Fiche matériel : tout ce qui concerne un matériel donné sur un seul écran —
// stock, valeur, entrées/sorties cumulées, utilisation par couturier et
// historique des mouvements (voir messages/15).

interface MovementRow {
  id: string
  type: 'IN' | 'OUT' | 'ADJUST' | 'RETURN'
  quantity: number
  unitPrice: number
  totalCost: number
  previousStock: number
  newStock: number
  notes: string | null
  createdAt: string
  tailor: { id: string; name: string } | null
  customOrder: { id: string; orderNumber: string } | null
  createdBy: { id: string; name: string } | null
}

interface MaterialDetail {
  id: string
  name: string
  sku: string | null
  unit: string
  unitPrice: number
  stock: number
  lowStockThreshold: number
  description: string | null
  supplier: string | null
  color: string | null
  isActive: boolean
  isLowStock: boolean
  movementsCount: number
  category: { id: string; name: string }
  movements?: MovementRow[]
}

interface MaterialStats {
  byType: { type: string; count: number; totalQuantity: number; totalCost: number }[]
  byTailor: {
    tailorId: string
    tailorName: string
    count: number
    totalQuantity: number
    totalCost: number
  }[]
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  IN: { label: 'Entrée', icon: ArrowDownCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  OUT: { label: 'Sortie', icon: ArrowUpCircle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ADJUST: { label: 'Ajustement', icon: RefreshCcw, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  RETURN: { label: 'Retour', icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' CFA'
}

function formatQty(qty: number) {
  return new Intl.NumberFormat('fr-FR').format(qty)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MaterialDetailPage() {
  const params = useParams()
  const materialId = params.id as string

  const [material, setMaterial] = useState<MaterialDetail | null>(null)
  const [stats, setStats] = useState<MaterialStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = await fetch(`/api/admin/materials/${materialId}?history=true&stats=true`)
        const data = await res.json()
        if (data.success) {
          setMaterial(data.material)
          setStats(data.stats || null)
        } else {
          toast.error(data.error || 'Matériel non trouvé')
        }
      } catch (error) {
        console.error('Error fetching material:', error)
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchMaterial()
  }, [materialId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Matériel non trouvé.{' '}
        <Link href="/admin/materials" className="text-primary-500 underline">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const totalIn = stats?.byType.find((t) => t.type === 'IN')
  const totalOut = stats?.byType.find((t) => t.type === 'OUT')
  const totalAdjust = stats?.byType.find((t) => t.type === 'ADJUST')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/materials"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {material.name}
              </h1>
              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded">
                {material.category.name}
              </span>
              {material.isLowStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  Stock faible
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {material.sku && <span className="mr-3">SKU : {material.sku}</span>}
              {material.supplier && <span className="mr-3">Fournisseur : {material.supplier}</span>}
              {material.color && <span>Couleur : {material.color}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/materials/movements?materialId=${material.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
          >
            <History className="h-4 w-4" />
            Tous les mouvements
          </Link>
          <Link
            href={`/admin/materials/${material.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </div>
      </div>

      {/* Stock & valeur */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Stock actuel</p>
          <p className={`text-2xl font-bold ${material.isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
            {formatQty(material.stock)} {material.unit}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Prix unitaire</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(material.unitPrice)}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Valeur du stock</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(material.stock * material.unitPrice)}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Mouvements</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {material.movementsCount}
          </p>
        </div>
      </div>

      {/* Cumuls entrées / sorties / ajustements */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Entrées ({totalIn?.count || 0})
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatQty(totalIn?.totalQuantity || 0)} {material.unit}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatPrice(totalIn?.totalCost || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sorties ({totalOut?.count || 0})
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatQty(totalOut?.totalQuantity || 0)} {material.unit}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatPrice(totalOut?.totalCost || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCcw className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Ajustements</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totalAdjust?.count || 0}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historique des mouvements */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-gray-400" />
              Derniers mouvements
            </h2>
            <Link
              href={`/admin/materials/movements?materialId=${material.id}`}
              className="text-sm text-primary-500 hover:underline"
            >
              Tout voir
            </Link>
          </div>
          {!material.movements || material.movements.length === 0 ? (
            <p className="p-6 text-center text-gray-500 dark:text-gray-400">
              Aucun mouvement enregistré.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-dark-700">
              {material.movements.map((m) => {
                const config = TYPE_CONFIG[m.type]
                const Icon = config.icon
                return (
                  <div key={m.id} className="p-3 flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${config.bg} shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-gray-900 dark:text-white">
                          <span className={`font-medium ${config.color}`}>{config.label}</span>
                          {' — '}
                          {formatQty(m.quantity)} {material.unit}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(m.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Stock : {formatQty(m.previousStock)} → {formatQty(m.newStock)}
                        </span>
                        {m.tailor && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {m.tailor.name}
                          </span>
                        )}
                        {m.customOrder && (
                          <Link
                            href={`/admin/custom-orders/${m.customOrder.id}`}
                            className="flex items-center gap-1 text-primary-500 hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            {m.customOrder.orderNumber}
                          </Link>
                        )}
                        {m.createdBy && <span>Par : {m.createdBy.name}</span>}
                      </div>
                      {m.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                          « {m.notes} »
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Utilisation par couturier */}
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg h-fit">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Utilisation par couturier
            </h2>
          </div>
          {!stats || stats.byTailor.length === 0 ? (
            <p className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              Aucune sortie liée à un couturier.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-dark-700">
              {stats.byTailor.map((t) => (
                <div key={t.tailorId} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.tailorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.count} sortie(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatQty(t.totalQuantity)} {material.unit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPrice(t.totalCost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {material.description && (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            Description
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {material.description}
          </p>
        </div>
      )}
    </div>
  )
}
