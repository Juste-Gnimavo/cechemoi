'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Save, Package, History } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
}

const UNITS = [
  { value: 'metre', label: 'Mètre (m)' },
  { value: 'cm', label: 'Centimètre (cm)' },
  { value: 'piece', label: 'Pièce' },
  { value: 'bobine', label: 'Bobine' },
  { value: 'rouleau', label: 'Rouleau' },
  { value: 'kg', label: 'Kilogramme (kg)' },
  { value: 'g', label: 'Gramme (g)' },
  { value: 'paquet', label: 'Paquet' },
  { value: 'boite', label: 'Boîte' },
]

export default function EditMaterialPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('metre')
  const [unitPrice, setUnitPrice] = useState('')
  const [stock, setStock] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState('')
  const [supplier, setSupplier] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [catRes, matRes] = await Promise.all([
        fetch('/api/admin/materials/categories'),
        fetch(`/api/admin/materials/${id}`),
      ])

      const catData = await catRes.json()
      const matData = await matRes.json()

      if (catData.success) {
        setCategories(catData.categories)
      }

      if (matData.success) {
        const m = matData.material
        setName(m.name)
        setSku(m.sku || '')
        setCategoryId(m.categoryId)
        setUnit(m.unit)
        setUnitPrice(m.unitPrice.toString())
        setStock(m.stock)
        setLowStockThreshold(m.lowStockThreshold ? m.lowStockThreshold.toString() : '')
        setSupplier(m.supplier || '')
        setColor(m.color || '')
        setDescription(m.description || '')
      } else {
        toast.error('Matériel non trouvé')
        router.push('/admin/materials')
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

    if (!name || !categoryId || !unit) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku: sku || null,
          categoryId,
          unit,
          unitPrice: parseFloat(unitPrice) || 0,
          lowStockThreshold: parseFloat(lowStockThreshold) || 0,
          supplier: supplier || null,
          color: color || null,
          description: description || null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Matériel mis à jour')
        router.push('/admin/materials')
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/materials"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier Matériel</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{name}</p>
          </div>
        </div>
        <Link
          href={`/admin/materials/movements?materialId=${id}`}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
        >
          <History className="h-4 w-4" />
          Historique
        </Link>
      </div>

      {/* Current Stock Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Stock actuel</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {stock} {unit}
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
          Pour modifier le stock, utilisez les fonctions d'entrée/sortie
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Nom du matériel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                SKU (optionnel)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Unité <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Prix unitaire (CFA)
              </label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Seuil d'alerte stock bas
            </label>
            <input
              type="number"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Laisser vide pour désactiver l'alerte"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Fournisseur (optionnel)
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Couleur (optionnel)
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
