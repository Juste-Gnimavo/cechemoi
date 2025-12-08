'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import { formatPrice, buildProductUrl } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { toast } from 'react-hot-toast'
import { ProductImage } from '@/components/ui/product-image'
import { useCartModal } from '@/components/add-to-cart-modal'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    salePrice: number | null
    image: string
    wineType?: string
    region?: string
    vintage?: string
    mainCategorySlug?: string | null
    subCategorySlug?: string | null
    featured?: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const { openModal } = useCartModal()
  const { currency, exchangeRate } = useCurrency()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    const price = product.salePrice || product.price
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: price,
      image: product.image,
      quantity: 1,
      slug: product.slug,
    })
    // Show the cart modal with product details
    openModal({
      name: product.name,
      price: price,
      image: product.image,
      quantity: 1,
    })
  }

  const displayPrice = product.salePrice || product.price
  const productUrl = buildProductUrl(
    product.slug,
    product.mainCategorySlug,
    product.subCategorySlug
  )

  return (
    <Link href={productUrl} className="group block">
      <div className={`bg-white dark:bg-dark-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-transparent ${product.featured ? 'ring-1 ring-yellow-500/30' : ''}`}>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-500">
            <ProductImage
              src={product.image}
              alt={product.name}
              fill
              className="group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
          {/* Featured badge */}
          {product.featured && (
            <div className="absolute top-3 left-12 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Star className="h-3 w-3 fill-white" />
              Vedette
            </div>
          )}
          {product.salePrice && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
            </div>
          )}
          <button
            className="absolute top-3 left-3 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm p-2.5 rounded-full text-gray-700 dark:text-white hover:bg-primary-500 hover:text-white hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault()
              toast.success('Ajouté aux favoris')
            }}
          >
            <Heart className="h-4 w-4" />
          </button>
          {/* Quick add to cart button - appears on hover */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              Ajouter au panier
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1 line-clamp-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>
          {product.region && (
            <p className="text-gray-500 text-sm mb-3">
              {product.region} {product.vintage && `• ${product.vintage}`}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {product.salePrice && (
                <span className="text-gray-400 dark:text-gray-500 line-through text-sm">
                  {formatPrice(product.price, currency, exchangeRate)}
                </span>
              )}
              <span className="text-gray-900 dark:text-white font-bold text-lg">
                {formatPrice(displayPrice, currency, exchangeRate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
