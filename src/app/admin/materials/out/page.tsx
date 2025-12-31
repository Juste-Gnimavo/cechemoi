'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, ArrowUpCircle, Package, User, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Material {
  id: string
  name: string
  unit: string
  unitPrice: number
  stock: number
  category: { name: string }
}

interface Tailor {
  id: string
  name: string
  phone: string
}

interface CustomOrder {
  id: string
  orderNumber: string
  customer: { name: string }
}

function MaterialOutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMaterialId = searchParams.get('materialId')
  const initialOrderId = searchParams.get('customOrderId')

  const [materials, setMaterials] = useState<Material[]>([])
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [materialId, setMaterialId] = useState(initialMaterialId || '')
  const [quantity, setQuantity] = useState('')
  const [tailorId, setTailorId] = useState('')
  const [customOrderId, setCustomOrderId] = useState(initialOrderId || '')
  const [notes, setNotes] = useState('')

  // Selected material info
  const selectedMaterial = materials.find((m) => m.id === materialId)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [matRes, tailorRes, orderRes] = await Promise.all([
        fetch('/api/admin/materials?limit=1000'),
        fetch('/api/admin/tailors'),
        fetch('/api/admin/custom-orders?status=PENDING,IN_PRODUCTION,FITTING,ALTERATIONS&limit=100'),
      ])

      const matData = await matRes.json()
      const tailorData = await tailorRes.json()
      const orderData = await orderRes.json()

      if (matData.success) {
        setMaterials(matData.materials)
      }
      if (tailorData.success) {
        setTailors(tailorData.tailors)
      }
      if (orderData.success) {
        setOrders(orderData.orders || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!materialId || !quantity) {
      toast.error('Materiel et quantite sont requis')
      return
    }

    const qty = parseFloat(quantity)
    if (qty <= 0) {
      toast.error('La quantite doit etre positive')
      return
    }

    if (selectedMaterial && qty > selectedMaterial.stock) {
      toast.error(`Stock insuffisant. Stock disponible: ${selectedMaterial.stock} ${selectedMaterial.unit}`)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/materials/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId,
          type: 'OUT',
          quantity: qty,
          tailorId: tailorId || null,
          customOrderId: customOrderId || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Sortie enregistree avec succes')
        router.push('/admin/materials')
      } else {
        toast.error(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' CFA'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/materials"
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpCircle className="h-6 w-6 text-orange-500" />
            Sortie de Materiel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enregistrer une sortie de materiel pour un couturier
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6">
          {/* Material Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <Package className="h-4 w-4 inline mr-1" />
              Materiel <span className="text-red-500">*</span>
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selectionner un materiel</option>
              {materials.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.category.name}) - Stock: {mat.stock} {mat.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Material Info */}
          {selectedMaterial && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {selectedMaterial.name}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {selectedMaterial.category.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-700 dark:text-orange-300">Stock disponible</p>
                  <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                    {selectedMaterial.stock} {selectedMaterial.unit}
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Prix unitaire: {formatPrice(selectedMaterial.unitPrice)} / {selectedMaterial.unit}
                </p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Quantite <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 2.5"
              />
              {selectedMaterial && (
                <span className="px-3 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg">
                  {selectedMaterial.unit}
                </span>
              )}
            </div>
            {selectedMaterial && quantity && parseFloat(quantity) > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cout: {formatPrice(parseFloat(quantity) * selectedMaterial.unitPrice)}
              </p>
            )}
          </div>

          {/* Stock Warning */}
          {selectedMaterial && quantity && parseFloat(quantity) > selectedMaterial.stock && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                Attention: Stock insuffisant! Disponible: {selectedMaterial.stock} {selectedMaterial.unit}
              </p>
            </div>
          )}

          {/* Tailor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Couturier (qui a demande)
            </label>
            <select
              value={tailorId}
              onChange={(e) => setTailorId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selectionner un couturier (optionnel)</option>
              {tailors.map((tailor) => (
                <option key={tailor.id} value={tailor.id}>
                  {tailor.name} ({tailor.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Order Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              Commande sur mesure (pour quelle commande)
            </label>
            <select
              value={customOrderId}
              onChange={(e) => setCustomOrderId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selectionner une commande (optionnel)</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Notes supplementaires..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/materials"
            className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving || !materialId || !quantity}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}
            Enregistrer la sortie
          </button>
        </div>
      </form>
    </div>
  )
}

export default function MaterialOutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    }>
      <MaterialOutForm />
    </Suspense>
  )
}
