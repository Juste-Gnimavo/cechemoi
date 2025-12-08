'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, UserPlus, Loader2 } from 'lucide-react'
import { CountrySelector } from '@/components/country-selector'
import { OTPInput } from '@/components/auth/otp-input'
import { AuthMessageModal, MessageType } from '@/components/auth/auth-message-modal'
import { defaultCountry, formatPhoneWithCountry, type Country } from '@/lib/countries'
import { useConfetti } from '@/hooks/useConfetti'

function RegisterPhoneContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/account'
  const { welcome } = useConfetti()

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [formData, setFormData] = useState({
    firstName: '',
    phoneNumber: '', // Without country code
    otp: '',
  })
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry)
  const [geolocation, setGeolocation] = useState<{
    ip: string
    city: string
    country: string
    countryCode: string
  } | null>(null)
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

  // Fetch user's geolocation on component mount
  useEffect(() => {
    async function fetchGeolocation() {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()

        setGeolocation({
          ip: data.ip || '',
          city: data.city || '',
          country: data.country_name || '',
          countryCode: data.country_code || '',
        })

        // Auto-select country based on geolocation if available
        if (data.country_code) {
          const { getCountryByCode } = await import('@/lib/countries')
          const detectedCountry = getCountryByCode(data.country_code)
          if (detectedCountry) {
            setSelectedCountry(detectedCountry)
          }
        }
      } catch (error) {
        console.error('Error fetching geolocation:', error)
      }
    }

    fetchGeolocation()
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Prénom requis',
        message: 'Veuillez entrer votre prénom pour continuer.',
      })
      return
    }

    if (!formData.phoneNumber.trim()) {
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
      const fullPhone = formatPhoneWithCountry(formData.phoneNumber, selectedCountry.dialCode)

      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          purpose: 'register',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erreur',
          message: data.error || 'Erreur lors de l\'envoi du code',
        })
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format full phone number with country code
      const fullPhone = formatPhoneWithCountry(formData.phoneNumber, selectedCountry.dialCode)

      const result = await signIn('phone-register', {
        phone: fullPhone,
        code: formData.otp,
        name: formData.firstName.trim(),
        whatsappNumber: fullPhone, // Same as phone
        // Pass geolocation data
        ipAddress: geolocation?.ip,
        city: geolocation?.city,
        country: geolocation?.country,
        countryCode: geolocation?.countryCode,
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
        // Fire welcome confetti!
        welcome()
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Compte créé !',
          message: `Bienvenue ${formData.firstName} sur CÈCHÉMOI`,
          secondaryMessage: 'Redirection vers votre espace client...',
        })
        // Wait a moment for session to be established, then redirect
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 2000)
        return // Exit early to prevent finally block from resetting loading state
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la création du compte.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get full phone number for display
  const getFullPhoneNumber = () => {
    if (!formData.phoneNumber) return selectedCountry.dialCode
    return formatPhoneWithCountry(formData.phoneNumber, selectedCountry.dialCode)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo/home-page-horizontal-logo-cechemoi-white.png"
              alt="CÈCHÉMOI"
              width={220}
              height={60}
              className="mx-auto dark:brightness-100 brightness-0"
              priority
            />
          </Link>

          <div className="flex items-center justify-center gap-2 mb-2">
            <UserPlus className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer un compte</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Rejoignez CÈCHÉMOI et profitez de nos offres exclusives
          </p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-lg p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
          {step === 'form' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {/* First Name */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Votre prénom"
                  />
                </div>
              </div>

              {/* Phone Number with Country Selector */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                  Numéro de téléphone *
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
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // Only allow digits and spaces
                      const cleaned = e.target.value.replace(/[^\d\s]/g, '')
                      setFormData({ ...formData, phoneNumber: cleaned })
                    }}
                    className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="XX XX XX XX XX"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Envoi...' : 'Recevoir le code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleRegister} className="space-y-6">
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
                  value={formData.otp}
                  onChange={(otp) => setFormData({ ...formData, otp })}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.otp.length !== 4}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                ← Modifier
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login-phone"
              className="text-primary-500 hover:text-primary-400 text-sm font-semibold"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
            ← Retour
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

export default function RegisterPhonePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterPhoneContent />
    </Suspense>
  )
}
