'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  Search,
  Tag,
  FolderOpen,
  Eye
} from 'lucide-react'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  publishedAt: string | null
  readTime: number | null
  viewCount: number
  authorName: string | null
  category: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
  tags: {
    id: string
    name: string
    slug: string
    color: string | null
  }[]
}

interface BlogCategory {
  id: string
  name: string
  slug: string
  color: string | null
  _count: {
    posts: number
  }
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [searchTerm, selectedCategory, page])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories')
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
      params.append('page', page.toString())
      params.append('limit', '12')
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)

      const res = await fetch(`/api/blog/posts?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setPosts(data.posts)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#1a1d24]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-[#13151a] dark:to-[#1a1d24]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary-500" />
                <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
                  Blog
                </span>
                <BookOpen className="w-5 h-5 text-primary-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Actualités & Conseils
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Découvrez nos articles sur l'univers du vin, les accords mets-vins,
                les conseils de dégustation et bien plus encore.
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 border-b border-gray-200 dark:border-dark-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    setPage(1)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Tous
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.slug
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.name} ({cat._count.posts})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Aucun article trouvé
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || selectedCategory
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Les premiers articles arrivent bientôt !'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map(post => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group"
                    >
                      <article className="bg-white/80 dark:bg-dark-800/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:ring-2 hover:ring-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col shadow-sm dark:shadow-none">
                        {/* Image */}
                        <div className="relative h-56 overflow-hidden">
                          {post.image ? (
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
                              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 dark:from-dark-900/90 to-transparent" />

                          {/* Category badge */}
                          {post.category && (
                            <div className="absolute top-4 left-4">
                              <span
                                className="text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
                                style={{
                                  backgroundColor: post.category.color || '#8b5cf6'
                                }}
                              >
                                {post.category.name}
                              </span>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="absolute bottom-4 right-4 flex items-center gap-3 text-white/80 text-xs">
                            {post.readTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.readTime} min
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.viewCount}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                          <p className="text-gray-500 text-sm mb-2">
                            {formatDate(post.publishedAt)}
                            {post.authorName && (
                              <span> • Par {post.authorName}</span>
                            )}
                          </p>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-400 transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>

                          {/* Tags */}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {post.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-1 rounded text-xs"
                                  style={{
                                    backgroundColor: (tag.color || '#22c55e') + '20',
                                    color: tag.color || '#22c55e'
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Read more */}
                          <div className="flex items-center gap-2 mt-4 text-primary-500 font-semibold group-hover:text-primary-400 transition-colors">
                            Lire l'article
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border border-gray-200 dark:border-transparent"
                    >
                      Précédent
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            p === page
                              ? 'bg-primary-500 text-white'
                              : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-transparent'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border border-gray-200 dark:border-transparent"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
