'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, FolderOpen, X, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  sortOrder: number
  materialsCount: number
  createdAt: string
}

export default function MaterialCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/materials/categories')
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

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
      setDescription(category.description || '')
    } else {
      setEditingCategory(null)
      setName('')
      setDescription('')
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setName('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      const url = editingCategory
        ? `/api/admin/materials/categories/${editingCategory.id}`
        : '/api/admin/materials/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(editingCategory ? 'Categorie mise a jour' : 'Categorie creee')
        closeModal()
        fetchCategories()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      toast.error('Impossible de supprimer une categorie par defaut')
      return
    }

    if (category.materialsCount > 0) {
      toast.error('Impossible de supprimer: cette categorie contient des materiels')
      return
    }

    if (!confirm(`Voulez-vous vraiment supprimer "${category.name}"?`)) {
      return
    }

    setDeletingId(category.id)
    try {
      const res = await fetch(`/api/admin/materials/categories/${category.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Categorie supprimee')
        fetchCategories()
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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/materials"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Categories de Materiels
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Organisez vos materiels par categories
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle categorie
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune categorie
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Commencez par creer des categories pour organiser vos materiels.
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Creer une categorie
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categorie
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Materiels
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-500/10 rounded-lg">
                        <FolderOpen className="h-5 w-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/materials?categoryId=${category.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Package className="h-3 w-3" />
                      {category.materialsCount}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {category.isDefault ? (
                      <span className="inline-flex px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        Par defaut
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded">
                        Personnalisee
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openModal(category)}
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors group"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                      </button>
                      {!category.isDefault && (
                        <button
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category.id || category.materialsCount > 0}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            category.materialsCount > 0
                              ? 'Contient des materiels'
                              : 'Supprimer'
                          }
                        >
                          {deletingId === category.id ? (
                            <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Modifier la categorie' : 'Nouvelle categorie'}
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
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Broderies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Description de la categorie..."
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
                  {editingCategory ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
