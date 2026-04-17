'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface SubCategory {
  id: string
  name: string
  slug: string
  image: string | null
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function FashionSubcategories() {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories?includeChildren=true&published=true')
        const data = await res.json()
        if (data.success && data.data?.categories) {
          // Collect all subcategories that have an image
          const allSubs: SubCategory[] = []
          for (const root of data.data.categories) {
            if (root.children) {
              for (const child of root.children) {
                if (child.image) {
                  allSubs.push({
                    id: child.id,
                    name: child.name,
                    slug: child.slug,
                    image: child.image,
                  })
                }
              }
            }
          }
          // Shuffle and take 8
          setSubcategories(shuffleArray(allSubs).slice(0, 8))
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading || subcategories.length === 0) return null

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
            Explorer
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            Nos Collections
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl mx-auto">
            Découvrez notre sélection de catégories pour trouver la tenue parfaite
          </p>
        </div>

        {/* Grid: 2 rows of 4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {subcategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categorie/${cat.slug}`}
              className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-gray-100 dark:bg-dark-800"
            >
              {/* Image */}
              <Image
                src={cat.image!}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-2">
                  {cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase()}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-primary-300 font-medium group-hover:text-primary-200 transition-colors">
                  Découvrir
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm"
          >
            Voir toutes les collections
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
