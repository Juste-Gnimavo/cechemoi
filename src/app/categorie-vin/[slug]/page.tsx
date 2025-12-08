'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Loader2 } from 'lucide-react'

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
  stock: number
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategoryAndProducts() {
      try {
        setLoading(true)

        // Fetch category details and products in parallel
        const [categoryResponse, productsResponse] = await Promise.all([
          fetch(`/api/categories?slug=${slug}`),
          // Use categorySlug to fetch products from both primary AND additional categories
          fetch(`/api/products?categorySlug=${slug}&limit=50`),
        ])

        const categoryData = await categoryResponse.json()
        const productsData = await productsResponse.json()

        if (!categoryData.success || !categoryData.data.categories?.[0]) {
          setError('Catégorie non trouvée')
          return
        }

        setCategory(categoryData.data.categories[0])

        if (productsData.success) {
          setProducts(productsData.products || [])
        }
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Erreur lors du chargement de la catégorie')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCategoryAndProducts()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Catégorie non trouvée'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              La catégorie que vous recherchez n'existe pas.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1">
        {/* Category Header */}
        <div className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-transparent">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-sans font-bold text-gray-900 dark:text-white mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl">
                {category.description}
              </p>
            )}
            <p className="text-gray-500 mt-4">
              {products.length} {products.length === 1 ? 'produit' : 'produits'}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-12">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
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
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Aucun produit disponible dans cette catégorie pour le moment.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
