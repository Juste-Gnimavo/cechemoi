'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Loader2, Smartphone, X, RefreshCw, Sun, Moon } from 'lucide-react'
import { OTPInput } from '@/components/auth/otp-input'
import { AuthMessageModal, MessageType } from '@/components/auth/auth-message-modal'
import { useTheme } from '@/store/theme'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Message modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: MessageType
    title: string
    message: string
    secondaryMessage?: string
    autoClose?: number
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs',
      })
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Validate credentials and send 2FA OTP
      const response = await fetch('/api/auth/admin-2fa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.success) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erreur de connexion',
          message: data.error || 'Email ou mot de passe incorrect',
        })
        return
      }

      // Store temp token and show 2FA modal
      setTempToken(data.tempToken)
      setMaskedPhone(data.phone)
      setOtp('')
      setShow2FAModal(true)

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Code envoyé !',
        message: `Code de vérification envoyé au ${data.phone}`,
        secondaryMessage: 'Vérifiez vos SMS ou WhatsApp',
        autoClose: 2000,
      })
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e?: React.FormEvent, otpValue?: string) => {
    e?.preventDefault()

    // Use passed value or fall back to state (for form submit vs onComplete)
    const codeToVerify = otpValue || otp

    if (codeToVerify.length !== 4) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Code incomplet',
        message: 'Veuillez entrer le code à 4 chiffres',
      })
      return
    }

    setIsVerifying(true)

    try {
      // Use NextAuth to verify 2FA and create session
      const result = await signIn('admin-2fa', {
        tempToken,
        code: codeToVerify,
        redirect: false,
        callbackUrl: '/admin',
      })

      if (result?.error) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Code invalide',
          message: 'Le code entré est invalide ou a expiré',
          secondaryMessage: 'Veuillez vérifier et réessayer',
        })
        setOtp('')
      } else if (result?.ok) {
        setShow2FAModal(false)
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Connexion réussie !',
          message: 'Bienvenue dans l\'espace administration',
          secondaryMessage: 'Redirection en cours...',
          autoClose: 1500,
        })
        // Wait a moment for session to be established, then redirect to admin
        await new Promise(resolve => setTimeout(resolve, 1500))
        window.location.href = '/admin'
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)

    try {
      const response = await fetch('/api/auth/admin-2fa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.success) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erreur',
          message: data.error || 'Impossible de renvoyer le code',
        })
        return
      }

      // Update temp token
      setTempToken(data.tempToken)
      setOtp('')

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Code renvoyé !',
        message: `Nouveau code envoyé au ${data.phone}`,
        autoClose: 2000,
      })
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsResending(false)
    }
  }

  const close2FAModal = () => {
    setShow2FAModal(false)
    setTempToken('')
    setOtp('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 px-4">
      {/* Theme Toggle - Fixed position */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-md bg-white dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors shadow-lg border border-gray-200 dark:border-dark-600 z-50"
        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">

          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espace Administration</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Connexion réservée aux Administrateurs, Managers et Staff
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-dark-900 rounded-lg p-8 shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-200 dark:border-dark-800">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent transition-all"
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                <input
                  type="checkbox"
                  className="mr-2 rounded bg-gray-100 dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-primary-500 focus:ring-primary-500"
                />
                Se souvenir de moi
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-primary-500 hover:text-primary-400 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm inline-flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">Accès sécurisé avec 2FA</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Un code de vérification sera envoyé à votre téléphone après la saisie de vos identifiants.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close2FAModal} />

          {/* Modal */}
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-primary-500/30 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={close2FAModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-5">
                <Smartphone className="h-8 w-8 text-primary-400" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Vérification en deux étapes
              </h2>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
                Entrez le code envoyé au <span className="text-gray-900 dark:text-white font-medium">{maskedPhone}</span>
              </p>

              {/* OTP Form */}
              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-4 text-sm font-medium text-center">
                    Code de vérification
                  </label>
                  <OTPInput
                    length={4}
                    value={otp}
                    onChange={setOtp}
                    onComplete={(value) => handleVerify2FA(undefined, value)}
                    disabled={isVerifying}
                  />
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifying || otp.length !== 4}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Vérification...
                    </span>
                  ) : (
                    'Vérifier'
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isResending}
                    className="text-primary-500 hover:text-primary-400 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Renvoyer le code
                      </>
                    )}
                  </button>
                </div>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={close2FAModal}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2"
                >
                  Annuler et revenir à la connexion
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      <AuthMessageModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        secondaryMessage={modal.secondaryMessage}
        autoClose={modal.autoClose}
      />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminLoginContent />
    </Suspense>
  )
}
