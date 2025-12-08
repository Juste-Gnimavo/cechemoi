'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, RefreshCw } from 'lucide-react'

function Verify2FAForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tempToken = searchParams.get('token')

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [resending, setResending] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [backupCode, setBackupCode] = useState('')

  useEffect(() => {
    if (!tempToken) {
      router.push('/auth/login')
      return
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setError('Code expiré. Veuillez vous reconnecter.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [tempToken, router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every(digit => digit) && newOtp.length === 6) {
      handleVerifyOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerifyOtp = async (code?: string) => {
    const otpCode = code || otp.join('')

    if (!otpCode || otpCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/account/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          code: otpCode,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Complete sign in
        const result = await signIn('credentials', {
          token: data.sessionToken,
          redirect: false,
        })

        if (result?.ok) {
          router.push('/admin')
        } else {
          setError('Erreur de connexion')
        }
      } else {
        setError(data.error || 'Code invalide')
        setOtp(['', '', '', '', '', ''])
        document.getElementById('otp-0')?.focus()
      }
    } catch (err) {
      setError('Erreur de vérification')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) {
      setError('Veuillez entrer un code de secours')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/account/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          backupCode: backupCode.trim().toUpperCase(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Complete sign in
        const result = await signIn('credentials', {
          token: data.sessionToken,
          redirect: false,
        })

        if (result?.ok) {
          router.push('/admin')
        } else {
          setError('Erreur de connexion')
        }
      } else {
        setError(data.error || 'Code de secours invalide')
        setBackupCode('')
      }
    } catch (err) {
      setError('Erreur de vérification')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/admin/account/2fa/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      })

      const data = await res.json()

      if (data.success) {
        setTimeLeft(300) // Reset timer
        alert('Nouveau code envoyé!')
      } else {
        setError(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi')
    } finally {
      setResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!tempToken) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo/home-page-horizontal-logo-cechemoi-white.png"
              alt="CÈCHÉMOI"
              width={220}
              height={60}
              className="mx-auto filter brightness-0"
              priority
            />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Vérification en Deux Étapes</h1>
          </div>
          <p className="text-gray-600 text-sm">
            Un code a été envoyé à votre téléphone
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {!useBackupCode ? (
            <>
              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Entrez le code à 6 chiffres
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Expire dans: <span className="font-mono font-bold text-blue-600">{formatTime(timeLeft)}</span>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 text-center">
                  {error}
                </div>
              )}

              {/* Resend Button */}
              <button
                onClick={handleResendOtp}
                disabled={resending || timeLeft === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Envoi...' : 'Renvoyer le code'}
              </button>

              {/* Backup Code Link */}
              <div className="text-center">
                <button
                  onClick={() => setUseBackupCode(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Utiliser un code de secours
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Backup Code Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de secours
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="ABCD-1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Format: XXXX-XXXX (ex: ABCD-1234)
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleVerifyBackupCode}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? 'Vérification...' : 'Vérifier le code'}
              </button>

              {/* Back Link */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setUseBackupCode(false)
                    setBackupCode('')
                    setError('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  ← Retour au code OTP
                </button>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Vous n'avez pas reçu le code ? Vérifiez vos messages SMS ou utilisez un code de secours.
            </p>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Annuler et retourner à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <Verify2FAForm />
    </Suspense>
  )
}
