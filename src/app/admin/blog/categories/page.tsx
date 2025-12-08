'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  color: string | null
  _count?: {
    posts: number
  }
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/blog/categories?includePostCount=true')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erreur lors du chargement des catégories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/blog/categories/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Catégorie supprimée')
        setCategories(categories.filter(c => c.id !== id))
        setDeleteConfirm(null)
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const filteredCategories = searchTerm
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categories

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories du blog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organisez vos articles par catégories
          </p>
        </div>
        <Link
          href="/admin/blog/categories/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          Nouvelle catégorie
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie créée'}
            </p>
            {!searchTerm && (
              <Link
                href="/admin/blog/categories/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Créer une catégorie
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {filteredCategories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color || '#3b82f6' + '20' }}
                    >
                      <FolderOpen
                        className="h-6 w-6"
                        style={{ color: category.color || '#3b82f6' }}
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-gray-900 dark:text-white font-medium">{category.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>/{category.slug}</span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {category._count?.posts || 0} articles
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/blog/categories/${category.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(category.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
