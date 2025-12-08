'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShieldCheck, Copy, Check, AlertTriangle } from 'lucide-react'

export default function SecuritySettingsPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorPhone, setTwoFactorPhone] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Form state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    fetchSecuritySettings()
  }, [])

  const fetchSecuritySettings = async () => {
    try {
      const res = await fetch('/api/admin/account/security')
      const data = await res.json()

      if (data.success) {
        setTwoFactorEnabled(data.twoFactorEnabled)
        setTwoFactorPhone(data.twoFactorPhone || '')
        setPhoneNumber(data.twoFactorPhone || (session?.user as any)?.phone || '')
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!phoneNumber) {
      alert('Veuillez entrer un numéro de téléphone')
      return
    }

    setEnabling(true)
    try {
      const res = await fetch('/api/admin/account/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      })

      const data = await res.json()

      if (data.success) {
        setTwoFactorEnabled(true)
        setTwoFactorPhone(phoneNumber)
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        alert('2FA activé avec succès!')

        // Update session
        await update()
      } else {
        alert(data.error || 'Erreur lors de l\'activation')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      alert('Erreur lors de l\'activation')
    } finally {
      setEnabling(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!confirmPassword) {
      alert('Veuillez entrer votre mot de passe pour confirmer')
      return
    }

    const confirm = window.confirm(
      'Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ? Cela rendra votre compte moins sécurisé.'
    )

    if (!confirm) return

    setDisabling(true)
    try {
      const res = await fetch('/api/admin/account/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: confirmPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setTwoFactorEnabled(false)
        setTwoFactorPhone('')
        setBackupCodes([])
        setConfirmPassword('')
        alert('2FA désactivé')

        // Update session
        await update()
      } else {
        alert(data.error || 'Erreur lors de la désactivation')
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      alert('Erreur lors de la désactivation')
    } finally {
      setDisabling(false)
    }
  }

  const handleGenerateNewCodes = async () => {
    const confirm = window.confirm(
      'Générer de nouveaux codes de secours invalidera les anciens. Êtes-vous sûr ?'
    )

    if (!confirm) return

    setGenerating(true)
    try {
      const res = await fetch('/api/admin/account/2fa/backup-codes', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setCopiedCodes(false)
        alert('Nouveaux codes générés!')
      } else {
        alert(data.error || 'Erreur lors de la génération')
      }
    } catch (error) {
      console.error('Error generating codes:', error)
      alert('Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sécurité du Compte</h1>
        <p className="text-gray-500 dark:text-gray-400">Gérez l'authentification à deux facteurs (2FA)</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* 2FA Status Card */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-6 border border-gray-200 dark:border-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${twoFactorEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <ShieldCheck className={`h-6 w-6 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Authentification à Deux Facteurs</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {twoFactorEnabled ? 'Activée' : 'Désactivée'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              twoFactorEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {twoFactorEnabled ? 'Actif' : 'Inactif'}
            </div>
          </div>

          {twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  🔒 Votre compte est protégé par 2FA. Un code OTP sera envoyé au <strong>{twoFactorPhone}</strong> lors de chaque connexion.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe pour désactiver
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                />
                <button
                  onClick={handleDisable2FA}
                  disabled={disabling}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disabling ? 'Désactivation...' : 'Désactiver 2FA'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Votre compte n'est pas protégé par l'authentification à deux facteurs. Activez-la pour renforcer la sécurité.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Numéro de téléphone pour OTP *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2250709757296"
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Un code OTP sera envoyé à ce numéro lors de chaque connexion
                </p>
                <button
                  onClick={handleEnable2FA}
                  disabled={enabling}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enabling ? 'Activation...' : 'Activer 2FA'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Backup Codes */}
        {twoFactorEnabled && (
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-6 border border-gray-200 dark:border-transparent">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Codes de Secours</h2>

            {showBackupCodes && backupCodes.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    ⚠️ Sauvegardez ces codes dans un endroit sûr. Chaque code ne peut être utilisé qu'une seule fois.
                  </p>
                  <div className="bg-white p-4 rounded border border-blue-300 font-mono text-sm grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gray-400">{index + 1}.</span>
                        <span className="font-semibold">{code}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={copyBackupCodes}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copié!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copier les codes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Les codes de secours vous permettent de vous connecter si vous n'avez pas accès à votre téléphone.
                </p>
                <button
                  onClick={handleGenerateNewCodes}
                  disabled={generating}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Génération...' : 'Générer de Nouveaux Codes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-gray-50 dark:bg-dark-800/50 rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Comment fonctionne 2FA ?</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-2">
              <span>1.</span>
              <span>Vous entrez votre email et mot de passe normalement</span>
            </li>
            <li className="flex gap-2">
              <span>2.</span>
              <span>Un code OTP est envoyé à votre téléphone par SMS</span>
            </li>
            <li className="flex gap-2">
              <span>3.</span>
              <span>Vous entrez le code pour finaliser la connexion</span>
            </li>
            <li className="flex gap-2">
              <span>4.</span>
              <span>Si vous n'avez pas accès à votre téléphone, utilisez un code de secours</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
