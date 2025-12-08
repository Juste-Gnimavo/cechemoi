'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  Calendar,
  AlertCircle,
  Loader2,
  Star,
  Filter
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  published: boolean
  featured: boolean
  publishedAt: string | null
  viewCount: number
  readTime: number | null
  category: {
    id: string
    name: string
    color: string | null
  } | null
  tags: {
    id: string
    name: string
    color: string | null
  }[]
  createdAt: string
}

interface BlogCategory {
  id: string
  name: string
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    published: '',
    featured: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [filters])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/blog/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.published) params.append('published', filters.published)
      if (filters.featured) params.append('featured', filters.featured)

      const res = await fetch(`/api/admin/blog/posts?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Erreur lors du chargement des articles')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Article supprimé')
        setPosts(posts.filter(p => p.id !== id))
        setDeleteConfirm(null)
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Articles du blog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos articles de blog
          </p>
        </div>
        <Link
          href="/admin/blog/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          Nouvel article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filters.published}
            onChange={(e) => setFilters({ ...filters, published: e.target.value })}
            className="bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous statuts</option>
            <option value="true">Publiés</option>
            <option value="false">Brouillons</option>
          </select>

          <select
            value={filters.featured}
            onChange={(e) => setFilters({ ...filters, featured: e.target.value })}
            className="bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous</option>
            <option value="true">En vedette</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filters.search || filters.categoryId || filters.published || filters.featured
                ? 'Aucun article trouvé'
                : 'Aucun article créé'}
            </p>
            {!filters.search && !filters.categoryId && !filters.published && !filters.featured && (
              <Link
                href="/admin/blog/posts/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Créer un article
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {posts.map(post => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                {/* Image */}
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-900 dark:text-white font-medium truncate">{post.title}</h3>
                    {post.featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-sm">
                    {post.category && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: (post.category.color || '#3b82f6') + '20',
                          color: post.category.color || '#3b82f6'
                        }}
                      >
                        {post.category.name}
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.viewCount}
                    </span>
                    {post.readTime && (
                      <span className="text-gray-500 dark:text-gray-400">{post.readTime} min</span>
                    )}
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: (tag.color || '#22c55e') + '20',
                            color: tag.color || '#22c55e'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-gray-500 text-xs">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status */}
                <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                  post.published
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {post.published ? 'Publié' : 'Brouillon'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/blog/posts/${post.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(post.id)}
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
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
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
