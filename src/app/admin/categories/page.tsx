'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Loader2,
  Layers
} from 'lucide-react'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  parent: Category | null
  children: Category[]
  _count?: {
    products: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/categories?includeProducts=true')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        fetchCategories()
        setDeleteConfirm(null)
      } else {
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Get root categories (no parent)
  const rootCategories = categories.filter(cat => !cat.parentId)

  // Get filtered categories
  const filteredCategories = searchTerm
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rootCategories

  // Calculate stats
  const totalCategories = categories.length
  const rootCount = rootCategories.length
  const subCategories = categories.filter(cat => cat.parentId).length
  const totalProducts = categories.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)
  const emptyCategories = categories.filter(cat => (cat._count?.products || 0) === 0).length

  // Recursive render for tree view
  const renderCategoryTree = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-800 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors ${
            level > 0 ? 'ml-' + (level * 8) : ''
          }`}
          style={{ marginLeft: level > 0 ? `${level * 2}rem` : '0' }}
        >
          <div className="flex items-center space-x-4 flex-1">
            {/* Expand/Collapse button */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}

            {/* Category Image */}
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                width={40}
                height={40}
                className="rounded object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            )}

            {/* Category Info */}
            <div className="flex-1">
              <h3 className="text-gray-900 dark:text-white font-medium">{category.name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>/{ category.slug}</span>
                {category.parent && (
                  <span className="text-xs">
                    Parent: {category.parent.name}
                  </span>
                )}
              </div>
            </div>

            {/* Product Count */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-200 dark:bg-dark-700 rounded-full">
              <Package className="h-4 w-4 text-primary-500 dark:text-primary-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {category._count?.products || 0}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Link
                href={`/admin/categories/${category.id}/edit`}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                title="Modifier"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setDeleteConfirm(category.id)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {category.children.map(child => renderCategoryTree(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Catégories</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Organisez vos produits par catégories et sous-catégories
        </p>
      </div>

      {/* Stats Cards */}
      <AdminStatsHeader
        stats={[
          { label: 'Total', value: totalCategories, icon: FolderTree, color: 'primary' },
          { label: 'Racines', value: rootCount, icon: FolderTree, color: 'blue' },
          { label: 'Sous-categories', value: subCategories, icon: Layers, color: 'purple' },
          { label: 'Produits', value: totalProducts, icon: Package, color: 'green' },
          { label: 'Vides', value: emptyCategories, icon: AlertCircle, color: 'yellow' },
        ]}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Add Category Button */}
        <Link
          href="/admin/categories/new"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Catégorie</span>
        </Link>
      </div>

      {/* Categories List */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie. Créez-en une !'}
            </p>
          </div>
        ) : (
          <div>
            {filteredCategories.map(category => renderCategoryTree(category))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full shadow-xl shadow-black/10 dark:shadow-black/30">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
