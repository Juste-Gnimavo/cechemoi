'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, ArrowUpCircle, Package, User, FileText, AlertTriangle, Plus, Trash2, Calendar, Scissors, Sparkles } from 'lucide-react'
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

interface MaterialRow {
  id: string
  materialId: string
  quantity: string
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

  // Form state - multiple materials
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([
    { id: crypto.randomUUID(), materialId: initialMaterialId || '', quantity: '' }
  ])
  const [movementDate, setMovementDate] = useState('')
  const [tailorId, setTailorId] = useState('')
  const [customOrderId, setCustomOrderId] = useState(initialOrderId || '')
  const [notes, setNotes] = useState('')

  // Get selected materials for each row
  const getSelectedMaterial = (materialId: string) => materials.find((m) => m.id === materialId)

  // Get already selected material IDs (for filtering dropdowns)
  const getSelectedMaterialIds = (excludeRowId: string) => {
    return materialRows
      .filter(row => row.id !== excludeRowId && row.materialId)
      .map(row => row.materialId)
  }

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

  // Add a new material row
  const addMaterialRow = () => {
    setMaterialRows([...materialRows, { id: crypto.randomUUID(), materialId: '', quantity: '' }])
  }

  // Remove a material row
  const removeMaterialRow = (rowId: string) => {
    if (materialRows.length > 1) {
      setMaterialRows(materialRows.filter(row => row.id !== rowId))
    }
  }

