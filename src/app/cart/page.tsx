'use client'

import { useState } from 'react'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { useCart, AppliedCoupon } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Minus, Plus, X, ArrowRight, ShoppingBag, Tag, Loader2, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'
import { AuthModal } from '@/components/auth/auth-modal'
import { toast } from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, clearCart, coupon, applyCoupon, removeCoupon, getDiscount, getFinalTotal } = useCart()
  const { currency, exchangeRate } = useCurrency()
  const { mini } = useConfetti()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const subtotal = getTotal()
  const discount = getDiscount()
  const finalTotal = getFinalTotal()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Veuillez entrer un code promo')
      return
    }

    setCouponLoading(true)
    setCouponError('')

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartItems: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        }),
      })

      const data = await response.json()

      if (data.valid && data.coupon) {
        // Check minimum order amount
        if (data.coupon.minimumOrderAmount && subtotal < data.coupon.minimumOrderAmount) {
          setCouponError(`Montant minimum requis: ${formatPrice(data.coupon.minimumOrderAmount, currency, exchangeRate)}`)
          return
        }

        applyCoupon(data.coupon as AppliedCoupon)
        setCouponCode('')
        mini() // Mini confetti burst!
        toast.success('Code promo appliqué!')
      } else {
        setCouponError(data.errors?.[0] || data.error || 'Code promo invalide')
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Erreur lors de la validation du code promo')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    toast.success('Code promo retiré')
  }

  const handleCheckout = () => {
    if (status === 'loading') return

    if (!session) {
      // Show auth modal if not logged in
      setShowAuthModal(true)
    } else {
      // Go to checkout if logged in
      router.push('/checkout')
    }
  }

  const handleAuthSuccess = () => {
    // Redirect to checkout after successful auth
    // Use window.location.href for full page reload to ensure session is recognized
    window.location.href = '/checkout'
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-4">
              Votre panier est vide
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Découvrez notre sélection de vins exceptionnels
            </p>
            <Link
              href="/vins"
              className="inline-flex items-center px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              Explorer nos vins
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-8">
          Panier ({items.length} article{items.length > 1 ? 's' : ''})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-4 flex items-center gap-4 border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50"
              >
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    fill
                  />
                </div>

                <div className="flex-1">
                  <Link
                    href={`/produit/${item.slug}`}
                    className="text-gray-900 dark:text-white font-semibold hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {formatPrice(item.price, currency, exchangeRate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="bg-transparent border border-gray-300 dark:border-dark-700 hover:border-primary-500 text-gray-700 dark:text-white p-2 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-gray-900 dark:text-white font-semibold w-12 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="bg-transparent border border-gray-300 dark:border-dark-700 hover:border-primary-500 text-gray-700 dark:text-white p-2 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-gray-900 dark:text-white font-bold">
                    {formatPrice(item.price * item.quantity, currency, exchangeRate)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-gray-400 hover:text-red-500 mt-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-400 text-sm font-semibold"
            >
              Vider le panier
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg p-6 sticky top-24 border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Résumé de la commande
              </h2>

              {/* Coupon Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Code promo
                </label>
                {coupon ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-green-400 font-semibold">{coupon.code}</p>
                          {coupon.description && (
                            <p className="text-green-400/70 text-xs">{coupon.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Retirer le code"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-green-400 text-sm mt-2">
                      {coupon.discountType === 'percentage'
                        ? `-${coupon.discountValue}%`
                        : `-${formatPrice(coupon.discountValue, currency, exchangeRate)}`}
                      {coupon.maximumDiscount && ` (max ${formatPrice(coupon.maximumDiscount, currency, exchangeRate)})`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            setCouponError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApplyCoupon()
                          }}
                          placeholder="Entrez votre code"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                          disabled={couponLoading}
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {couponLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          'Appliquer'
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-400 text-sm mt-2">{couponError}</p>
                    )}
                    {!session && (
                      <p className="text-gray-500 text-xs mt-2">
                        <Link
                          href="/auth/login-phone?callbackUrl=/cart"
                          className="text-primary-400 hover:text-primary-300 underline"
                        >
                          Connectez-vous
                        </Link>
                        {' '}pour utiliser un code promo
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Sous-total ({items.length} article{items.length > 1 ? 's' : ''})</span>
                  <span>{formatPrice(subtotal, currency, exchangeRate)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Réduction ({coupon?.code})</span>
                    <span>-{formatPrice(discount, currency, exchangeRate)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
                  <span>Livraison</span>
                  <span>Calculée à l'étape suivante</span>
                </div>
                <div className="border-t border-gray-200 dark:border-dark-800 pt-3">
                  <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal, currency, exchangeRate)}</span>
                  </div>
                  {discount > 0 && (
                    <p className="text-green-600 dark:text-green-400 text-sm text-right mt-1">
                      Vous économisez {formatPrice(discount, currency, exchangeRate)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={status === 'loading'}
                className="block w-full text-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors mb-3"
              >
                {status === 'loading' ? 'Chargement...' : 'Passer la commande'}
              </button>

              {!session && status !== 'loading' && (
                <p className="text-center text-gray-500 dark:text-gray-400 text-xs mb-3">
                  Vous devrez vous connecter ou créer un compte
                </p>
              )}

              <Link
                href="/vins"
                className="block w-full text-center px-6 py-3 border border-gray-300 dark:border-dark-700 hover:border-primary-500 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        redirectTo="/checkout"
      />
    </div>
  )
}
