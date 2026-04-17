'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { Loader2, Sparkles, ChevronRight, Shirt } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
  style?: string
  collection?: string
  garmentType?: string
}

interface FashionCategory {
  name: string
  label: string
  slug: string
  color: string
}

const FASHION_CATEGORIES: FashionCategory[] = [
  { name: 'blouson-dame', label: 'BLOUSON DAME', slug: 'blouson-dame', color: 'from-primary-500 to-primary-700' },
  { name: 'chemisier-femme', label: 'CHEMISIER', slug: 'chemisier-femme', color: 'from-rose-400 to-rose-600' },
  { name: 'tunique', label: 'TUNIQUE HOMME', slug: 'tunique', color: 'from-amber-500 to-amber-700' },
  { name: 'veste-femme', label: 'VESTE FEMME', slug: 'veste-femme', color: 'from-violet-400 to-violet-600' },
  { name: 'robe-veste-mix-tissus-tisse', label: 'ROBE VESTE MIX', slug: 'robe-veste-mix-tissus-tisse', color: 'from-emerald-400 to-emerald-600' },
]

export function FashionCategoryTabs() {
  const [selectedCategory, setSelectedCategory] = useState(FASHION_CATEGORIES[0].name)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
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
    async function fetchProducts() {
      try {
        setLoading(true)
        const currentCategory = FASHION_CATEGORIES.find(c => c.name === selectedCategory)
        if (!currentCategory) return

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

  const currentCategoryData = FASHION_CATEGORIES.find(c => c.name === selectedCategory)

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-14 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Notre Selection
            </span>
            <Sparkles className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Elegance & Savoir-Faire
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Parcourez nos collections par categorie et trouvez la piece qui vous correspond
          </p>
        </div>

        {/* Category Tabs */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex flex-wrap justify-center bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1.5 gap-1 shadow-lg dark:shadow-none">
            {FASHION_CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`relative px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
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
                  <Shirt className="w-4 h-4" />
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
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
                      style: product.style || undefined,
                      collection: product.collection || undefined,
                      garmentType: product.garmentType || undefined,
                      mainCategorySlug: product.mainCategorySlug,
                      subCategorySlug: product.subCategorySlug,
                      featured: product.featured,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* View All Link */}
            <div className={`flex justify-center mt-12 transition-all duration-700 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <Link
                href={`/categorie/${currentCategoryData?.slug || ''}`}
                className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105"
              >
                Voir toute la collection
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Shirt className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Aucun article disponible dans cette categorie pour le moment.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
