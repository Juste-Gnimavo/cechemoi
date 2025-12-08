'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, X, Loader2, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  salePrice: number | null
  images: string[]
  stock: number
}

interface ProductMultiSelectProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  excludeId?: string
  label?: string
  placeholder?: string
}

export function ProductMultiSelect({
  selectedIds,
  onChange,
  excludeId,
  label = 'Sélectionner des produits',
  placeholder = 'Rechercher par nom ou SKU...',
}: ProductMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch selected products details on mount
  useEffect(() => {
    if (selectedIds.length > 0) {
      fetchSelectedProducts()
    }
  }, [])

  // Search products when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const debounce = setTimeout(() => {
        searchProducts()
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSelectedProducts = async () => {
    try {
      const promises = selectedIds.map(id =>
        fetch(`/api/admin/products/${id}`).then(res => res.json())
      )
      const results = await Promise.all(promises)
      const products = results
        .filter(r => r.success)
        .map(r => r.product)
      setSelectedProducts(products)
    } catch (error) {
      console.error('Error fetching selected products:', error)
    }
  }

  const searchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        q: searchTerm,
        limit: '10',
        ...(excludeId && { excludeId }),
      })

      const res = await fetch(`/api/admin/products/search?${params}`)
      const data = await res.json()

      if (data.success) {
        // Filter out already selected products
        const filtered = data.products.filter(
          (p: Product) => !selectedIds.includes(p.id)
        )
        setSearchResults(filtered)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (product: Product) => {
    const newIds = [...selectedIds, product.id]
    onChange(newIds)
    setSelectedProducts([...selectedProducts, product])
    setSearchTerm('')
    setSearchResults([])
    setIsOpen(false)
  }

  const handleRemove = (productId: string) => {
    const newIds = selectedIds.filter(id => id !== productId)
    onChange(newIds)
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
      )}

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {searchResults.map(product => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-left"
              >
                {/* Product Image */}
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-gray-500" />
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{product.sku}</span>
                    <span>•</span>
                    <span>{product.salePrice || product.price} CFA</span>
                    {product.stock <= 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-400">Rupture de stock</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {isOpen && searchTerm.length >= 2 && searchResults.length === 0 && !loading && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>
          </div>
        )}
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {selectedProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Product Image */}
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-dark-700 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-gray-500" />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors"
                  title="Retirer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProducts.length === 0 && (
        <p className="text-sm text-gray-500">
          Aucun produit sélectionné
        </p>
      )}
    </div>
  )
}
