'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Printer, User, Scissors } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Fiche de sortie de matériels par couturier (voir messages/10) : qui a pris
// quoi, quand, pour quelle commande — imprimable pour l'atelier.

interface OutMovement {
  id: string
  quantity: number
  unitPrice: number
  totalCost: number
  createdAt: string
  notes: string | null
  material: { id: string; name: string; unit: string; category: { name: string } }
  customOrder: { id: string; orderNumber: string; customer: { name: string } } | null
  createdBy: { id: string; name: string } | null
  createdByName: string | null
}

function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function FicheSortieCouturierPage() {
  const [tailors, setTailors] = useState<any[]>([])
  const [tailorId, setTailorId] = useState('')
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [movements, setMovements] = useState<OutMovement[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTailors = async () => {
      try {
        const res = await fetch('/api/admin/tailors')
        const data = await res.json()
        if (data.success) setTailors(data.tailors)
      } catch (error) {
        console.error('Error fetching tailors:', error)
      }
    }
    fetchTailors()
  }, [])

  useEffect(() => {
    if (!tailorId) {
      setMovements([])
      return
    }
    const fetchMovements = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          type: 'OUT',
          tailorId,
          limit: '500',
        })
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        const res = await fetch(`/api/admin/materials/movements?${params.toString()}`)
        const data = await res.json()
        if (data.success) setMovements(data.movements)
      } catch (error) {
        console.error('Error fetching movements:', error)
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchMovements()
  }, [tailorId, startDate, endDate])

  const selectedTailor = tailors.find((t) => t.id === tailorId)
  const totalCost = movements.reduce((s, m) => s + m.totalCost, 0)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' CFA'
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return (
    <div className="space-y-6">
      {/* Impression : seule la zone .print-area est imprimée */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
        }
      `}</style>

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fiche de sortie par couturier
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Matériels sortis pour un couturier sur une période
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          disabled={!tailorId || movements.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          Imprimer la fiche
        </button>
      </div>

      {/* Sélection */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Couturier <span className="text-red-500">*</span>
            </label>
            <select
              value={tailorId}
              onChange={(e) => setTailorId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
            >
              <option value="">Sélectionner un couturier</option>
              {tailors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Du
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Au
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Fiche */}
      {!tailorId ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center text-gray-500 dark:text-gray-400">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          Sélectionnez un couturier pour afficher sa fiche de sortie.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : (
        <div className="print-area bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
          {/* En-tête de la fiche */}
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Fiche de sortie de matériels — CÈCHÉMOI
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Couturier : <span className="font-semibold">{selectedTailor?.name || '—'}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Période : du {startDate.split('-').reverse().join('/')} au{' '}
                  {endDate.split('-').reverse().join('/')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Valeur totale sortie</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(totalCost)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {movements.length} sortie(s)
                </p>
              </div>
            </div>
          </div>

          {movements.length === 0 ? (
            <p className="p-8 text-center text-gray-500 dark:text-gray-400">
              Aucune sortie de matériel pour ce couturier sur la période.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Matériel
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantité
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Commande
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Coût
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {m.material.name}
                      <span className="text-gray-400 text-xs ml-1">
                        ({m.material.category.name})
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap text-gray-900 dark:text-white font-medium">
                      {m.quantity} {m.material.unit}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {m.customOrder ? (
                        <>
                          {m.customOrder.orderNumber}
                          <span className="text-gray-400 text-xs ml-1">
                            ({m.customOrder.customer?.name})
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap text-gray-900 dark:text-white">
                      {formatPrice(m.totalCost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-dark-900 font-semibold">
                  <td colSpan={4} className="px-4 py-2 text-right text-gray-900 dark:text-white">
                    Total
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap text-gray-900 dark:text-white">
                    {formatPrice(totalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
