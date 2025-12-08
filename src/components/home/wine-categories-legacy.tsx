'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

// Hardcoded wine categories (the 4 we want to display)
const WINE_CATEGORY_SLUGS = ['vin-rouge', 'vin-blanc', 'vin-rose', 'vin-effervescent']

interface CategoryData {
  slug: string
  name: string
  image: string | null
  productCount: number
}

export function WineCategories() {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function fetchCategoryData() {
      try {
        setLoading(true)

        // Fetch all categories to get images
        const categoriesResponse = await fetch('/api/categories?includeProductCount=true')
        const categoriesData = await categoriesResponse.json()

        if (!categoriesData.success) {
          throw new Error('Failed to fetch categories')
        }

        // Filter to only our hardcoded categories
        const allCategories = categoriesData.data.categories || []
        const filteredCategories = WINE_CATEGORY_SLUGS.map((slug) => {
          const found = allCategories.find((cat: any) => cat.slug === slug)
          return found || { slug, name: slug, image: null }
        })

        // Fetch product counts for each category (includes junction table)
        const withProductCounts = await Promise.all(
          filteredCategories.map(async (cat: any) => {
            try {
              const productsResponse = await fetch(`/api/products?categorySlug=${cat.slug}&limit=1`)
              const productsData = await productsResponse.json()
              const productCount = productsData.success ? (productsData.pagination?.totalCount || 0) : 0

              return {
                slug: cat.slug,
                name: cat.name,
                image: cat.image,
                productCount,
              }
            } catch {
              return {
                slug: cat.slug,
                name: cat.name,
                image: cat.image,
                productCount: 0,
              }
            }
          })
        )

        setCategories(withProductCounts)
      } catch (error) {
        console.error('Failed to fetch category data:', error)
        // Set fallback data on error
        setCategories(
          WINE_CATEGORY_SLUGS.map((slug) => ({
            slug,
            name: slug.replace('vin-', 'Vin ').replace('-', ' '),
            image: null,
            productCount: 0,
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [mounted])

  // Don't render until mounted (prevents hydration issues)
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <section className="py-0 bg-gray-100 dark:bg-[#1a1d24]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative h-[calc(100vh-4rem)] bg-gray-300 dark:bg-dark-700 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="py-0 bg-gray-100 dark:bg-[#1a1d24]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categorie-vin/${category.slug}`}
            className="group relative h-[calc(100vh-6rem)] overflow-hidden"
          >
            {/* Background Image */}
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-300 dark:bg-dark-700" />
            )}

            {/* Dark Overlay - Plus léger */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Category Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-14">
              <h3 className="text-4xl font-sans font-bold text-white mb-1 group-hover:text-copper-500 transition-colors duration-300">
                {category.name}
              </h3>
              <p className="text-gray-300 text-lg">
                {category.productCount} {category.productCount === 1 ? 'vin' : 'vins'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
