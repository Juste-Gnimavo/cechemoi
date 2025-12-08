'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Shield, ArrowLeft } from 'lucide-react'
import { AuthMessageModal, MessageType } from '@/components/auth/auth-message-modal'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: MessageType
    title: string
    message: string
    secondaryMessage?: string
    actionLabel?: string
    onAction?: () => void
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Email envoyé !',
          message: 'Si un compte administrateur existe avec cette adresse email, vous recevrez un lien de réinitialisation.',
          secondaryMessage: 'Vérifiez votre boîte de réception et vos spams. Le lien expire dans 1 heure.',
          actionLabel: 'Retour à la connexion',
          onAction: () => window.location.href = '/auth/login',
        })
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
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
            <Shield className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mot de passe oublié</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-lg p-8 shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-200 dark:border-dark-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-3 text-sm font-medium">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="admin@cechemoi.com"
                />
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Cette fonctionnalité est réservée aux administrateurs uniquement. Les clients utilisent l'OTP pour se connecter.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
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
      />
    </div>
  )
}
