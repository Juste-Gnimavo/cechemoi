'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { useCartModal } from '@/components/add-to-cart-modal'
import { ProductImage } from '@/components/ui/product-image'
import { buildProductUrl } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  featured: boolean
  category: {
    id: string
    name: string
    slug: string
  } | null
  mainCategorySlug: string | null
  subCategorySlug: string | null
}

export function FashionFeatured() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const { openModal } = useCartModal()
  const { currency, exchangeRate } = useCurrency()

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch featured products first, fall back to recent products
        const res = await fetch('/api/products?featured=true&limit=4')
        const data = await res.json()

        if (data.success && data.products.length > 0) {
          setProducts(data.products)
        } else {
          // Fallback: fetch latest products
          const fallbackRes = await fetch('/api/products?limit=4')
          const fallbackData = await fallbackRes.json()
          if (fallbackData.success) {
            setProducts(fallbackData.products)
          }
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    const price = product.salePrice || product.price
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price,
      image: product.images[0] || '/placeholder.png',
      quantity: 1,
      slug: product.slug,
    })
    openModal({
      name: product.name,
      price,
      image: product.images[0] || '/placeholder.png',
      quantity: 1,
    })
  }

  if (loading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Nouveautés
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
              Nos créations phares
            </h2>
          </div>
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Nouveautés
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
              Nos créations phares
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mt-4 md:mt-0 transition-colors duration-200"
          >
            Voir tout le catalogue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const productUrl = buildProductUrl(
              product.slug,
              product.mainCategorySlug,
              product.subCategorySlug
            )
            const displayPrice = product.salePrice || product.price

            return (
              <div
                key={product.id}
                className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
              >
                {/* Image Container */}
                <Link href={productUrl} className="block relative aspect-[3/4] overflow-hidden">
                  <ProductImage
                    src={product.images[0] || '/placeholder.png'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Sale Badge */}
                  {product.salePrice && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                      -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                    </div>
                  )}

                  {/* Quick Actions - Show on hover */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                      aria-label="Ajouter aux favoris"
                    >
                      <Heart className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                      aria-label="Ajouter au panier"
                    >
                      <ShoppingBag className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  {product.category && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {product.category.name}
                    </p>
                  )}
                  <Link href={productUrl}>
                    <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors duration-200">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-2">
                    {product.salePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.price, currency, exchangeRate)}
                      </span>
                    )}
                    <p className="text-lg font-bold text-primary-500">
                      {formatPrice(displayPrice, currency, exchangeRate)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
