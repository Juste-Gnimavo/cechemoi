'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { signIn } from 'next-auth/react'
import { X, User, Phone, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CountrySelector } from '@/components/country-selector'
import { OTPInput } from '@/components/auth/otp-input'
import { defaultCountry, formatPhoneWithCountry, type Country } from '@/lib/countries'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectTo?: string
}

type AuthMode = 'login' | 'register'
type Step = 'form' | 'otp'

export function AuthModal({ isOpen, onClose, onSuccess, redirectTo = '/checkout' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [step, setStep] = useState<Step>('form')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [otp, setOtp] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry)
  const [isLoading, setIsLoading] = useState(false)
  const [geolocation, setGeolocation] = useState<{
    ip: string
    city: string
    country: string
    countryCode: string
  } | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to avoid visual glitch during close animation
      setTimeout(() => {
        setStep('form')
        setOtp('')
      }, 300)
    }
  }, [isOpen])

  // Auto-detect country from geolocation
  useEffect(() => {
    async function detectCountry() {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()

        setGeolocation({
          ip: data.ip || '',
          city: data.city || '',
          country: data.country_name || '',
          countryCode: data.country_code || '',
        })

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

    if (isOpen) {
      detectCountry()
    }
  }, [isOpen])

  const getFullPhoneNumber = () => {
    if (!phoneNumber) return selectedCountry.dialCode
    return formatPhoneWithCountry(phoneNumber, selectedCountry.dialCode)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'register' && !firstName.trim()) {
      toast.error('Veuillez entrer votre prénom')
      return
    }

    if (!phoneNumber.trim()) {
      toast.error('Veuillez entrer votre numéro de téléphone')
      return
    }

    setIsLoading(true)

    try {
      const fullPhone = formatPhoneWithCountry(phoneNumber, selectedCountry.dialCode)

      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          purpose: mode,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        // Check if user needs to register/login
        if (mode === 'login' && data.redirectToRegister) {
          toast.error('Aucun compte trouvé. Créez un compte.')
          setMode('register')
        } else if (mode === 'register' && data.error?.includes('existe')) {
          toast.error('Ce numéro a déjà un compte. Connectez-vous.')
          setMode('login')
        } else {
          toast.error(data.error || 'Erreur lors de l\'envoi du code')
        }
        return
      }

      toast.success(data.message || 'Code envoyé!')
      setStep('otp')
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const fullPhone = formatPhoneWithCountry(phoneNumber, selectedCountry.dialCode)

      let result

      if (mode === 'login') {
        result = await signIn('phone-otp', {
          phone: fullPhone,
          code: otp,
          redirect: false,
        })
      } else {
        result = await signIn('phone-register', {
          phone: fullPhone,
          code: otp,
          name: firstName.trim(),
          whatsappNumber: fullPhone,
          ipAddress: geolocation?.ip,
          city: geolocation?.city,
          country: geolocation?.country,
          countryCode: geolocation?.countryCode,
          redirect: false,
        })
      }

      if (result?.error) {
        toast.error(mode === 'login' ? 'Code invalide ou expiré' : 'Code invalide ou inscription échouée')
      } else {
        toast.success(mode === 'login' ? 'Connexion réussie!' : 'Compte créé avec succès!')

        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 500))

        onClose()

        if (onSuccess) {
          onSuccess()
        } else {
          window.location.href = redirectTo
        }
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setStep('form')
    setOtp('')
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary-500" />
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {mode === 'login' ? 'Connexion' : 'Créer un compte'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      mode === 'login'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => switchMode('register')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      mode === 'register'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Créer un compte
                  </button>
                </div>

                {/* Form */}
                {step === 'form' ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    {/* First Name (Register only) */}
                    {mode === 'register' && (
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                          Prénom *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                            placeholder="Votre prénom"
                          />
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Numéro de téléphone *
                      </label>
                      <div className="flex gap-2">
                        <CountrySelector
                          value={selectedCountry}
                          onChange={setSelectedCountry}
                        />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d\s]/g, '')
                            setPhoneNumber(cleaned)
                          }}
                          className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                          placeholder="XX XX XX XX XX"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        'Recevoir le code SMS'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Code envoyé à{' '}
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {getFullPhoneNumber()}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-4 text-sm font-medium text-center">
                        Entrez le code à 4 chiffres
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
                      className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Vérification...
                        </>
                      ) : mode === 'login' ? (
                        'Se connecter'
                      ) : (
                        'Créer mon compte'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
                    >
                      ← Modifier le numéro
                    </button>
                  </form>
                )}

                {/* Info */}
                <p className="mt-6 text-center text-xs text-gray-500">
                  En continuant, vous acceptez nos conditions d'utilisation
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
