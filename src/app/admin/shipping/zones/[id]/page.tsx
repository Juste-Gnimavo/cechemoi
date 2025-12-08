'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Common countries for shipping
const COMMON_COUNTRIES = [
  "Côte d'Ivoire",
  'Sénégal',
  'Mali',
  'Burkina Faso',
  'Niger',
  'Bénin',
  'Togo',
  'Ghana',
  'Guinée',
  'France',
  'Belgique',
  'Suisse',
  'Canada',
  'États-Unis',
]

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  enabled: boolean
  isDefault: boolean
}

export default function EditShippingZonePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [zone, setZone] = useState<ShippingZone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    countries: [] as string[],
    enabled: true,
    isDefault: false,
  })
  const [customCountry, setCustomCountry] = useState('')

  useEffect(() => {
    fetchZone()
  }, [params.id])

  const fetchZone = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/shipping/zones/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setZone(data.zone)
        setFormData({
          name: data.zone.name,
          countries: data.zone.countries,
          enabled: data.zone.enabled,
          isDefault: data.zone.isDefault,
        })
      } else {
        toast.error('Zone non trouvée')
        router.push('/admin/shipping')
      }
    } catch (error) {
      console.error('Error fetching zone:', error)
      toast.error('Erreur lors du chargement de la zone')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCountry = (country: string) => {
    if (!formData.countries.includes(country)) {
      setFormData({
        ...formData,
        countries: [...formData.countries, country],
      })
    }
  }

  const handleRemoveCountry = (country: string) => {
    setFormData({
      ...formData,
      countries: formData.countries.filter((c) => c !== country),
    })
  }

  const handleAddCustomCountry = () => {
    if (customCountry.trim() && !formData.countries.includes(customCountry.trim())) {
      handleAddCountry(customCountry.trim())
      setCustomCountry('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Le nom de la zone est requis')
      return
    }

    if (formData.countries.length === 0) {
      toast.error('Veuillez sélectionner au moins un pays')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/shipping/zones/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Zone mise à jour avec succès')
        router.push('/admin/shipping')
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating zone:', error)
      toast.error('Erreur lors de la mise à jour de la zone')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier la Zone de Livraison</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{zone?.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations de la Zone
          </h2>

          <div className="space-y-4">
            {/* Zone Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de la zone *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Côte d'Ivoire, Afrique de l'Ouest, Europe"
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Countries Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pays couverts *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {COMMON_COUNTRIES.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleAddCountry(country)}
                    disabled={formData.countries.includes(country)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      formData.countries.includes(country)
                        ? 'bg-primary-500/20 text-primary-500 dark:text-primary-400 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>

              {/* Custom Country Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomCountry()
                    }
                  }}
                  placeholder="Ajouter un autre pays..."
                  className="flex-1 bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCountry}
                  className="px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Selected Countries */}
              {formData.countries.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Pays sélectionnés ({formData.countries.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.countries.map((country) => (
                      <div
                        key={country}
                        className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 text-primary-500 dark:text-primary-400 rounded-lg"
                      >
                        <span className="text-sm">{country}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCountry(country)}
                          className="hover:text-primary-400 dark:hover:text-primary-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-dark-800 border-gray-300 dark:border-dark-700 rounded focus:ring-primary-500"
              />
              <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">
                Zone activée
              </label>
            </div>

            {/* Default Zone */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-dark-800 border-gray-300 dark:border-dark-700 rounded focus:ring-primary-500"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                Définir comme zone par défaut
              </label>
              <span className="text-xs text-gray-500">
                (utilisée si le pays du client n&apos;est pas trouvé)
              </span>
            </div>
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
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
