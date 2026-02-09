'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  RefreshCw,
  Clock,
  Calendar,
  Check,
  X,
  Edit2,
  Save,
  Plus,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  breakBetween: number
  enabled: boolean
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Availability>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: 60,
    breakBetween: 15,
    enabled: true
  })

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/appointments/availability')
      if (res.ok) {
        const data = await res.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (slot: Availability) => {
    setEditingId(slot.id)
    setEditForm({ ...slot })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      setSaving(true)
      const res = await fetch('/api/admin/appointments/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm })
      })

      if (res.ok) {
        toast.success('Disponibilité mise à jour')
        setEditingId(null)
        setEditForm({})
        fetchAvailability()
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

  const handleToggleEnabled = async (slot: Availability) => {
    try {
      const res = await fetch('/api/admin/appointments/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slot.id, enabled: !slot.enabled })
      })

      if (res.ok) {
        toast.success(slot.enabled ? 'Jour désactivé' : 'Jour activé')
        fetchAvailability()
      }
    } catch (error) {
      console.error('Error toggling:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleAddSlot = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot)
      })

      if (res.ok) {
        toast.success('Disponibilité ajoutée')
        setShowAddForm(false)
        setNewSlot({
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '18:00',
          slotDuration: 60,
          breakBetween: 15,
          enabled: true
        })
        fetchAvailability()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error adding:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette disponibilité ?')) return

    try {
      const res = await fetch(`/api/admin/appointments/availability?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Disponibilité supprimée')
        fetchAvailability()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Sort by day of week (Monday first)
  const sortedAvailability = [...availability].sort((a, b) => {
    const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
    const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
    return orderA - orderB
  })

  // Get days not yet configured
  const configuredDays = availability.map(a => a.dayOfWeek)
  const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !configuredDays.includes(d))

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
              Disponibilités
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez vos horaires d'ouverture pour les rendez-vous
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAvailability}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          {availableDays.length > 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un jour
            </button>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ajouter une disponibilité
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jour
                </label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {availableDays.map(day => (
                    <option key={day} value={day}>{dayNames[day]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ouverture
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fermeture
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée créneau (min)
                  </label>
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={newSlot.slotDuration}
                    onChange={(e) => setNewSlot({ ...newSlot, slotDuration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={15}
                    step={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pause entre RDV (min)
                  </label>
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={newSlot.breakBetween}
                    onChange={(e) => setNewSlot({ ...newSlot, breakBetween: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={0}
                    step={5}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSlot}
                disabled={saving}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : sortedAvailability.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune disponibilité configurée</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Configurer les horaires
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Jour
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Horaires
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Durée créneau
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Pause entre RDV
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Statut
                </th>
                <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAvailability.map((slot) => (
                <tr
                  key={slot.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-500" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dayNames[slot.dayOfWeek]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={editForm.startTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={editForm.endTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={editForm.slotDuration || 60}
                        onChange={(e) => setEditForm({ ...editForm, slotDuration: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        min={15}
                        step={15}
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">{slot.slotDuration} min</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="number"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={editForm.breakBetween || 15}
                        onChange={(e) => setEditForm({ ...editForm, breakBetween: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        min={0}
                        step={5}
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">{slot.breakBetween} min</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleEnabled(slot)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        slot.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {slot.enabled ? (
                        <>
                          <Check className="w-3 h-3" />
                          Ouvert
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Fermé
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === slot.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Sauvegarder"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(slot)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && sortedAvailability.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Jours ouverts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedAvailability.filter(s => s.enabled).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Durée créneau moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(sortedAvailability.reduce((acc, s) => acc + s.slotDuration, 0) / sortedAvailability.length)} min
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Créneaux par semaine</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedAvailability.filter(s => s.enabled).reduce((acc, s) => {
                const [startH, startM] = s.startTime.split(':').map(Number)
                const [endH, endM] = s.endTime.split(':').map(Number)
                const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM)
                return acc + Math.floor(totalMinutes / (s.slotDuration + s.breakBetween))
              }, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Astuce :</strong> Cliquez sur le statut <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs"><Check className="w-3 h-3" />Ouvert</span> ou <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"><X className="w-3 h-3" />Fermé</span> pour activer/désactiver rapidement un jour.
        </p>
      </div>
    </div>
  )
}
