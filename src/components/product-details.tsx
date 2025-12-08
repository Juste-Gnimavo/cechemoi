'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, Minus, Plus, Package, Truck, Shield } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { ProductImage } from '@/components/ui/product-image'
import { useCartModal } from '@/components/add-to-cart-modal'

interface ProductDetailsProps {
  product: {
    id: string
    name: string
    slug: string
    description: string
    shortDescription?: string
    longDescription?: string
    price: number
    salePrice: number | null
    images: string[]
    wineType?: string
    region?: string
    country?: string
    vintage?: string
    grapeVariety?: string
    alcoholContent?: number
    volume?: string
    stock: number
    category: { name: string; slug: string }
  }
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem } = useCart()
  const { openModal } = useCartModal()
  const { currency, exchangeRate } = useCurrency()

  const displayPrice = product.salePrice || product.price

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: product.images[0],
      quantity,
      slug: product.slug,
    })
    // Show the cart modal with product details
    openModal({
      name: product.name,
      price: displayPrice,
      image: product.images[0] || '/placeholder.png',
      quantity,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Accueil</Link>
        <span className="mx-2">/</span>
        <Link href={`/vins/${product.category.slug}`} className="hover:text-gray-900 dark:hover:text-white">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
            <ProductImage
              src={product.images[selectedImage] || '/placeholder.png'}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedImage === index
                      ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-dark-900'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductImage
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-4xl font-sans font-bold text-gray-900 dark:text-white mb-4">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-4 mb-6">
            {product.salePrice && (
              <span className="text-2xl text-gray-500 line-through">
                {formatPrice(product.price, currency, exchangeRate)}
              </span>
            )}
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatPrice(displayPrice, currency, exchangeRate)}
            </span>
            {product.salePrice && (
              <span className="bg-primary-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-lg">
              {product.shortDescription}
            </p>
          )}

          {/* Fallback to description if no shortDescription */}
          {!product.shortDescription && product.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Wine Details */}
          <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-6 mb-6 space-y-3">
            {product.region && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Région:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{product.region}</span>
              </div>
            )}
            {product.vintage && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Millésime:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{product.vintage}</span>
              </div>
            )}
            {product.grapeVariety && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cépage:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{product.grapeVariety}</span>
              </div>
            )}
            {product.alcoholContent && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Alcool:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{product.alcoholContent}%</span>
              </div>
            )}
            {product.volume && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Volume:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{product.volume}</span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <p className="text-green-500 flex items-center gap-2">
                <Package className="h-5 w-5" />
                En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
              </p>
            ) : (
              <p className="text-red-500">Rupture de stock</p>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center bg-gray-100 dark:bg-dark-900 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-l-lg"
              >
                <Minus className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
              <span className="px-6 py-3 text-gray-900 dark:text-white font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-r-lg"
              >
                <Plus className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Ajouter au panier
            </button>

            <button className="bg-gray-100 dark:bg-dark-900 hover:bg-gray-200 dark:hover:bg-dark-800 text-gray-900 dark:text-white p-3 rounded-lg">
              <Heart className="h-6 w-6" />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 bg-gray-50 dark:bg-dark-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold">Livraison rapide</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  <br/>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold">Options de Paiement sécurisé</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                 - En ligne à la commande<br/>
                 - Dépôt sur un de nos numéros
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Long Description - Full width below the grid */}
      {product.longDescription && (
        <div className="mt-12 border-t border-gray-200 dark:border-dark-700 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Description détaillée</h2>
          <div
            className="prose dark:prose-invert prose-lg max-w-none text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: product.longDescription }}
          />
        </div>
      )}
    </div>
  )
}
