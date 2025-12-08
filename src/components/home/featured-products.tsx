'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { Loader2, Wine, Sparkles, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  wineType: string | null
  region: string | null
  vintage: string | null
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
}

type WineCategory = 'ROUGE' | 'BLANC' | 'ROSÉ' | 'EFFERVESCENT'

// Fixed wine categories with their database slugs
const WINE_CATEGORIES: { name: WineCategory; label: string; slug: string; color: string }[] = [
  { name: 'ROUGE', label: 'ROUGE', slug: 'vin-rouge', color: 'from-red-500 to-red-700' },
  { name: 'BLANC', label: 'BLANC', slug: 'vin-blanc', color: 'from-amber-300 to-amber-500' },
  { name: 'ROSÉ', label: 'ROSÉ', slug: 'vin-rose', color: 'from-pink-400 to-pink-600' },
  { name: 'EFFERVESCENT', label: 'EFFERVESCENT', slug: 'vin-effervescent', color: 'from-yellow-300 to-yellow-500' },
]

export function FeaturedProducts() {
  const [selectedCategory, setSelectedCategory] = useState<WineCategory>('ROUGE')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Intersection Observer for scroll animation
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
    async function fetchProducts() {
      try {
        setLoading(true)
        const currentCategory = WINE_CATEGORIES.find(c => c.name === selectedCategory)

        if (!currentCategory) return

        // Fetch products by category slug (includes both primary and additional categories)
        const response = await fetch(`/api/products?categorySlug=${currentCategory.slug}&limit=4`)
        const data = await response.json()

        if (data.success) {
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory])

  const currentCategoryData = WINE_CATEGORIES.find(c => c.name === selectedCategory)

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1a1d24] dark:to-[#13151a] relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header with animation */}
        <div className={`text-center mb-14 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Notre Sélection
            </span>
            <Sparkles className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-gray-900 dark:text-white mb-4">
            Éclatants, Robustes & Raffinés
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Découvrez notre collection soigneusement sélectionnée de vins exceptionnels
          </p>
        </div>

        {/* Category Tabs with enhanced styling */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex bg-white/80 dark:bg-dark-800/50 backdrop-blur-sm rounded-full p-1.5 gap-1 shadow-lg dark:shadow-none">
            {WINE_CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.name
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {selectedCategory === category.name && (
                  <span
                    className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-full transition-all duration-300`}
                    style={{ opacity: 0.9 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Wine className="w-4 h-4" />
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid with staggered animation */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement des vins...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`transition-all duration-700 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <ProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      salePrice: product.salePrice,
                      image: product.images[0] || '/placeholder.png',
                      wineType: product.wineType || undefined,
                      region: product.region || undefined,
                      vintage: product.vintage || undefined,
                      mainCategorySlug: product.mainCategorySlug,
                      subCategorySlug: product.subCategorySlug,
                      featured: product.featured,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* View All Link with enhanced styling */}
            <div className={`flex justify-center mt-12 transition-all duration-700 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <Link
                href="/vins"
                className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105"
              >
                Voir toute la collection
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Wine className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Aucun vin disponible dans cette catégorie pour le moment.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Revenez bientôt pour découvrir notre nouvelle sélection !
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
