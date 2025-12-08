'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BlogTag {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  _count?: {
    posts: number
  }
}

export default function BlogTagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/blog/tags?includePostCount=true')
      const data = await res.json()
      if (data.success) {
        setTags(data.tags)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Erreur lors du chargement des tags')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/blog/tags/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Tag supprimé')
        setTags(tags.filter(t => t.id !== id))
        setDeleteConfirm(null)
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const filteredTags = searchTerm
    ? tags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tags

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags du blog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les tags pour organiser vos articles
          </p>
        </div>
        <Link
          href="/admin/blog/tags/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          Nouveau tag
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <Tag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? 'Aucun tag trouvé' : 'Aucun tag créé'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/blog/tags/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Créer un tag
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map(tag => (
            <div
              key={tag.id}
              className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-dark-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: (tag.color || '#22c55e') + '20' }}
                  >
                    <Tag
                      className="h-5 w-5"
                      style={{ color: tag.color || '#22c55e' }}
                    />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-medium">{tag.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">/{tag.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/blog/tags/${tag.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(tag.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {tag.description && (
                <p className="text-gray-500 text-sm mt-3 line-clamp-2">
                  {tag.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {tag._count?.posts || 0} article{(tag._count?.posts || 0) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer ce tag ? Il sera retiré de tous les articles associés.
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
