'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, buildProductUrl } from '@/lib/utils'
import { useCurrency } from '@/store/currency'

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
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { currency, exchangeRate } = useCurrency()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`)
      const data = await response.json()

      if (data.success) {
        setResults(data.products || [])
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, searchProducts])

  const handleClose = () => {
    setSearchQuery('')
    setResults([])
    setHasSearched(false)
    onClose()
  }

  const handleProductClick = () => {
    handleClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-16 px-4">
        <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-lg shadow-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-dark-700">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des vins, champagnes, spiritueux..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-lg"
            />
            {loading && (
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            )}
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!hasSearched && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Commencez à taper pour rechercher des produits
                </p>
              </div>
            )}

            {hasSearched && !loading && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun résultat pour "{searchQuery}"
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {results.map((product) => {
                  const productUrl = buildProductUrl(
                    product.slug,
                    product.mainCategorySlug,
                    product.subCategorySlug
                  )
                  const displayPrice = product.salePrice || product.price

                  return (
                    <Link
                      key={product.id}
                      href={productUrl}
                      onClick={handleProductClick}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-dark-900 rounded-lg overflow-hidden">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <Search className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white font-medium truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {product.wineType && (
                            <span>{product.wineType}</span>
                          )}
                          {product.region && (
                            <>
                              <span>•</span>
                              <span>{product.region}</span>
                            </>
                          )}
                          {product.vintage && (
                            <>
                              <span>•</span>
                              <span>{product.vintage}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        {product.salePrice && (
                          <div className="text-gray-400 dark:text-gray-500 line-through text-sm">
                            {formatPrice(product.price, currency, exchangeRate)}
                          </div>
                        )}
                        <div className="text-gray-900 dark:text-white font-bold">
                          {formatPrice(displayPrice, currency, exchangeRate)}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Search tip */}
            {hasSearched && results.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700">
                <p className="text-gray-500 text-sm text-center">
                  Affichage de {results.length} résultat{results.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
