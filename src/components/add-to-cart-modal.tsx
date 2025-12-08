'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Check, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { create } from 'zustand'

// Store for managing the modal state
interface CartModalState {
  isOpen: boolean
  product: {
    name: string
    price: number
    image: string
    quantity: number
  } | null
  openModal: (product: { name: string; price: number; image: string; quantity: number }) => void
  closeModal: () => void
}

export const useCartModal = create<CartModalState>((set) => ({
  isOpen: false,
  product: null,
  openModal: (product) => set({ isOpen: true, product }),
  closeModal: () => set({ isOpen: false, product: null }),
}))

export function AddToCartModal() {
  const { isOpen, product, closeModal } = useCartModal()
  const { getItemCount, getTotal } = useCart()
  const { currency, exchangeRate } = useCurrency()
  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Animation sequence when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setShowContent(true), 50)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  // Auto close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => closeModal(), 50000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, closeModal])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeModal])

  if (!mounted || !isOpen || !product) return null

  const itemCount = getItemCount()
  const total = getTotal()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md transition-all duration-500 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 overflow-hidden mx-4">
          {/* Success Header with Animation */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full animate-pulse delay-100" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/5 rounded-full animate-ping" />
            </div>

            {/* Success Icon with Animation */}
            <div className="relative">
              <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg transition-all duration-500 ${
                showContent ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}>
                <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
              </div>

              {/* Sparkles around the icon */}
              <Sparkles className={`absolute -top-1 -right-4 w-5 h-5 text-yellow-300 transition-all duration-700 delay-200 ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} />
              <Sparkles className={`absolute -bottom-1 -left-4 w-4 h-4 text-yellow-300 transition-all duration-700 delay-300 ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} />
            </div>

            <h3 className={`text-xl font-bold text-white transition-all duration-500 delay-150 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Ajouté au panier !
            </h3>

            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Details */}
          <div className={`p-5 transition-all duration-500 delay-200 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center gap-4 mb-5">
              {/* Product Image */}
              <div className="w-20 h-20 bg-gray-100 dark:bg-dark-900 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-primary-500/30">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 dark:text-white font-semibold text-lg truncate">
                  {product.name}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Quantité: {product.quantity}
                </p>
                <p className="text-primary-500 font-bold text-lg mt-1">
                  {formatPrice(product.price * product.quantity, currency, exchangeRate)}
                </p>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-gray-100 dark:bg-dark-900/50 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Articles dans le panier</span>
                <span className="text-gray-900 dark:text-white font-semibold">{itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                <span className="text-gray-900 dark:text-white font-bold text-lg">{formatPrice(total, currency, exchangeRate)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
              >
                Continuer mes achats
              </button>
              <Link
                href="/cart"
                onClick={closeModal}
                className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors group"
              >
                Voir le panier
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Progress bar for auto-close */}
          <div className="h-1 bg-gray-200 dark:bg-dark-700">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 origin-left"
              style={{
                animation: showContent ? 'shrink 5s linear forwards' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframes for progress bar */}
      <style jsx>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </>
  )
}
