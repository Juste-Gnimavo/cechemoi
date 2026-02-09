'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  isDefault: boolean
}

interface WeightRange {
  min: number
  max: number | null
  cost: number
}

interface PriceRange {
  min: number
  max: number | null
  cost: number
}

export default function NewShippingMethodPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [formData, setFormData] = useState({
    zoneId: '',
    name: '',
    description: '',
    enabled: true,
    costType: 'flat_rate',
    cost: 0,
    minOrderAmount: undefined as number | undefined,
    estimatedDays: '',
    taxable: false,
  })
  const [weightRanges, setWeightRanges] = useState<WeightRange[]>([
    { min: 0, max: 5, cost: 0 },
  ])
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([
    { min: 0, max: 50000, cost: 0 },
  ])

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/shipping/zones')
      const data = await response.json()

      if (data.success) {
        setZones(data.zones)
        // Auto-select default zone
        const defaultZone = data.zones.find((z: ShippingZone) => z.isDefault)
        if (defaultZone) {
          setFormData((prev) => ({ ...prev, zoneId: defaultZone.id }))
        }
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
      toast.error('Erreur lors du chargement des zones')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeightRange = () => {
    const lastRange = weightRanges[weightRanges.length - 1]
    setWeightRanges([
      ...weightRanges,
      {
        min: lastRange.max ? lastRange.max : 0,
        max: null,
        cost: 0,
      },
    ])
  }

  const handleRemoveWeightRange = (index: number) => {
    if (weightRanges.length > 1) {
      setWeightRanges(weightRanges.filter((_, i) => i !== index))
    }
  }

  const handleUpdateWeightRange = (
    index: number,
    field: keyof WeightRange,
    value: number | null
  ) => {
    const updated = [...weightRanges]
    updated[index] = { ...updated[index], [field]: value }
    setWeightRanges(updated)
  }

  const handleAddPriceRange = () => {
    const lastRange = priceRanges[priceRanges.length - 1]
    setPriceRanges([
      ...priceRanges,
      {
        min: lastRange.max ? lastRange.max : 0,
        max: null,
        cost: 0,
      },
    ])
  }

  const handleRemovePriceRange = (index: number) => {
    if (priceRanges.length > 1) {
      setPriceRanges(priceRanges.filter((_, i) => i !== index))
    }
  }

  const handleUpdatePriceRange = (
    index: number,
    field: keyof PriceRange,
    value: number | null
  ) => {
    const updated = [...priceRanges]
    updated[index] = { ...updated[index], [field]: value }
    setPriceRanges(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.zoneId) {
      toast.error('Veuillez sélectionner une zone')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Le nom de la méthode est requis')
      return
    }

    try {
      setSaving(true)

      const payload: any = {
        ...formData,
      }

      // Add ranges based on cost type
      if (formData.costType === 'weight_based') {
        payload.weightRanges = weightRanges
      } else if (formData.costType === 'price_based') {
        payload.priceRanges = priceRanges
      }

      const response = await fetch('/api/admin/shipping/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Méthode de livraison créée avec succès')
        router.push('/admin/shipping')
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating method:', error)
      toast.error('Erreur lors de la création de la méthode')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/shipping"
          className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouvelle Méthode de Livraison
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Créer une nouvelle méthode de livraison
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations de Base
          </h2>

          <div className="space-y-4">
            {/* Zone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zone de livraison *
              </label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Sélectionner une zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} {zone.isDefault && '(Par défaut)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Method Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de la méthode *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Livraison Standard, Livraison Express"
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la méthode de livraison..."
                rows={3}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Estimated Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Délai de livraison estimé
              </label>
              <input
                type="text"
                value={formData.estimatedDays}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedDays: e.target.value })
                }
                placeholder="Ex: 2-3 jours, 24h, 1 semaine"
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-dark-800 border-gray-300 dark:border-dark-700 rounded focus:ring-primary-500"
              />
              <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">
                Méthode activée
              </label>
            </div>

            {/* Taxable */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="taxable"
                checked={formData.taxable}
                onChange={(e) => setFormData({ ...formData, taxable: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-dark-800 border-gray-300 dark:border-dark-700 rounded focus:ring-primary-500"
              />
              <label htmlFor="taxable" className="text-sm text-gray-700 dark:text-gray-300">
                Les frais de livraison sont taxables
              </label>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarification</h2>

          <div className="space-y-4">
            {/* Cost Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de tarification *
              </label>
              <select
                value={formData.costType}
                onChange={(e) => setFormData({ ...formData, costType: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="flat_rate">Tarif fixe</option>
                <option value="free">Gratuit</option>
                <option value="variable">Variable (ex: Yango) - Le client paie à la livraison</option>
                <option value="weight_based">Basé sur le poids</option>
                <option value="price_based">Basé sur le prix de la commande</option>
              </select>
            </div>

            {/* Variable shipping notice */}
            {formData.costType === 'variable' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  <strong>Frais variables:</strong> Les frais de livraison ne sont pas inclus dans le montant affiché. Ils seront déterminés par le transporteur (ex: Yango)
                  en fonction de votre zone de livraison. Vous paierez les frais de livraison séparément au livreur.
                </p>
              </div>
            )}

            {/* Flat Rate Cost */}
            {(formData.costType === 'flat_rate' || formData.costType === 'free') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coût (CFA)
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="100"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Min Order Amount for Free Shipping */}
            {formData.costType === 'flat_rate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant minimum pour livraison gratuite (optionnel)
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={formData.minOrderAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderAmount: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  min="0"
                  step="1000"
                  placeholder="Ex: 50000"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide si pas de livraison gratuite conditionnelle
                </p>
              </div>
            )}

            {/* Weight-based Ranges */}
            {formData.costType === 'weight_based' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tranches de poids (kg)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddWeightRange}
                    className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une tranche
                  </button>
                </div>

                <div className="space-y-2">
                  {weightRanges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={range.min}
                        onChange={(e) =>
                          handleUpdateWeightRange(
                            index,
                            'min',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.5"
                        placeholder="Min (kg)"
                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-500 dark:text-gray-400">à</span>
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={range.max || ''}
                        onChange={(e) =>
                          handleUpdateWeightRange(
                            index,
                            'max',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        min={range.min}
                        step="0.5"
                        placeholder="Max (kg) ou vide"
                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-500 dark:text-gray-400">=</span>
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={range.cost}
                        onChange={(e) =>
                          handleUpdateWeightRange(
                            index,
                            'cost',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="100"
                        placeholder="Coût (CFA)"
                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {weightRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWeightRange(index)}
                          className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-dark-800 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price-based Ranges */}
            {formData.costType === 'price_based' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tranches de prix (CFA)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPriceRange}
                    className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une tranche
                  </button>
                </div>

                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={range.min}
                        onChange={(e) =>
                          handleUpdatePriceRange(
                            index,
                            'min',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="1000"
                        placeholder="Min (CFA)"
                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-500 dark:text-gray-400">à</span>
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={range.max || ''}
                        onChange={(e) =>
                          handleUpdatePriceRange(
                            index,
                            'max',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        min={range.min}
                        step="1000"
                        placeholder="Max (CFA) ou vide"
                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-500 dark:text-gray-400">=</span>
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={range.cost}
                        onChange={(e) =>
                          handleUpdatePriceRange(
                            index,
                            'cost',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="100"
                        placeholder="Coût (CFA)"
                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {priceRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePriceRange(index)}
                          className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-dark-800 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/shipping"
            className="px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Création...' : 'Créer la Méthode'}
          </button>
        </div>
      </form>
    </div>
  )
}
