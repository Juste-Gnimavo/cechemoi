'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Loader2, Package, Wine, ChevronRight } from 'lucide-react'

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
  isWine: boolean
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
  category: {
    id: string
    name: string
    slug: string
  } | null
}

interface CategoryGroup {
  id: string
  name: string
  slug: string
  products: Product[]
}

export default function CataloguePage() {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAllProducts() {
      try {
        setLoading(true)

        // Fetch all products
        const response = await fetch('/api/products?limit=100')
        const data = await response.json()

        if (data.success) {
          const products: Product[] = data.products || []

          // Group products by their primary category
          const groupedByCategory = products.reduce((acc: Record<string, CategoryGroup>, product) => {
            const categoryKey = product.category?.id || 'uncategorized'
            const categoryName = product.category?.name || 'Autres'
            const categorySlug = product.category?.slug || 'autres'

            if (!acc[categoryKey]) {
              acc[categoryKey] = {
                id: categoryKey,
                name: categoryName,
                slug: categorySlug,
                products: [],
              }
            }

            acc[categoryKey].products.push(product)
            return acc
          }, {})

          // Convert to array and sort by category name
          const sortedGroups = Object.values(groupedByCategory).sort((a, b) =>
            a.name.localeCompare(b.name)
          )

          setCategoryGroups(sortedGroups)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllProducts()
  }, [])

  // Count total products
  const totalProducts = categoryGroups.reduce((sum, group) => sum + group.products.length, 0)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#13151a]">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-gray-100 to-gray-50 dark:from-dark-800 dark:to-[#13151a] border-b border-gray-200 dark:border-dark-700">
          <div className="container mx-auto px-4 py-16">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-8 h-8 text-primary-500" />
              <h1 className="text-4xl md:text-5xl font-sans font-bold text-gray-900 dark:text-white">
                Notre Catalogue
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
              Explorez l'ensemble de nos produits : vins d'exception, accessoires, fromages et bien plus encore.
            </p>
            {!loading && (
              <p className="text-gray-500 mt-4">
                {totalProducts} produits dans {categoryGroups.length} catégories
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Chargement du catalogue...</p>
            </div>
          ) : categoryGroups.length > 0 ? (
            <div className="space-y-16">
              {categoryGroups.map((group) => (
                <section key={group.id}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Wine className="w-6 h-6 text-primary-500" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
                      <span className="text-gray-500 text-sm">
                        ({group.products.length} produit{group.products.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <Link
                      href={`/categorie-vin/${group.slug}`}
                      className="flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
                    >
                      Voir tout
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Products Grid - Show max 4 per category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {group.products.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
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
                    ))}
                  </div>

                  {/* Show more link if more than 4 products */}
                  {group.products.length > 4 && (
                    <div className="mt-6 text-center">
                      <Link
                        href={`/categorie-vin/${group.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-200 dark:bg-dark-800 hover:bg-gray-300 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors"
                      >
                        Voir les {group.products.length - 4} autres produits
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Catalogue vide
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aucun produit disponible pour le moment. Revenez bientôt !
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
