'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, FolderOpen } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
}

export function FashionCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories?includeProductCount=true')
        const data = await res.json()
        if (data.success) {
          setCategories(data.data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Nos Collections
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
              Explorez nos catégories
            </h2>
          </div>
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
            Nos Collections
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            Explorez nos catégories
          </h2>
        </div>

        {/* Categories Grid - up to 4 columns on desktop */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${categories.length >= 4 ? 'lg:grid-cols-4' : categories.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/categorie/${category.slug}`}
              className="group relative h-[400px] md:h-[450px] rounded-2xl overflow-hidden"
            >
              {/* Image */}
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-700/40 flex items-center justify-center">
                  <FolderOpen className="w-16 h-16 text-primary-300/50" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors duration-200">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-white/70 text-sm">
                    {category.description}
                  </p>
                )}
                <div className="mt-4 inline-flex items-center text-primary-400 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Découvrir
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
