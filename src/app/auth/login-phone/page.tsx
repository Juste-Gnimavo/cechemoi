'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CountrySelector } from '@/components/country-selector'
import { OTPInput } from '@/components/auth/otp-input'
import { AuthMessageModal, MessageType } from '@/components/auth/auth-message-modal'
import { defaultCountry, formatPhoneWithCountry, type Country } from '@/lib/countries'
import { ShieldCheck, Loader2 } from 'lucide-react'

function LoginPhoneContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/account'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry)
  const [isLoading, setIsLoading] = useState(false)

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: MessageType
    title: string
    message: string
    secondaryMessage?: string
    actionLabel?: string
    onAction?: () => void
    autoClose?: number
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  // Auto-detect country from geolocation
  useEffect(() => {
    async function detectCountry() {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()

        if (data.country_code) {
          const { getCountryByCode } = await import('@/lib/countries')
          const detectedCountry = getCountryByCode(data.country_code)
          if (detectedCountry) {
            setSelectedCountry(detectedCountry)
          }
        }
      } catch (error) {
        console.error('Error detecting country:', error)
      }
    }

    detectCountry()
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber.trim()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Numéro requis',
        message: 'Veuillez entrer votre numéro de téléphone pour continuer.',
      })
      return
    }

    setIsLoading(true)

    try {
      // Format full phone number with country code
      const fullPhone = formatPhoneWithCountry(phoneNumber, selectedCountry.dialCode)

      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          purpose: 'login',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        // Check if user needs to register
        if (data.redirectToRegister) {
          setModal({
            isOpen: true,
            type: 'warning',
            title: 'Compte non trouvé',
            message: data.error || 'Ce numéro n\'est pas encore enregistré.',
            secondaryMessage: 'Créez un compte pour commencer à commander.',
            actionLabel: 'Créer un compte',
            onAction: () => router.push('/auth/register-phone'),
          })
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Erreur',
            message: data.error || 'Erreur lors de l\'envoi du code',
          })
        }
        return
      }

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Code envoyé !',
        message: `Un code de vérification a été envoyé au ${fullPhone}`,
        secondaryMessage: 'Vérifiez vos SMS ou WhatsApp',
        autoClose: 2000,
      })
      setTimeout(() => setStep('otp'), 2000)
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format full phone number with country code
      const fullPhone = formatPhoneWithCountry(phoneNumber, selectedCountry.dialCode)

      const result = await signIn('phone-otp', {
        phone: fullPhone,
        code: otp,
        redirect: false,
      })

      if (result?.error) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Code invalide',
          message: 'Le code entré est invalide ou a expiré.',
          secondaryMessage: 'Veuillez vérifier et réessayer ou demander un nouveau code.',
        })
      } else {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Connexion réussie !',
          message: 'Bienvenue sur CÈCHÉMOI',
          secondaryMessage: 'Redirection en cours...',
          autoClose: 1500,
        })
        // Wait a moment for session to be established, then hard redirect
        await new Promise(resolve => setTimeout(resolve, 1500))
        window.location.href = callbackUrl
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get full phone number for display
  const getFullPhoneNumber = () => {
    if (!phoneNumber) return selectedCountry.dialCode
    return formatPhoneWithCountry(phoneNumber, selectedCountry.dialCode)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900 px-4">
      <div className="max-w-md w-full">
       {/* Logo & Title */}
        <div className="text-center mb-8">

          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espace Client</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Accédez à vos commandes, factures et suivez vos livraisons en temps réel
          </p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-lg p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-3 text-sm font-medium">
                  Tél / WhatsApp
                </label>
                <div className="flex gap-2">
                  {/* Country Selector */}
                  <CountrySelector
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                  />

                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow digits and spaces
                      const cleaned = e.target.value.replace(/[^\d\s]/g, '')
                      setPhoneNumber(cleaned)
                    }}
                    className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="XX XX XX XX XX"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Envoi...' : 'Recevoir le code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Code envoyé à{' '}
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {getFullPhoneNumber()}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-4 text-sm font-medium text-center">
                  Entrez le code
                </label>
                <OTPInput
                  length={4}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 4}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Vérification...' : 'Se connecter'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                Modifier le numéro
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/register-phone" className="text-primary-500 hover:text-primary-400 text-sm font-semibold">
              Créer un compte
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>

      {/* Message Modal */}
      <AuthMessageModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        secondaryMessage={modal.secondaryMessage}
        actionLabel={modal.actionLabel}
        onAction={modal.onAction}
        autoClose={modal.autoClose}
      />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
      <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
    </div>
  )
}

export default function LoginPhonePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPhoneContent />
    </Suspense>
  )
}
