'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { Loader2, Crown, Wine, Sparkles, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  region: string | null
  vintage: string | null
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
}

interface Section {
  title: string
  iconType: 'crown' | 'wine' | 'sparkles'
  categorySlug: string
  gradient: string
}

// Use the actual category slugs from the database
const SECTIONS: Section[] = [
  {
    title: 'Grands Vins',
    iconType: 'crown',
    categorySlug: 'grands-vins',
    gradient: 'from-amber-500 to-amber-700',
  },
  {
    title: 'Vins Rosés',
    iconType: 'wine',
    categorySlug: 'vin-rose',
    gradient: 'from-pink-400 to-pink-600',
  },
  {
    title: 'Vins Blancs',
    iconType: 'sparkles',
    categorySlug: 'vin-blanc',
    gradient: 'from-yellow-300 to-amber-400',
  },
]

function SectionIcon({ type }: { type: Section['iconType'] }) {
  switch (type) {
    case 'crown':
      return <Crown className="w-6 h-6" />
    case 'wine':
      return <Wine className="w-6 h-6" />
    case 'sparkles':
      return <Sparkles className="w-6 h-6" />
  }
}

function WineSection({
  section,
  products,
  index,
}: {
  section: Section
  products: Product[]
  index: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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

  if (products.length === 0) {
    return null
  }

  return (
    <div
      ref={sectionRef}
      className={`py-16 container mx-auto px-4 ${index > 0 ? 'border-t border-gray-200 dark:border-dark-800/50' : ''}`}
    >
      {/* Section Header */}
      <div className={`flex items-center justify-between mb-10 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${section.gradient} shadow-lg`}>
            <SectionIcon type={section.iconType} />
          </div>
          <div>
            <h2 className="text-3xl font-sans font-bold text-gray-900 dark:text-white">
              {section.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {products.length} vins disponibles
            </p>
          </div>
        </div>
        <Link
          href={`/vins/${section.categorySlug}`}
          className="group flex items-center gap-2 text-primary-500 hover:text-primary-400 font-semibold transition-colors"
        >
          Voir tout
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Products Grid with staggered animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, productIndex) => (
          <div
            key={product.id}
            className={`transition-all duration-700 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${200 + productIndex * 100}ms` }}
          >
            <ProductCard
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                salePrice: product.salePrice,
                image: product.images[0] || '/placeholder.png',
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
    </div>
  )
}

export function WineTypesSections() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function fetchAllProducts() {
      try {
        setLoading(true)

        // Fetch products for all categories in parallel
        const results = await Promise.all(
          SECTIONS.map(async (section) => {
            const response = await fetch(`/api/products?categorySlug=${section.categorySlug}&limit=4`)
            const data = await response.json()
            return {
              categorySlug: section.categorySlug,
              products: data.success ? (data.products || []) : [],
            }
          })
        )

        // Convert to a map
        const productsMap: Record<string, Product[]> = {}
        results.forEach((result) => {
          productsMap[result.categorySlug] = result.products
        })

        setProductsByCategory(productsMap)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllProducts()
  }, [mounted])

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1a1d24] dark:to-[#13151a] py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // Check if we have any products at all
  const hasAnyProducts = SECTIONS.some(
    (section) => (productsByCategory[section.categorySlug] || []).length > 0
  )

  if (!hasAnyProducts) {
    return null
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1a1d24] dark:to-[#13151a]">
      {SECTIONS.map((section, index) => (
        <WineSection
          key={section.categorySlug}
          section={section}
          products={productsByCategory[section.categorySlug] || []}
          index={index}
        />
      ))}
    </div>
  )
}
