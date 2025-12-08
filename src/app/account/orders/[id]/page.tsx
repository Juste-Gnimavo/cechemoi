'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Package, MapPin, CreditCard, Truck, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { ProductImage } from '@/components/ui/product-image'

export default function OrderDetailsPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/orders')
      return
    }

    if (!session) return

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/account/orders/${id}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        } else {
          router.push('/account/orders')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, session, router, status])

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'En attente' },
      PROCESSING: { color: 'bg-blue-500/20 text-blue-400', label: 'En cours' },
      SHIPPED: { color: 'bg-purple-500/20 text-purple-400', label: 'Expédiée' },
      DELIVERED: { color: 'bg-green-500/20 text-green-400', label: 'Livrée' },
      CANCELLED: { color: 'bg-red-500/20 text-red-400', label: 'Annulée' },
      REFUNDED: { color: 'bg-gray-500/20 text-gray-400', label: 'Remboursée' },
    }
    return statuses[status] || { color: 'bg-gray-500/20 text-gray-400', label: status }
  }

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Payé',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
    }
    return statuses[status] || status
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH_ON_DELIVERY: 'Paiement à la livraison',
      PAIEMENTPRO: 'Paiement mobile',
      ORANGE_MONEY: 'Orange Money',
      MTN_MOBILE_MONEY: 'MTN MoMo',
      WAVE: 'Wave',
      STRIPE: 'Carte bancaire',
    }
    return methods[method] || method
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/account/orders"
                className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm mb-2 inline-block"
              >
                ← Retour aux commandes
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Commande #{order.orderNumber}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusInfo(order.status).color}`}>
              {getStatusInfo(order.status).label}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary-500" />
                  Articles commandés
                </h2>
                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-dark-800 last:border-0">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <ProductImage
                          src={item.product.images[0] || '/placeholder.png'}
                          alt={item.product.name}
                          fill
                        />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/produit/${item.product.slug}`}
                          className="text-gray-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 font-medium"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          Quantité: {item.quantity} × {item.price.toLocaleString()} CFA
                        </p>
                      </div>
                      <div className="text-gray-900 dark:text-white font-bold">
                        {item.total.toLocaleString()} CFA
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 border-t border-gray-200 dark:border-dark-800 pt-4">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Sous-total</span>
                    <span>{order.subtotal.toLocaleString()} CFA</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Réduction {order.couponCode && `(${order.couponCode})`}</span>
                      <span>-{order.discount.toLocaleString()} CFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Livraison</span>
                    <span>{order.shippingCost.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Taxe</span>
                    <span>{order.tax.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg pt-2 border-t border-gray-300 dark:border-dark-700">
                    <span>Total</span>
                    <span>{order.total.toLocaleString()} CFA</span>
                  </div>
                </div>
              </div>

              {order.orderNotes && order.orderNotes.length > 0 && (
                <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary-500" />
                    Historique
                  </h2>
                  <div className="space-y-4">
                    {order.orderNotes.map((note: any) => (
                      <div key={note.id} className="border-l-2 border-primary-500 pl-4">
                        <p className="text-gray-900 dark:text-white">{note.content}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary-500" />
                  Adresse de livraison
                </h3>
                <div className="text-gray-600 dark:text-gray-300 space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-500" />
                  Paiement
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Méthode</span>
                    <span className="text-gray-900 dark:text-white">{getPaymentMethodLabel(order.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Statut</span>
                    <span className={`${
                      order.paymentStatus === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                      order.paymentStatus === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  {order.payment?.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Référence</span>
                      <span className="text-gray-900 dark:text-white text-sm">{order.payment.reference}</span>
                    </div>
                  )}
                </div>
              </div>

              {order.trackingNumber && (
                <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary-500" />
                    Suivi de livraison
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Numéro de suivi:</p>
                  <p className="text-gray-900 dark:text-white font-mono">{order.trackingNumber}</p>
                </div>
              )}

              {order.invoice && (
                <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-500" />
                    Facture
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Numéro</span>
                      <span className="text-gray-900 dark:text-white">{order.invoice.invoiceNumber}</span>
                    </div>
                    <Link
                      href={`/account/invoices/${order.invoice.id}`}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/30 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      Voir la facture
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
