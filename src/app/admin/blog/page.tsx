'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  FolderOpen,
  Tag,
  Plus,
  TrendingUp,
  Eye,
  Calendar,
  Loader2
} from 'lucide-react'

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalCategories: number
  totalTags: number
  totalViews: number
}

export default function BlogDashboardPage() {
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch posts
      const postsRes = await fetch('/api/admin/blog/posts?limit=5')
      const postsData = await postsRes.json()

      // Fetch categories
      const categoriesRes = await fetch('/api/admin/blog/categories?includePostCount=true')
      const categoriesData = await categoriesRes.json()

      // Fetch tags
      const tagsRes = await fetch('/api/admin/blog/tags?includePostCount=true')
      const tagsData = await tagsRes.json()

      if (postsData.success) {
        setRecentPosts(postsData.posts)

        // Calculate stats
        const totalPosts = postsData.pagination?.total || postsData.posts.length
        const publishedPosts = postsData.posts.filter((p: any) => p.published).length
        const totalViews = postsData.posts.reduce((sum: number, p: any) => sum + (p.viewCount || 0), 0)

        setStats({
          totalPosts,
          publishedPosts,
          draftPosts: totalPosts - publishedPosts,
          totalCategories: categoriesData.success ? categoriesData.categories.length : 0,
          totalTags: tagsData.success ? tagsData.tags.length : 0,
          totalViews
        })
      }
    } catch (error) {
      console.error('Error fetching blog data:', error)
    } finally {
      setLoading(false)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos articles, catégories et tags
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Articles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.totalPosts || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.publishedPosts || 0} publiés, {stats?.draftPosts || 0} brouillons
              </p>
            </div>
            <FileText className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Catégories</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.totalCategories || 0}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tags</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.totalTags || 0}</p>
            </div>
            <Tag className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Vues totales</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.totalViews || 0}</p>
            </div>
            <Eye className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/blog/posts"
          className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 hover:border-primary-500 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold">Articles</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Gérer tous les articles</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/blog/categories"
          className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 hover:border-blue-500 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <FolderOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold">Catégories</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Organiser par catégories</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/blog/tags"
          className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 hover:border-green-500 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <Tag className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold">Tags</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Gérer les tags</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Posts */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Articles récents</h2>
          <Link
            href="/admin/blog/posts"
            className="text-primary-500 hover:text-primary-400 text-sm"
          >
            Voir tout
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun article pour le moment</p>
            <Link
              href="/admin/blog/posts/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Créer un article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {recentPosts.map(post => (
              <Link
                key={post.id}
                href={`/admin/blog/posts/${post.id}/edit`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white font-medium truncate">{post.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {post.category && (
                      <span className="text-primary-400">{post.category.name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.viewCount || 0}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-1 rounded text-xs ${
                  post.published
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {post.published ? 'Publié' : 'Brouillon'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
