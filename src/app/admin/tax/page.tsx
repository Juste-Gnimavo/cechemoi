'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Percent, Tag, Plus, Edit, Trash2, Globe } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TaxRate {
  id: string
  country: string
  state: string | null
  rate: number
  name: string
  enabled: boolean
  isDefault: boolean
  applyToShipping: boolean
  priority: number
}

interface TaxClass {
  id: string
  name: string
  description: string | null
  rate: number | null
  enabled: boolean
  _count: {
    products: number
  }
}

export default function TaxManagementPage() {
  const [rates, setRates] = useState<TaxRate[]>([])
  const [classes, setClasses] = useState<TaxClass[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rates' | 'classes'>('rates')

  // Form states
  const [showRateForm, setShowRateForm] = useState(false)
  const [showClassForm, setShowClassForm] = useState(false)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
  const [editingClass, setEditingClass] = useState<TaxClass | null>(null)

  const [rateForm, setRateForm] = useState({
    country: '',
    state: '',
    rate: 18,
    name: 'TVA',
    enabled: true,
    isDefault: false,
    applyToShipping: false,
    priority: 1,
  })

  const [classForm, setClassForm] = useState({
    name: '',
    description: '',
    rate: null as number | null,
    enabled: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ratesRes, classesRes] = await Promise.all([
        fetch('/api/admin/tax/rates'),
        fetch('/api/admin/tax/classes'),
      ])

      const ratesData = await ratesRes.json()
      const classesData = await classesRes.json()

      if (ratesData.success) setRates(ratesData.rates)
      if (classesData.success) setClasses(classesData.classes)
    } catch (error) {
      console.error('Error fetching tax data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRate = async () => {
    try {
      const url = editingRate
        ? `/api/admin/tax/rates/${editingRate.id}`
        : '/api/admin/tax/rates'
      const method = editingRate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateForm),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingRate ? 'Taux mis à jour' : 'Taux créé')
        setShowRateForm(false)
        setEditingRate(null)
        resetRateForm()
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Supprimer ce taux de taxe ?')) return

    try {
      const response = await fetch(`/api/admin/tax/rates/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Taux supprimé')
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSaveClass = async () => {
    try {
      const url = editingClass
        ? `/api/admin/tax/classes/${editingClass.id}`
        : '/api/admin/tax/classes'
      const method = editingClass ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingClass ? 'Classe mise à jour' : 'Classe créée')
        setShowClassForm(false)
        setEditingClass(null)
        resetClassForm()
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Supprimer cette classe de taxe ?')) return

    try {
      const response = await fetch(`/api/admin/tax/classes/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Classe supprimée')
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const resetRateForm = () => {
    setRateForm({
      country: '',
      state: '',
      rate: 18,
      name: 'TVA',
      enabled: true,
      isDefault: false,
      applyToShipping: false,
      priority: 1,
    })
  }

  const resetClassForm = () => {
    setClassForm({
      name: '',
      description: '',
      rate: null,
      enabled: true,
    })
  }

  const editRate = (rate: TaxRate) => {
    setEditingRate(rate)
    setRateForm({
      country: rate.country,
      state: rate.state || '',
      rate: rate.rate,
      name: rate.name,
      enabled: rate.enabled,
      isDefault: rate.isDefault,
      applyToShipping: rate.applyToShipping,
      priority: rate.priority,
    })
    setShowRateForm(true)
  }

  const editClass = (taxClass: TaxClass) => {
    setEditingClass(taxClass)
    setClassForm({
      name: taxClass.name,
      description: taxClass.description || '',
      rate: taxClass.rate,
      enabled: taxClass.enabled,
    })
    setShowClassForm(true)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Taxes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configuration des taux de TVA et classes fiscales
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'rates') {
              setEditingRate(null)
              resetRateForm()
              setShowRateForm(true)
            } else {
              setEditingClass(null)
              resetClassForm()
              setShowClassForm(true)
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'rates' ? 'Nouveau Taux' : 'Nouvelle Classe'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-800">
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rates'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Taux de Taxes
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'classes'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Classes Fiscales
        </button>
      </div>

      {/* Tax Rates Tab */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {rate.name} - {rate.country}
                      {rate.state && ` (${rate.state})`}
                    </h3>
                    {rate.isDefault && (
                      <span className="px-2 py-1 bg-primary-500/10 text-primary-500 text-xs rounded">
                        Par défaut
                      </span>
                    )}
                    {!rate.enabled && (
                      <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {rate.rate}% TVA
                    </span>
                    <span>Priorité: {rate.priority}</span>
                    {rate.applyToShipping && (
                      <span className="text-yellow-500">Appliqué à la livraison</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => editRate(rate)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  {!rate.isDefault && (
                    <button
                      onClick={() => handleDeleteRate(rate.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax Classes Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {classes.map((taxClass) => (
            <div
              key={taxClass.id}
              className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{taxClass.name}</h3>
                    {!taxClass.enabled && (
                      <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded">
                        Désactivée
                      </span>
                    )}
                  </div>
                  {taxClass.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{taxClass.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {taxClass.rate !== null ? `${taxClass.rate}%` : 'Taux par défaut'}
                    </span>
                    <span>{taxClass._count.products} produits</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => editClass(taxClass)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(taxClass.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rate Form Modal */}
      {showRateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 backdrop-blur-sm rounded-lg p-6 max-w-lg w-full border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingRate ? 'Modifier le Taux' : 'Nouveau Taux de Taxe'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Pays *</label>
                <input
                  type="text"
                  value={rateForm.country}
                  onChange={(e) => setRateForm({ ...rateForm, country: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
                <input
                  type="text"
                  value={rateForm.name}
                  onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Taux (%) *</label>
                <input
                  type="number"
                  value={rateForm.rate}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, rate: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyToShipping"
                  checked={rateForm.applyToShipping}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, applyToShipping: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="applyToShipping" className="text-sm text-gray-700 dark:text-gray-300">
                  Appliquer à la livraison
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={rateForm.isDefault}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, isDefault: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                  Taux par défaut
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={rateForm.enabled}
                  onChange={(e) => setRateForm({ ...rateForm, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">
                  Activé
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRateForm(false)
                  setEditingRate(null)
                  resetRateForm()
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRate}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Form Modal */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 backdrop-blur-sm rounded-lg p-6 max-w-lg w-full border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingClass ? 'Modifier la Classe' : 'Nouvelle Classe Fiscale'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={classForm.description}
                  onChange={(e) =>
                    setClassForm({ ...classForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Taux personnalisé (%) (optionnel)
                </label>
                <input
                  type="number"
                  value={classForm.rate || ''}
                  onChange={(e) =>
                    setClassForm({
                      ...classForm,
                      rate: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="Laisser vide pour utiliser le taux par défaut"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="classEnabled"
                  checked={classForm.enabled}
                  onChange={(e) => setClassForm({ ...classForm, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="classEnabled" className="text-sm text-gray-700 dark:text-gray-300">
                  Activée
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClassForm(false)
                  setEditingClass(null)
                  resetClassForm()
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveClass}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
