'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { formatPrice } from '@/lib/utils'
import { useCurrency } from '@/store/currency'
import { CheckCircle, Package, MapPin, CreditCard, Truck, Phone, Clock, ArrowRight, Loader2, Home, FileText, Eye } from 'lucide-react'
import { useConfetti } from '@/hooks/useConfetti'

interface OrderData {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  shippingCost: number
  total: number
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    total: number
    product: {
      id: string
      name: string
      image: string | null
    }
  }>
  shippingAddress: {
    fullName: string
    phone: string
    quartier: string | null
    cite: string | null
    rue: string | null
    city: string
    description: string | null
  }
  shippingMethod: {
    name: string
    estimatedDays: string | null
  } | null
  user: {
    name: string | null
    phone: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
  } | null
}

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const { status: authStatus } = useSession()
  const router = useRouter()
  const { celebration } = useConfetti()
  const { currency, exchangeRate } = useCurrency()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confettiFired, setConfettiFired] = useState(false)

  // Clear sessionStorage when order loads successfully (prevents checkout redirect issues)
  useEffect(() => {
    if (order) {
      sessionStorage.removeItem('lastOrderId')
    }
  }, [order])

  // Trigger confetti animation on success
  useEffect(() => {
    if (order && !loading && !confettiFired) {
      setConfettiFired(true)
      celebration({ duration: 3000 })
    }
  }, [order, loading, confettiFired, celebration])

  useEffect(() => {
    if (authStatus === 'loading') return

    // Prevent re-fetching if we already have data or an error
    if (order || error) return

    // Give session time to establish after registration/login
    // Don't immediately redirect - try to fetch the order first
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/account/orders/${id}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        } else if (res.status === 401) {
          // Only redirect if truly unauthenticated after trying
          window.location.href = '/auth/login-phone?callbackUrl=' + encodeURIComponent(`/order-confirmation/${id}`)
          return
        } else {
          setError('Commande non trouvée')
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Erreur lors du chargement de la commande')
      } finally {
        setLoading(false)
      }
    }

    // Small delay to allow session to establish after redirect
    const timer = setTimeout(() => {
      fetchOrder()
    }, 500)

    return () => clearTimeout(timer)
  }, [id, authStatus, order, error])

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'CASH_ON_DELIVERY': 'Paiement à la livraison',
      'PAIEMENTPRO': 'Paiement mobile',
      'ORANGE_MONEY': 'Orange Money',
      'MTN_MOBILE_MONEY': 'MTN MoMo',
      'WAVE': 'Wave',
    }
    return methods[method] || method
  }

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'PENDING': { label: 'En attente', color: 'text-yellow-400' },
      'COMPLETED': { label: 'Payé', color: 'text-green-400' },
      'FAILED': { label: 'Échoué', color: 'text-red-400' },
    }
    return statuses[status] || { label: status, color: 'text-gray-400' }
  }

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Commande non trouvée'}
            </h1>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const buildAddressString = () => {
    const parts = [
      order.shippingAddress.quartier,
      order.shippingAddress.cite,
      order.shippingAddress.rue,
      order.shippingAddress.city,
    ].filter(Boolean)
    return parts.join(', ')
  }

  const paymentStatus = getPaymentStatusLabel(order.paymentStatus)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Commande confirmée !
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Merci pour votre commande, {order.user?.name || order.shippingAddress?.fullName || 'cher client'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-dark-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700">
              <span className="text-gray-500 dark:text-gray-400">N° de commande:</span>
              <span className="text-gray-900 dark:text-white font-mono font-bold">{order.orderNumber}</span>
            </div>
          </div>

          {/* Order Status Timeline */}
          <div className="bg-white dark:bg-dark-800/50 rounded-lg p-6 border border-gray-200 dark:border-dark-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-500" />
              Statut de la commande
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Commande reçue</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(order.createdAt).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatus.color} bg-gray-100 dark:bg-dark-700`}>
                {paymentStatus.label}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-dark-800/50 rounded-lg p-6 border border-gray-200 dark:border-dark-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-500" />
              Articles commandés
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-medium truncate">{item.product.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Quantité: {item.quantity}</p>
                  </div>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatPrice(item.total, currency, exchangeRate)}</p>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal, currency, exchangeRate)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Frais De Livraison</span>
                <span>
                  {order.shippingCost === 0 ? (
                    <span className="text-green-500"></span>
                  ) : order.paymentMethod === 'CASH_ON_DELIVERY' && order.shippingCost === 0 ? (
                    <span className="text-yellow-400">À payer au livreur</span>
                  ) : (
                    formatPrice(order.shippingCost, currency, exchangeRate)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg pt-2 border-t border-gray-200 dark:border-dark-700">
                <span>Total</span>
                <span className="text-primary-500 dark:text-primary-400">{formatPrice(order.total, currency, exchangeRate)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Delivery Address */}
            <div className="bg-white dark:bg-dark-800/50 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-500" />
                Adresse de livraison
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p className="text-gray-900 dark:text-white font-medium">{order.shippingAddress.fullName}</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {order.shippingAddress.phone}
                </p>
                <p>{buildAddressString()}</p>
                {order.shippingAddress.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                    "{order.shippingAddress.description}"
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Shipping Method */}
            <div className="bg-white dark:bg-dark-800/50 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-500" />
                Paiement & Livraison
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Mode de paiement</p>
                  <p className="text-gray-900 dark:text-white font-medium">{getPaymentMethodLabel(order.paymentMethod)}</p>
                </div>
                {order.shippingMethod && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Mode de livraison</p>
                    <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {order.shippingMethod.name}
                    </p>
                    {order.shippingMethod.estimatedDays && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Délai estimé: {order.shippingMethod.estimatedDays}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prochaines étapes</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 dark:text-primary-400">1.</span>
                <span>Vous recevrez une confirmation par SMS/WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 dark:text-primary-400">2.</span>
                <span>Notre équipe préparera votre commande</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 dark:text-primary-400">3.</span>
                <span>Vous serez contacté pour la livraison</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link
              href={`/account/orders/${order.id}`}
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg border border-gray-200 dark:border-dark-700 transition-colors"
            >
              <Eye className="h-5 w-5" />
              Voir la commande
            </Link>
            {order.invoice && (
              <Link
                href={`/account/invoices/${order.invoice.id}`}
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg border border-gray-200 dark:border-dark-700 transition-colors"
              >
                <FileText className="h-5 w-5" />
                Voir la facture
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Continuer mes achats
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