  // Update a material row
  const updateMaterialRow = (rowId: string, field: 'materialId' | 'quantity', value: string) => {
    setMaterialRows(materialRows.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    ))
  }

  // Validate all rows
  const validateRows = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Check at least one row has material and quantity
    const validRows = materialRows.filter(row => row.materialId && row.quantity && parseFloat(row.quantity) > 0)
    if (validRows.length === 0) {
      errors.push('Au moins un matériel avec une quantité est requis')
    }

    // Check for duplicates
    const materialIds = materialRows.filter(r => r.materialId).map(r => r.materialId)
    const uniqueIds = new Set(materialIds)
    if (materialIds.length !== uniqueIds.size) {
      errors.push('Chaque matériel ne peut être ajouté qu\'une seule fois')
    }

    // Check stock for each row
    materialRows.forEach((row, index) => {
      if (row.materialId && row.quantity) {
        const qty = parseFloat(row.quantity)
        const material = getSelectedMaterial(row.materialId)
        if (material && qty > material.stock) {
          errors.push(`Matériel #${index + 1} (${material.name}): Stock insuffisant`)
        }
        if (qty <= 0) {
          errors.push(`Matériel #${index + 1}: La quantité doit être positive`)
        }
      }
    })

    return { valid: errors.length === 0, errors }
  }

  // Calculate total cost
  const calculateTotalCost = () => {
    return materialRows.reduce((total, row) => {
      if (row.materialId && row.quantity) {
        const material = getSelectedMaterial(row.materialId)
        if (material) {
          return total + (parseFloat(row.quantity) * material.unitPrice)
        }
      }
      return total
    }, 0)
  }

  // Get summary items
  const getSummaryItems = () => {
    return materialRows
      .filter(row => row.materialId && row.quantity && parseFloat(row.quantity) > 0)
      .map(row => {
        const material = getSelectedMaterial(row.materialId)!
        const qty = parseFloat(row.quantity)
        return {
          name: material.name,
          quantity: qty,
          unit: material.unit,
          cost: qty * material.unitPrice
        }
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { valid, errors } = validateRows()
    if (!valid) {
      errors.forEach(error => toast.error(error))
      return
    }

    setSaving(true)
    const validRows = materialRows.filter(row => row.materialId && row.quantity && parseFloat(row.quantity) > 0)
    let successCount = 0
    const failedMaterials: string[] = []

    try {
      for (const row of validRows) {
        const material = getSelectedMaterial(row.materialId)
        const res = await fetch('/api/admin/materials/movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId: row.materialId,
            type: 'OUT',
            quantity: parseFloat(row.quantity),
            tailorId: tailorId || null,
            customOrderId: customOrderId || null,
            notes: notes || null,
            ...(movementDate && { createdAt: movementDate }),
          }),
        })
        const data = await res.json()

        if (data.success) {
          successCount++
        } else {
          failedMaterials.push(material?.name || 'Inconnu')
        }
      }

      if (failedMaterials.length === 0) {
        toast.success(`${successCount} sortie(s) enregistrée(s) avec succès`)
        router.push('/admin/materials')
      } else {
        toast.error(`Échec pour: ${failedMaterials.join(', ')}`)
        if (successCount > 0) {
          toast.success(`${successCount} sortie(s) réussie(s)`)
        }
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

  const summaryItems = getSummaryItems()
  const totalCost = calculateTotalCost()
  const hasValidRows = materialRows.some(row => row.materialId && row.quantity && parseFloat(row.quantity) > 0)
  const hasStockWarning = materialRows.some(row => {
    if (row.materialId && row.quantity) {
      const material = getSelectedMaterial(row.materialId)
      return material && parseFloat(row.quantity) > material.stock
    }
    return false
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            Sortie de Matériel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enregistrer une ou plusieurs sorties de matériel
          </p>
        </div>
      </div>

      {/* Intro Card */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Scissors className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Sortie multi-matériels
            </h2>
            <p className="text-orange-100 mt-1 text-sm">
              Pour confectionner une tenue, ajoutez tous les matériels nécessaires en un seul enregistrement :
              tissu, fil, boutons, fermeture éclair, dentelle, doublure...
            </p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Action irréversible
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            La sortie de stock est irréversible et ne peut pas être modifiée par la suite.
            Veuillez vérifier soigneusement les quantités avant de valider.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6">

          {/* Materials Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                <Package className="h-4 w-4 inline mr-1" />
                Matériels <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addMaterialRow}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Plus className="h-5 w-5" />
                Ajouter un matériel
              </button>
            </div>

            <div className="space-y-4">
              {materialRows.map((row, index) => {
                const selectedMaterial = getSelectedMaterial(row.materialId)
                const selectedIds = getSelectedMaterialIds(row.id)
                const availableMaterials = materials.filter(m => !selectedIds.includes(m.id))
                const hasQuantityWarning = selectedMaterial && row.quantity && parseFloat(row.quantity) > selectedMaterial.stock

                return (
                  <div key={row.id} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Matériel #{index + 1}
                      </span>
                      {materialRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMaterialRow(row.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      {/* Material Dropdown */}
                      <div className="col-span-8">
                        <select
                          value={row.materialId}
                          onChange={(e) => updateMaterialRow(row.id, 'materialId', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Sélectionner un matériel</option>
                          {availableMaterials.map((mat) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name} ({mat.category.name}) - Stock: {mat.stock} {mat.unit}
                            </option>
                          ))}
                          {/* Include selected material if already chosen */}
                          {row.materialId && !availableMaterials.find(m => m.id === row.materialId) && selectedMaterial && (
                            <option value={row.materialId}>
                              {selectedMaterial.name} ({selectedMaterial.category.name}) - Stock: {selectedMaterial.stock} {selectedMaterial.unit}
                            </option>
                          )}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => updateMaterialRow(row.id, 'quantity', e.target.value)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            min="0.01"
                            step="0.01"
                            placeholder="Qté"
                            className={`flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-900 border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              hasQuantityWarning
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-200 dark:border-dark-700'
                            }`}
                          />
                          {selectedMaterial && (
                            <span className="px-2 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm whitespace-nowrap">
                              {selectedMaterial.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selected Material Info Card */}
                    {selectedMaterial && (
                      <div className={`rounded-lg p-3 ${
                        hasQuantityWarning
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-medium ${hasQuantityWarning ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}`}>
                              <Package className="h-4 w-4 inline mr-1" />
                              {selectedMaterial.name}
                            </p>
                            <p className={`text-sm ${hasQuantityWarning ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
                              {selectedMaterial.category.name} • Prix: {formatPrice(selectedMaterial.unitPrice)}/{selectedMaterial.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm ${hasQuantityWarning ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
                              Stock: {selectedMaterial.stock}{selectedMaterial.unit}
                            </p>
                            {row.quantity && parseFloat(row.quantity) > 0 && (
                              <p className={`text-sm font-medium ${hasQuantityWarning ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}`}>
                                Coût: {formatPrice(parseFloat(row.quantity) * selectedMaterial.unitPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                        {hasQuantityWarning && (
                          <div className="mt-2 flex items-center gap-1 text-red-700 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Stock insuffisant!</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Movement Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date du mouvement (optionnel)
            </label>
            <input
              type="datetime-local"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Laissez vide pour utiliser la date et l'heure actuelles
            </p>
          </div>

          {/* Tailor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Couturier (qui a demandé)
            </label>
            <select
              value={tailorId}
              onChange={(e) => setTailorId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner un couturier (optionnel)</option>
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
              <option value="">Sélectionner une commande (optionnel)</option>
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
              placeholder="Notes supplémentaires..."
            />
          </div>
        </div>

        {/* Summary */}
        {summaryItems.length > 0 && (
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Récapitulatif
            </h3>
            <div className="space-y-2">
              {summaryItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(item.cost)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-dark-600 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {formatPrice(totalCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
            disabled={saving || !hasValidRows || hasStockWarning}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}
            Enregistrer les sorties
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
