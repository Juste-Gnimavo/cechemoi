'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Settings as SettingsIcon, Bell, Mail, MessageSquare, Globe, ShoppingBag, Gift } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface SettingsData {
  emailNotifications: boolean
  smsNotifications: boolean
  whatsappNotifications: boolean
  marketingEmails: boolean
  orderUpdates: boolean
  promotions: boolean
  language: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/settings')
      return
    }

    if (!session) return

    fetchSettings()
  }, [session, router, status])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: keyof SettingsData, value: boolean) => {
    if (!settings) return

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    setSaving(true)
    try {
      const res = await fetch('/api/account/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (res.ok) {
        toast.success('Paramètres mis à jour')
      } else {
        // Revert on error
        setSettings(settings)
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      // Revert on error
      setSettings(settings)
      console.error('Error updating settings:', error)
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const handleLanguageChange = async (language: string) => {
    if (!settings) return

    const newSettings = { ...settings, language }
    setSettings(newSettings)

    setSaving(true)
    try {
      const res = await fetch('/api/account/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      })

      if (res.ok) {
        toast.success('Langue mise à jour')
      } else {
        setSettings(settings)
        toast.error('Erreur')
      }
    } catch (error) {
      setSettings(settings)
      console.error('Error updating language:', error)
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Gérez vos préférences et notifications
              </p>
            </div>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          <div className="space-y-6">
            {/* Language Settings */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary-500" />
                Langue
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Langue de l'interface
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={saving}
                    className="w-full md:w-64 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500 disabled:opacity-50"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-500" />
                Canaux de notification
              </h2>

              <div className="space-y-4">
                <ToggleSetting
                  icon={<Mail className="h-5 w-5" />}
                  title="Notifications par email"
                  description="Recevez des notifications par email"
                  enabled={settings.emailNotifications}
                  onChange={(value) => handleToggle('emailNotifications', value)}
                  disabled={saving}
                />

                <ToggleSetting
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Notifications par SMS"
                  description="Recevez des notifications par SMS"
                  enabled={settings.smsNotifications}
                  onChange={(value) => handleToggle('smsNotifications', value)}
                  disabled={saving}
                />

                <ToggleSetting
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Notifications WhatsApp"
                  description="Recevez des notifications via WhatsApp"
                  enabled={settings.whatsappNotifications}
                  onChange={(value) => handleToggle('whatsappNotifications', value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Notification Types */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary-500" />
                Types de notifications
              </h2>

              <div className="space-y-4">
                <ToggleSetting
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title="Mises à jour de commandes"
                  description="Confirmation, expédition, livraison de vos commandes"
                  enabled={settings.orderUpdates}
                  onChange={(value) => handleToggle('orderUpdates', value)}
                  disabled={saving}
                />

                <ToggleSetting
                  icon={<Gift className="h-5 w-5" />}
                  title="Promotions et nouveautés"
                  description="Offres spéciales, nouveaux produits"
                  enabled={settings.promotions}
                  onChange={(value) => handleToggle('promotions', value)}
                  disabled={saving}
                />

                <ToggleSetting
                  icon={<Mail className="h-5 w-5" />}
                  title="Emails marketing"
                  description="Newsletters, conseils et actualités"
                  enabled={settings.marketingEmails}
                  onChange={(value) => handleToggle('marketingEmails', value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Actions du compte</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Télécharger mes données</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Obtenez une copie de toutes vos données
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm">
                    Télécharger
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Supprimer mon compte</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Cette action est irréversible
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

interface ToggleSettingProps {
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function ToggleSetting({ icon, title, description, enabled, onChange, disabled }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-gray-900 dark:text-white font-medium">{title}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
      </label>
    </div>
  )
}
