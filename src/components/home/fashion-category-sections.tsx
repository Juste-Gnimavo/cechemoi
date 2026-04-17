'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { Loader2, ChevronRight, Scissors, Gem, Crown, Shirt, Sparkles } from 'lucide-react'

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

interface Section {
  title: string
  iconType: 'scissors' | 'gem' | 'crown' | 'shirt' | 'sparkles'
  categorySlug: string
  gradient: string
}

const SECTIONS: Section[] = [
  {
    title: 'Blouson Dame',
    iconType: 'gem',
    categorySlug: 'blouson-dame',
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    title: 'Chemisier Femme',
    iconType: 'sparkles',
    categorySlug: 'chemisier-femme',
    gradient: 'from-rose-400 to-rose-600',
  },
  {
    title: 'Tunique Homme',
    iconType: 'crown',
    categorySlug: 'tunique',
    gradient: 'from-amber-500 to-amber-700',
  },
  {
    title: 'Veste Femme',
    iconType: 'scissors',
    categorySlug: 'veste-femme',
    gradient: 'from-violet-400 to-violet-600',
  },
  {
    title: 'Robe Veste Mix Tissus',
    iconType: 'shirt',
    categorySlug: 'robe-veste-mix-tissus-tisse',
    gradient: 'from-emerald-400 to-emerald-600',
  },
]

function SectionIcon({ type }: { type: Section['iconType'] }) {
  const cls = 'w-6 h-6 text-white'
  switch (type) {
    case 'scissors':
      return <Scissors className={cls} />
    case 'gem':
      return <Gem className={cls} />
    case 'crown':
      return <Crown className={cls} />
    case 'shirt':
      return <Shirt className={cls} />
    case 'sparkles':
      return <Sparkles className={cls} />
  }
}

function CategorySection({
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
      className={`py-16 container mx-auto px-4 ${index > 0 ? 'border-t border-gray-200 dark:border-gray-700/50' : ''}`}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {section.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {products.length} article{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/categorie/${section.categorySlug}`}
          className="group flex items-center gap-2 text-primary-500 hover:text-primary-400 font-semibold transition-colors text-sm sm:text-base"
        >
          Voir tout
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Products Grid with staggered animation */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
    </div>
  )
}

export function FashionCategorySections() {
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

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  const hasAnyProducts = SECTIONS.some(
    (section) => (productsByCategory[section.categorySlug] || []).length > 0
  )

  if (!hasAnyProducts) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      {SECTIONS.map((section, index) => (
        <CategorySection
          key={section.categorySlug}
          section={section}
          products={productsByCategory[section.categorySlug] || []}
          index={index}
        />
      ))}
    </div>
  )
}
