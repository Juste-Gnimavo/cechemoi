'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Plus,
  Scissors,
  Phone,
  Mail,
  Calendar,
  Package,
  User,
  Trash2,
  X,
  Pencil,
  Box,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MaterialUsage {
  id: string
  totalCost: number
  quantity: number
  createdAt: string
  material: { name: string; unit: string }
}

interface Tailor {
  id: string
  name: string
  phone: string
  email?: string
  createdAt: string
  activeItems: number
  totalAssigned: number
  currentWork: any[]
  materialTotalCost: number
  materialUsageCount: number
  recentMaterialUsages: MaterialUsage[]
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(price) + ' CFA'
}

export default function TailorsPage() {
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTailor, setEditingTailor] = useState<Tailor | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetchTailors()
  }, [])

  const fetchTailors = async () => {
    try {
      const res = await fetch('/api/admin/tailors')
      const data = await res.json()
      if (data.success) {
        setTailors(data.tailors)
      }
    } catch (error) {
      console.error('Error fetching tailors:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (tailor?: Tailor) => {
    if (tailor) {
      setEditingTailor(tailor)
      setName(tailor.name)
      setPhone(tailor.phone)
      setEmail(tailor.email || '')
    } else {
      setEditingTailor(null)
      setName('')
      setPhone('')
      setEmail('')
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTailor(null)
    setName('')
    setPhone('')
    setEmail('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone) {
      toast.error('Nom et téléphone requis')
      return
    }

    setSaving(true)
    try {
      const url = editingTailor
        ? `/api/admin/tailors/${editingTailor.id}`
        : '/api/admin/tailors'
      const method = editingTailor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || null }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(editingTailor ? 'Couturier mis à jour' : 'Couturier ajouté')
        closeModal()
        fetchTailors()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tailor: Tailor) => {
    if (!confirm(`Voulez-vous vraiment supprimer ${tailor.name}?`)) {
      return
    }

    setDeletingId(tailor.id)
    try {
      const res = await fetch(`/api/admin/tailors/${tailor.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Couturier supprimé')
        fetchTailors()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Couturiers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestion des couturiers de l'atelier
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un couturier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Scissors className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total couturiers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tailors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Articles en cours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tailors.reduce((sum, t) => sum + t.activeItems, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <User className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Couturiers actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tailors.filter((t) => t.activeItems > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tailors List */}
      {tailors.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun couturier
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Commencez par ajouter vos couturiers pour leur assigner des commandes.
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un couturier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tailors.map((tailor) => (
            <div
              key={tailor.id}
              className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
                    <Scissors className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tailor.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {tailor.phone}
                    </p>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(tailor)}
                    className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(tailor)}
                    disabled={deletingId === tailor.id}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deletingId === tailor.id ? (
                      <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                    )}
                  </button>
                </div>
              </div>

              {tailor.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3">
                  <Mail className="h-3 w-3" />
                  {tailor.email}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-primary-500">{tailor.activeItems}</span> en cours
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">{tailor.totalAssigned}</span> total
                  </span>
                </div>
                <Link
                  href={`/admin/production?tailorId=${tailor.id}`}
                  className="text-sm text-primary-500 hover:text-primary-400"
                >
                  Voir travaux
                </Link>
              </div>

              {/* Current work preview */}
              {tailor.currentWork && tailor.currentWork.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Travaux en cours:</p>
                  <div className="space-y-1">
                    {tailor.currentWork.map((work) => (
                      <div key={work.id} className="text-xs flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{work.garmentType}</span>
                        <span className="text-gray-500">{work.customOrder?.orderNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Material usage section */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    Materiels utilises
                  </p>
                  <Link
                    href={`/admin/materials/movements?tailorId=${tailor.id}`}
                    className="text-xs text-primary-500 hover:text-primary-400"
                  >
                    Voir historique
                  </Link>
                </div>
                {tailor.materialUsageCount > 0 ? (
                  <>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Total: <span className="font-medium text-gray-900 dark:text-white">{formatPrice(tailor.materialTotalCost)}</span>
                      </span>
                    </div>
                    {tailor.recentMaterialUsages && tailor.recentMaterialUsages.length > 0 && (
                      <div className="space-y-1">
                        {tailor.recentMaterialUsages.map((usage) => (
                          <div key={usage.id} className="text-xs flex items-center justify-between">
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                              {usage.material.name}
                            </span>
                            <span className="text-gray-500">
                              {usage.quantity} {usage.material.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune sortie materiel</p>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ajoute le {new Date(tailor.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTailor ? 'Modifier le couturier' : 'Ajouter un couturier'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Jean Kouassi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+225 07 XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="jean@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTailor ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
