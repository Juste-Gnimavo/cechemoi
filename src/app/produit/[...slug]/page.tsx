'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { ProductDetails } from '@/components/product-details'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  longDescription: string | null
  price: number
  salePrice: number | null
  sku: string
  stock: number
  images: string[]
  wineType: string | null
  vintage: string | null
  region: string | null
  country: string | null
  grapeVariety: string | null
  alcoholContent: number | null
  volume: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
}

/**
 * Product detail page with SEO-friendly URL structure
 * Handles multiple URL formats:
 * - /produit/[productSlug] (1 segment - fallback)
 * - /produit/[categorySlug]/[productSlug] (2 segments)
 * - /produit/[mainCategory]/[subCategory]/[productSlug] (3 segments)
 *
 * Product slug is always the LAST segment in the URL
 */
export default function ProductPage() {
  const params = useParams()
  const slugArray = params.slug as string[]

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)

        // Product slug is always the last segment in the array
        const productSlug = slugArray[slugArray.length - 1]

        // Fetch product by slug
        const response = await fetch(`/api/products?slug=${productSlug}`)
        const data = await response.json()

        if (!data.success || !data.products?.[0]) {
          setError('Produit non trouvé')
          return
        }

        setProduct(data.products[0])
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Erreur lors du chargement du produit')
      } finally {
        setLoading(false)
      }
    }

    if (slugArray && slugArray.length > 0) {
      fetchProduct()
    }
  }, [slugArray])

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

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Produit non trouvé'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Le produit que vous recherchez n'existe pas ou n'est plus disponible.
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
      <ProductDetails product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || undefined,
        longDescription: product.longDescription || undefined,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        stock: product.stock,
        wineType: product.wineType || undefined,
        region: product.region || undefined,
        country: product.country || undefined,
        vintage: product.vintage || undefined,
        grapeVariety: product.grapeVariety || undefined,
        alcoholContent: product.alcoholContent || undefined,
        volume: product.volume || undefined,
        category: product.category ? {
          name: product.category.name,
          slug: product.category.slug,
        } : { name: '', slug: '' },
      }} />
      <Footer />
    </div>
  )
}
