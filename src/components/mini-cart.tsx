'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, X, Trash2 } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { formatPrice } from '@/lib/utils'

export function MiniCart() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { items, getTotal, getItemCount, removeItem } = useCart()
  const { currency, exchangeRate } = useCurrency()

  // Prevent hydration mismatch - cart data comes from localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? getItemCount() : 0
  const total = mounted ? getTotal() : 0
  const displayedItems = mounted ? items.slice(0, 3) : []
  const remainingItems = mounted ? items.length - 3 : 0

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="relative text-gray-700 dark:text-gray-300 hover:text-copper-500 dark:hover:text-copper-400 transition-colors"
        title="Panier"
      >
        <ShoppingCart className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-copper-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-gray-900 dark:text-white font-semibold">
              Panier ({itemCount} {itemCount === 1 ? 'article' : 'articles'})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items */}
          {!mounted || items.length === 0 ? (
            <div className="p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Votre panier est vide</p>
              <Link
                href="/vins"
                onClick={() => setIsOpen(false)}
                className="mt-4 inline-block text-primary-600 dark:text-primary-500 hover:text-primary-500 dark:hover:text-primary-400 text-sm font-medium"
              >
                Découvrir nos vins
              </Link>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {displayedItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="w-14 h-14 bg-gray-100 dark:bg-dark-900 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 dark:text-white text-sm font-medium truncate">
                        {item.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {item.quantity} x {formatPrice(item.price, currency, exchangeRate)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Remaining items indicator */}
              {remainingItems > 0 && (
                <div className="px-4 py-2 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-dark-700">
                  + {remainingItems} autre{remainingItems > 1 ? 's' : ''} article{remainingItems > 1 ? 's' : ''}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-dark-700 space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                  <span className="text-gray-900 dark:text-white font-bold text-lg">{formatPrice(total, currency, exchangeRate)}</span>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg text-center transition-colors"
                  >
                    Voir le panier
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg text-center transition-colors"
                  >
                    Commander
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
