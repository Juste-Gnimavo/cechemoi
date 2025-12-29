'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  RefreshCw,
  Sparkles,
  User,
  ShoppingBag,
  Briefcase,
  Check,
  X,
  Edit2,
  Save,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ConsultationType {
  id: string
  name: string
  slug: string
  description: string
  price: number
  duration: number
  features: string[]
  color: string
  icon: string
  enabled: boolean
  requiresPayment: boolean
  sortOrder: number
}

const iconOptions = [
  { value: 'sparkles', label: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'user', label: 'User', icon: <User className="w-4 h-4" /> },
  { value: 'shopping-bag', label: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
  { value: 'briefcase', label: 'Briefcase', icon: <Briefcase className="w-4 h-4" /> }
]

const colorOptions = [
  '#8b5cf6', '#f97316', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'
]

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
  'shopping-bag': <ShoppingBag className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />
}

export default function ServicesPage() {
  const [services, setServices] = useState<ConsultationType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ConsultationType>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    features: [''],
    color: '#8b5cf6',
    icon: 'sparkles',
    enabled: true,
    requiresPayment: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/appointments/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service: ConsultationType) => {
    setEditingId(service.id)
    setEditForm({ ...service })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      setSaving(true)
      const res = await fetch('/api/admin/appointments/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm })
      })

      if (res.ok) {
        toast.success('Service mis à jour')
        setEditingId(null)
        setEditForm({})
        fetchServices()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEnabled = async (service: ConsultationType) => {
    try {
      const res = await fetch('/api/admin/appointments/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, enabled: !service.enabled })
      })

      if (res.ok) {
        toast.success(service.enabled ? 'Service désactivé' : 'Service activé')
        fetchServices()
      }
    } catch (error) {
      console.error('Error toggling:', error)
      toast.error('Erreur lors de la mise a jour')
    }
  }

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/appointments/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newService,
          features: newService.features.filter(f => f.trim())
        })
      })

      if (res.ok) {
        toast.success('Service ajouté')
        setShowAddModal(false)
        setNewService({
          name: '',
          description: '',
          price: 0,
          duration: 60,
          features: [''],
          color: '#8b5cf6',
          icon: 'sparkles',
          enabled: true,
          requiresPayment: true
        })
        fetchServices()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error adding:', error)
      toast.error('Erreur lors de la creation')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return

    try {
      const res = await fetch(`/api/admin/appointments/services?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Service supprimé')
        fetchServices()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Sur devis'
    return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA'
  }

  const addFeature = () => {
    setNewService({ ...newService, features: [...newService.features, ''] })
  }

  const updateFeature = (index: number, value: string) => {
    const features = [...newService.features]
    features[index] = value
    setNewService({ ...newService, features })
  }

  const removeFeature = (index: number) => {
    const features = newService.features.filter((_, i) => i !== index)
    setNewService({ ...newService, features: features.length ? features : [''] })
  }

  const addEditFeature = () => {
    setEditForm({ ...editForm, features: [...(editForm.features || []), ''] })
  }

  const updateEditFeature = (index: number, value: string) => {
    const features = [...(editForm.features || [])]
    features[index] = value
    setEditForm({ ...editForm, features })
  }

  const removeEditFeature = (index: number) => {
    const features = (editForm.features || []).filter((_, i) => i !== index)
    setEditForm({ ...editForm, features: features.length ? features : [''] })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/appointments"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Types de consultation
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez les services proposés aux clients
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchServices}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau service
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Nouveau service
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du service *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Analyse Morphologique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Description du service..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={0}
                    step={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Sur devis</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée (min)
                  </label>
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={15}
                    step={15}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icone
                  </label>
                  <div className="flex gap-2">
                    {iconOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewService({ ...newService, icon: opt.value })}
                        className={`p-2 rounded-lg border transition-colors ${
                          newService.icon === opt.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={opt.label}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Couleur
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewService({ ...newService, color })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          newService.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caractéristiques
                </label>
                {newService.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Ex: Analyse complete"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  + Ajouter une caractéristique
                </button>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newService.requiresPayment}
                    onChange={(e) => setNewService({ ...newService, requiresPayment: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Paiement requis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newService.enabled}
                    onChange={(e) => setNewService({ ...newService, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Actif</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddService}
                disabled={saving}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Modifier le service
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du service *
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editForm.price || 0}
                    onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={0}
                    step={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Sur devis</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée (min)
                  </label>
                  <input
                    type="number"
                    value={editForm.duration || 60}
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={15}
                    step={15}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icone
                  </label>
                  <div className="flex gap-2">
                    {iconOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, icon: opt.value })}
                        className={`p-2 rounded-lg border transition-colors ${
                          editForm.icon === opt.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={opt.label}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Couleur
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, color })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          editForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caractéristiques
                </label>
                {(editForm.features || []).map((feature, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateEditFeature(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeEditFeature(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditFeature}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  + Ajouter une caractéristique
                </button>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.requiresPayment ?? true}
                    onChange={(e) => setEditForm({ ...editForm, requiresPayment: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Paiement requis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.enabled ?? true}
                    onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Actif</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun service configuré</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
                !service.enabled ? 'opacity-60' : ''
              }`}
            >
              {/* Header with color */}
              <div
                className="h-2"
                style={{ backgroundColor: service.color }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: service.color }}
                    >
                      {iconMap[service.icon] || <Sparkles className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {service.duration} min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleEnabled(service)}
                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      service.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {service.enabled ? 'Actif' : 'Inactif'}
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="line-clamp-1">{feature}</span>
                    </div>
                  ))}
                  {service.features.length > 3 && (
                    <p className="text-xs text-gray-500">+{service.features.length - 3} autres</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(service.price)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {service.requiresPayment ? 'Paiement requis' : 'Sur devis'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && services.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total services</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {services.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Services actifs</p>
            <p className="text-2xl font-bold text-green-600">
              {services.filter(s => s.enabled).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Prix moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(Math.round(services.filter(s => s.price > 0).reduce((acc, s) => acc + s.price, 0) / services.filter(s => s.price > 0).length) || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Durée moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length)} min
            </p>
          </div>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Astuce :</strong> Cliquez sur le badge <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">Actif</span> pour activer/désactiver rapidement un service sans le supprimer.
        </p>
      </div>
    </div>
  )
}
