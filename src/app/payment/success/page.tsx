'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { formatPrice } from '@/lib/utils'
import { useCurrency } from '@/store/currency'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PaymentDetails {
  reference: string
  status: string
  amount: number
  currency: string
  channel?: string
  transactionDate?: string
  order: {
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
  }
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const { currency, exchangeRate } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const reference = searchParams.get('referenceNumber') || searchParams.get('reference')

    if (!reference) {
      setError('Aucune référence de paiement trouvée')
      setLoading(false)
      return
    }

    // Check payment status
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/paiementpro/status/${reference}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Échec de la vérification du paiement')
        }

        setPaymentDetails(data.payment)
      } catch (err) {
        console.error('Payment status check error:', err)
        setError(err instanceof Error ? err.message : 'Erreur lors de la vérification du paiement')
      } finally {
        setLoading(false)
      }
    }

    checkPaymentStatus()
  }, [searchParams])

  const isSuccess = paymentDetails?.status === 'COMPLETED'
  const isPending = paymentDetails?.status === 'PENDING'

  if (loading) {
    return (
      <div className="rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
        <Loader2 className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Vérification du paiement...
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Veuillez patienter pendant que nous vérifions votre paiement
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erreur</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <Link
          href="/"
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="rounded-lg p-8 border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Paiement réussi!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Votre commande a été confirmée et est en cours de traitement
          </p>
        </div>

        {paymentDetails && (
          <div className="rounded-lg p-6 mb-6 border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Détails du paiement
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Numéro de commande:</dt>
                <dd className="text-gray-900 dark:text-white font-semibold">
                  {paymentDetails.order.orderNumber}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Référence de paiement:</dt>
                <dd className="text-gray-900 dark:text-white font-mono text-sm">
                  {paymentDetails.reference}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Montant:</dt>
                <dd className="text-gray-900 dark:text-white font-bold text-lg">
                  {formatPrice(paymentDetails.amount, currency, exchangeRate)}
                </dd>
              </div>
              {paymentDetails.channel && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Méthode de paiement:</dt>
                  <dd className="text-gray-900 dark:text-white">{paymentDetails.channel}</dd>
                </div>
              )}
              {paymentDetails.transactionDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Date:</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {new Date(paymentDetails.transactionDate).toLocaleString('fr-FR')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-6">
          <p className="text-gray-800 dark:text-white text-sm">
            ✓ Nous avons envoyé une confirmation de commande à votre téléphone.
          </p>
          <p className="text-gray-800 dark:text-white text-sm mt-1">
            ✓ Vous pouvez suivre votre commande dans votre espace client.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href={paymentDetails ? `/order-confirmation/${paymentDetails.order.id}` : '/account/orders'}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
          >
            Voir ma commande
          </Link>
          <Link
            href="/"
            className="flex-1 border border-gray-300 dark:border-dark-700 hover:border-primary-500 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
        <Loader2 className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Paiement en attente
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Votre paiement est en cours de traitement. Cela peut prendre quelques minutes.
        </p>
        {paymentDetails && (
          <div className="rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Référence:</p>
            <p className="text-gray-900 dark:text-white font-mono">{paymentDetails.reference}</p>
          </div>
        )}
        <Link
          href="/"
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Payment failed
  return (
    <div className="rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Paiement échoué
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Malheureusement, votre paiement n'a pas pu être traité.
      </p>
      {paymentDetails && (
        <div className="rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">Référence:</p>
          <p className="text-gray-900 dark:text-white font-mono">{paymentDetails.reference}</p>
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <Link
          href="/cart"
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Réessayer
        </Link>
        <Link
          href="/"
          className="border border-gray-300 dark:border-dark-700 hover:border-primary-500 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

function PaymentLoadingFallback() {
  return (
    <div className="rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900/50">
      <Loader2 className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-spin" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Chargement...
      </h1>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<PaymentLoadingFallback />}>
            <PaymentSuccessContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
