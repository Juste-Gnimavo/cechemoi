'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Zap,
  Droplets,
  Users,
  Car,
  Phone,
  Tv,
  Sparkles,
  Home,
  FileText,
  MoreHorizontal,
  DollarSign,
  Package,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ExpenseCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  isDefault: boolean
  sortOrder: number
  _count?: {
    expenses: number
  }
}

const ICONS: { [key: string]: any } = {
  Zap,
  Droplets,
  Users,
  Car,
  Phone,
  Tv,
  Sparkles,
  Home,
  FileText,
  MoreHorizontal,
  DollarSign,
  Package,
}

const COLORS = [
  { value: '#f59e0b', label: 'Ambre' },
  { value: '#3b82f6', label: 'Bleu' },
  { value: '#10b981', label: 'Vert' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#f97316', label: 'Orange' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#64748b', label: 'Gris' },
]

const ICON_OPTIONS = [
  { value: 'Zap', label: 'Électricité' },
  { value: 'Droplets', label: 'Eau' },
  { value: 'Users', label: 'Personnes' },
  { value: 'Car', label: 'Transport' },
  { value: 'Phone', label: 'Téléphone' },
  { value: 'Tv', label: 'TV' },
  { value: 'Sparkles', label: 'Nettoyage' },
  { value: 'Home', label: 'Maison' },
  { value: 'FileText', label: 'Document' },
  { value: 'DollarSign', label: 'Argent' },
  { value: 'Package', label: 'Paquet' },
  { value: 'MoreHorizontal', label: 'Autre' },
]

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('MoreHorizontal')
  const [color, setColor] = useState('#64748b')
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/expenses/categories')
      const data = await res.json()

      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setIcon('MoreHorizontal')
    setColor('#64748b')
    setSortOrder(categories.length + 1)
    setShowModal(true)
  }

  const openEditModal = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description || '')
    setIcon(category.icon || 'MoreHorizontal')
    setColor(category.color || '#64748b')
    setSortOrder(category.sortOrder)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      const url = editingCategory
        ? `/api/admin/expenses/categories/${editingCategory.id}`
        : '/api/admin/expenses/categories'

      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          icon,
          color,
          sortOrder,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingCategory ? 'Catégorie modifiée' : 'Catégorie créée')
        closeModal()
        fetchCategories()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: ExpenseCategory) => {
    if (category._count && category._count.expenses > 0) {
      toast.error(`Impossible de supprimer: ${category._count.expenses} dépense(s) liée(s)`)
      return
    }

    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/expenses/categories/${category.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Catégorie supprimée')
        fetchCategories()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getIcon = (iconName: string | null) => {
    const Icon = ICONS[iconName || 'MoreHorizontal'] || MoreHorizontal
    return Icon
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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/expenses"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Catégories de Dépenses
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérer les catégories pour organiser vos dépenses
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucune catégorie. Cliquez sur "Nouvelle catégorie" pour commencer.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {categories.map((category) => {
              const Icon = getIcon(category.icon)
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: category.color || '#64748b' }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        {category.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded">
                            Par défaut
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {category.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {category._count?.expenses || 0} dépense(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      disabled={category._count && category._count.expenses > 0}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Transport"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Description de la catégorie"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Icône
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Couleur
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c.value
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Preview */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Aperçu
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                  {(() => {
                    const PreviewIcon = ICONS[icon] || MoreHorizontal
                    return (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <PreviewIcon className="h-5 w-5" style={{ color }} />
                      </div>
                    )
                  })()}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {name || 'Nom de la catégorie'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCategory ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
