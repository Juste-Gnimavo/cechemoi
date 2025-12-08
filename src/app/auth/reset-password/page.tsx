'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react'
import { AuthMessageModal, MessageType } from '@/components/auth/auth-message-modal'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

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

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    if (!token) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Token manquant',
        message: 'Le lien de réinitialisation est invalide.',
        actionLabel: 'Demander un nouveau lien',
        onAction: () => router.push('/auth/forgot-password'),
      })
      setValidating(false)
      return
    }

    try {
      const res = await fetch(`/api/auth/reset-password?token=${token}`)
      const data = await res.json()

      if (data.valid) {
        setTokenValid(true)
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Lien invalide',
          message: data.error || 'Ce lien de réinitialisation est invalide ou a expiré.',
          actionLabel: 'Demander un nouveau lien',
          onAction: () => router.push('/auth/forgot-password'),
        })
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Erreur de validation du lien',
        actionLabel: 'Demander un nouveau lien',
        onAction: () => router.push('/auth/forgot-password'),
      })
    } finally {
      setValidating(false)
    }
  }

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'bg-gray-700', width: 0 }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength <= 2) return { label: 'Faible', color: 'bg-red-500', width: 33 }
    if (strength <= 3) return { label: 'Moyen', color: 'bg-yellow-500', width: 66 }
    return { label: 'Fort', color: 'bg-green-500', width: 100 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      return
    }

    if (password !== confirmPassword) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Mots de passe différents',
        message: 'Les mots de passe ne correspondent pas.',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Mot de passe réinitialisé !',
          message: 'Votre mot de passe a été modifié avec succès.',
          secondaryMessage: 'Redirection vers la page de connexion...',
          autoClose: 3000,
        })
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erreur',
          message: data.error || 'Une erreur est survenue',
        })
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Erreur de connexion. Veuillez réessayer.',
      })
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength()

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Validation du lien...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-8 shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-200 dark:border-dark-800">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-5">
              <Shield className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-500 dark:text-red-400 mb-3">
              Lien invalide
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo/home-page-horizontal-logo-vin-cave-express-abidjan-white.png"
              alt="Cave Express"
              width={220}
              height={60}
              className="mx-auto dark:brightness-100 brightness-0"
              priority
            />
          </Link>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau mot de passe</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-lg p-8 shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-200 dark:border-dark-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-3 text-sm font-medium">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-12 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Minimum 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Force du mot de passe:</span>
                    <span className={`font-medium ${
                      strength.label === 'Fort' ? 'text-green-500 dark:text-green-400' :
                      strength.label === 'Moyen' ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.width}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-3 text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Confirmez votre mot de passe"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2">Les mots de passe ne correspondent pas</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 dark:text-green-400 text-xs mt-2">Les mots de passe correspondent</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 text-sm font-semibold flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
