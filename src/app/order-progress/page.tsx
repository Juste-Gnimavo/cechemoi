'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { OrderProgressStepper, Step, cashOnDeliverySteps, paiementProSteps } from '@/components/order-progress-stepper'
import { useCart } from '@/store/cart'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import confetti from 'canvas-confetti'
import Link from 'next/link'

function OrderProgressContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCart()

  const [steps, setSteps] = useState<Step[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const hasStartedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const flow = searchParams.get('flow') || 'CASH_ON_DELIVERY'

  // Initialize steps based on flow
  useEffect(() => {
    if (flow === 'PAIEMENTPRO') {
      setSteps(JSON.parse(JSON.stringify(paiementProSteps)))
    } else {
      setSteps(JSON.parse(JSON.stringify(cashOnDeliverySteps)))
    }
  }, [flow])

  // Trigger confetti
  const triggerConfetti = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#744424', '#FFD700', '#22c55e'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#744424', '#FFD700', '#22c55e'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }, [])

  // Update step status
  const updateStep = useCallback((stepId: number, status: Step['status']) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ))
  }, [])

  // Animate progress through steps (client-side simulation)
  const animateProgress = useCallback(async (totalSteps: number, finalOrderId: string, paymentUrl?: string) => {
    // Step timing for visual feedback (faster for payment flow)
    const stepDelays = flow === 'PAIEMENTPRO'
      ? [400, 600, 500] // Order, Invoice, Payment prep
      : [400, 600, 500, 600, 400] // Order, Invoice, SMS, WhatsApp, Complete

    for (let i = 1; i <= totalSteps; i++) {
      // Mark current step as in progress
      updateStep(i, 'in_progress')

      // Wait for step animation
      await new Promise(resolve => setTimeout(resolve, stepDelays[i - 1] || 500))

      // Mark as completed
      updateStep(i, 'completed')

      // Small delay before next step
      if (i < totalSteps) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Handle completion
    if (flow === 'PAIEMENTPRO' && paymentUrl) {
      // Redirect to payment
      clearCart()
      window.location.href = paymentUrl
    } else {
      // Show completion
      setIsComplete(true)
      clearCart()
      triggerConfetti()

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push(`/order-confirmation/${finalOrderId}`)
      }, 3000)
    }
  }, [flow, clearCart, triggerConfetti, updateStep, router])

  // Process order with JSON API
  const processOrder = useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    setIsProcessing(true)

    // Get order data from sessionStorage
    const orderDataStr = sessionStorage.getItem('pendingOrderData')
    if (!orderDataStr) {
      setHasError(true)
      setErrorMessage('Aucune commande en attente. Veuillez retourner au panier.')
      setIsProcessing(false)
      return
    }

    const orderData = JSON.parse(orderDataStr)

    // Clear pending order data immediately
    sessionStorage.removeItem('pendingOrderData')

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController()

    // Start with first step in progress
    updateStep(1, 'in_progress')

    try {
      const response = await fetch('/api/orders/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        signal: abortControllerRef.current.signal,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la création de la commande')
      }

      // Store order ID
      setOrderId(result.orderId)
      sessionStorage.setItem('lastOrderId', result.orderId)

      // Determine total steps and animate
      const totalSteps = result.paymentMethod === 'PAIEMENTPRO' ? 3 : 5

      // Animate progress through all steps
      await animateProgress(totalSteps, result.orderId, result.paymentUrl)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      console.error('Order processing error:', error)

      // Mark current step as failed
      setSteps(prev => prev.map(step =>
        step.status === 'in_progress' ? { ...step, status: 'failed' } : step
      ))

      setHasError(true)
      setErrorMessage(error.message || 'Une erreur est survenue lors de la création de la commande')
    } finally {
      setIsProcessing(false)
    }
  }, [animateProgress, updateStep])

  // Start processing on mount
  useEffect(() => {
    if (steps.length > 0 && !hasStartedRef.current) {
      processOrder()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [steps.length, processOrder])

  // Retry handler
  const handleRetry = () => {
    hasStartedRef.current = false
    setHasError(false)
    setErrorMessage('')
    setIsComplete(false)
    setOrderId(null)

    // Reset steps
    if (flow === 'PAIEMENTPRO') {
      setSteps(JSON.parse(JSON.stringify(paiementProSteps)))
    } else {
      setSteps(JSON.parse(JSON.stringify(cashOnDeliverySteps)))
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {isComplete ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Commande confirmée!
                </h1>
                <p className="text-gray-400">
                  Vous allez être redirigé vers les détails de votre commande...
                </p>
              </>
            ) : hasError ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Une erreur est survenue
                </h1>
                <p className="text-red-400 mb-4">{errorMessage}</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Traitement en cours
                </h1>
                <p className="text-gray-400">
                  Veuillez patienter pendant que nous traitons votre commande...
                </p>
              </>
            )}
          </div>

          {/* Progress Stepper */}
          <div className="bg-dark-800 rounded-xl p-6 mb-6 border border-dark-700">
            <OrderProgressStepper steps={steps} />
          </div>

          {/* Action Buttons */}
          {isComplete && orderId && (
            <div className="space-y-3">
              <Link
                href={`/order-confirmation/${orderId}`}
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                Voir ma commande
              </Link>
              <Link
                href="/"
                className="block w-full bg-dark-700 hover:bg-dark-600 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>
          )}

          {hasError && (
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                Réessayer
              </button>
              <Link
                href="/cart"
                className="block w-full bg-dark-700 hover:bg-dark-600 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
              >
                Retourner au panier
              </Link>
            </div>
          )}

          {/* Info text */}
          {!isComplete && !hasError && (
            <p className="text-center text-sm text-gray-500">
              Ne fermez pas cette page pendant le traitement de votre commande.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Loading fallback for Suspense
function OrderProgressLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Chargement...
          </h1>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Default export with Suspense boundary
export default function OrderProgressPage() {
  return (
    <Suspense fallback={<OrderProgressLoading />}>
      <OrderProgressContent />
    </Suspense>
  )
}
