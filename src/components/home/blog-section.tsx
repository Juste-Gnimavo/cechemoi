'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, BookOpen, Clock, ArrowRight, Loader2 } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  publishedAt: string | null
  readTime: number | null
  category: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
}

// Fallback data when no posts exist
const fallbackPosts = [
  {
    id: '1',
    title: 'Comment Bien Choisir son Vin Rouge',
    slug: 'comment-bien-choisir-son-vin-rouge',
    excerpt: 'Découvrez les critères essentiels pour sélectionner le vin rouge parfait pour chaque occasion.',
    image: '/images/vin-rouge.png',
    publishedAt: new Date().toISOString(),
    readTime: 5,
    category: { id: '1', name: 'Conseils', slug: 'conseils', color: '#ef4444' }
  },
  {
    id: '2',
    title: 'Les Accords Mets-Vins Parfaits',
    slug: 'les-accords-mets-vins-parfaits',
    excerpt: 'Apprenez à associer vos plats préférés avec les meilleurs vins pour sublimer vos repas.',
    image: '/images/ROU-CARILL-0691.png',
    publishedAt: new Date().toISOString(),
    readTime: 7,
    category: { id: '2', name: 'Astuces', slug: 'astuces', color: '#f97316' }
  },
  {
    id: '3',
    title: 'Les Meilleurs Vins pour Célébrer',
    slug: 'les-meilleurs-vins-pour-celebrer',
    excerpt: 'Notre sélection des champagnes et vins effervescents idéaux pour vos moments festifs.',
    image: '/images/vin-effervescent.jpg',
    publishedAt: new Date().toISOString(),
    readTime: 4,
    category: { id: '3', name: 'Découvertes', slug: 'decouvertes', color: '#eab308' }
  },
  {
    id: '4',
    title: 'Conservation du Vin: Guide Complet',
    slug: 'conservation-du-vin-guide-complet',
    excerpt: 'Tous nos conseils pour conserver vos bouteilles dans les meilleures conditions.',
    image: '/images/vin-blanc.png',
    publishedAt: new Date().toISOString(),
    readTime: 6,
    category: { id: '2', name: 'Astuces', slug: 'astuces', color: '#f97316' }
  },
]

export function BlogSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blog/posts?limit=4')
      const data = await res.json()

      if (data.success && data.posts.length > 0) {
        setPosts(data.posts)
      } else {
        // Use fallback data if no posts
        setPosts(fallbackPosts)
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      // Use fallback data on error
      setPosts(fallbackPosts)
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
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-[#13151a] dark:to-[#1a1d24] relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-14 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary-500" />
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Blog & Actualités
            </span>
            <BookOpen className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-gray-900 dark:text-white mb-4">
            Découvertes, Conseils & Astuces
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explorez nos articles pour approfondir vos connaissances œnologiques
          </p>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={`group block transition-all duration-700 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                <article className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:ring-2 hover:ring-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col shadow-sm dark:shadow-none">
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-dark-800 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 dark:from-dark-900/80 to-transparent" />

                    {/* Category badge */}
                    {post.category && (
                      <div className="absolute top-4 left-4">
                        <span
                          className="text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
                          style={{
                            background: `linear-gradient(to right, ${post.category.color || '#8b5cf6'}, ${post.category.color || '#8b5cf6'}cc)`
                          }}
                        >
                          {post.category.name}
                        </span>
                      </div>
                    )}

                    {/* Read time */}
                    {post.readTime && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/80 text-xs">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-gray-500 text-sm mb-2">
                      {formatDate(post.publishedAt)}
                    </p>
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Read more link */}
                    <div className="flex items-center gap-2 mt-4 text-primary-500 text-sm font-semibold group-hover:text-primary-400 transition-colors">
                      Lire l&apos;article
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* View all button */}
        <div className={`text-center mt-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} style={{ transitionDelay: '700ms' }}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white/80 dark:bg-dark-800/50 hover:bg-gray-100 dark:hover:bg-dark-700/50 backdrop-blur-sm text-gray-900 dark:text-white font-semibold rounded-full border border-gray-200 dark:border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-primary-500" />
            Voir tous les articles
          </Link>
        </div>
      </div>
    </section>
  )
}
