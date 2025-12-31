'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, ArrowDownCircle, Package, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Material {
  id: string
  name: string
  unit: string
  unitPrice: number
  stock: number
  category: { name: string }
}

function MaterialInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMaterialId = searchParams.get('materialId')

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [materialId, setMaterialId] = useState(initialMaterialId || '')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  // Selected material info
  const selectedMaterial = materials.find((m) => m.id === materialId)

  useEffect(() => {
    fetchMaterials()
  }, [])

  useEffect(() => {
    // Auto-fill unit price when material is selected
    if (selectedMaterial && !unitPrice) {
      setUnitPrice(selectedMaterial.unitPrice.toString())
    }
  }, [materialId, selectedMaterial])

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/admin/materials?limit=1000')
      const data = await res.json()
      if (data.success) {
        setMaterials(data.materials)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
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

    setSaving(true)
    try {
      const res = await fetch('/api/admin/materials/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId,
          type: 'IN',
          quantity: qty,
          unitPrice: parseFloat(unitPrice) || selectedMaterial?.unitPrice || 0,
          reference: reference || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Entree enregistree avec succes')
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
            <ArrowDownCircle className="h-6 w-6 text-green-500" />
            Entree de Materiel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enregistrer une reception de materiel (achat, livraison)
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
            <div className="flex gap-2">
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selectionner un materiel</option>
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.category.name})
                  </option>
                ))}
              </select>
              <Link
                href="/admin/materials/new"
                className="flex items-center gap-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                title="Ajouter un nouveau materiel"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Selected Material Info */}
          {selectedMaterial && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {selectedMaterial.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedMaterial.category.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700 dark:text-green-300">Stock actuel</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {selectedMaterial.stock} {selectedMaterial.unit}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Quantite recue <span className="text-red-500">*</span>
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
                placeholder="Ex: 10"
              />
              {selectedMaterial && (
                <span className="px-3 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg">
                  {selectedMaterial.unit}
                </span>
              )}
            </div>
            {selectedMaterial && quantity && parseFloat(quantity) > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nouveau stock: {selectedMaterial.stock + parseFloat(quantity)} {selectedMaterial.unit}
              </p>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Prix unitaire d'achat (CFA)
            </label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Prix par unite"
            />
            {quantity && unitPrice && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cout total: {formatPrice(parseFloat(quantity) * parseFloat(unitPrice))}
              </p>
            )}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              N° Reference / Bon de commande (optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: BC-2024-001"
            />
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
              placeholder="Fournisseur, details de la livraison..."
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
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownCircle className="h-4 w-4" />
            )}
            Enregistrer l'entree
          </button>
        </div>
      </form>
    </div>
  )
}

export default function MaterialInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    }>
      <MaterialInForm />
    </Suspense>
  )
}
