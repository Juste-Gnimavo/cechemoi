'use client'

import { useState, useEffect } from 'react'
import { Clock, Bell, Save, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface FollowUpSettings {
  id: string
  enabled: boolean
  reminder1Delay: number
  reminder2Delay: number
  reminder3Delay: number
  reminder1Enabled: boolean
  reminder2Enabled: boolean
  reminder3Enabled: boolean
  createdAt: string
  updatedAt: string
}

interface Stats {
  pending: number
  sent: number
  cancelled: number
}

export default function PaymentFollowUpPage() {
  const [settings, setSettings] = useState<FollowUpSettings | null>(null)
  const [stats, setStats] = useState<Stats>({ pending: 0, sent: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/notifications/follow-up')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/notifications/follow-up', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Paramètres enregistrés')
        setSettings(data.settings)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const hoursToText = (hours: number): string => {
    if (hours < 24) return `${hours} heures`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days} jour${days > 1 ? 's' : ''}`
    return `${days} jour${days > 1 ? 's' : ''} et ${remainingHours}h`
  }

  if (loading || !settings) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader2 className="animate-spin h-12 w-12 text-primary-500 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary-500" />
            Relances de Paiement
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configurer les rappels automatiques pour les commandes impayées
          </p>
        </div>
        <Link
          href="/admin/notifications/settings"
          className="text-primary-500 hover:text-primary-400 text-sm"
        >
          Retour aux paramètres
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">En attente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Envoyés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Annulés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 p-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-dark-700/50 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Activer les Relances Automatiques
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Envoyer automatiquement des rappels de paiement aux clients
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings({ ...settings, enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-300 dark:bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* Reminders */}
        <div className="space-y-6">
          {/* Reminder 1 */}
          <div className={`p-4 rounded-lg border ${settings.reminder1Enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-gray-200 dark:border-dark-700/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary-500">1</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Premier Rappel</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hoursToText(settings.reminder1Delay)} après la commande
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reminder1Enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder1Enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            {settings.reminder1Enabled && (
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Délai (en heures)
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  min="1"
                  max="168"
                  value={settings.reminder1Delay}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder1Delay: parseInt(e.target.value) || 24 })
                  }
                  className="w-32 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valeur recommandée: 24 heures (1 jour)
                </p>
              </div>
            )}
          </div>

          {/* Reminder 2 */}
          <div className={`p-4 rounded-lg border ${settings.reminder2Enabled ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-gray-200 dark:border-dark-700/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-yellow-500">2</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Deuxième Rappel</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hoursToText(settings.reminder2Delay)} après la commande
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reminder2Enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder2Enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>
            {settings.reminder2Enabled && (
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Délai (en heures)
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  min="1"
                  max="336"
                  value={settings.reminder2Delay}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder2Delay: parseInt(e.target.value) || 72 })
                  }
                  className="w-32 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valeur recommandée: 72 heures (3 jours)
                </p>
              </div>
            )}
          </div>

          {/* Reminder 3 */}
          <div className={`p-4 rounded-lg border ${settings.reminder3Enabled ? 'border-red-500/30 bg-red-500/5' : 'border-gray-200 dark:border-dark-700/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-red-500">3</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Dernier Rappel</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hoursToText(settings.reminder3Delay)} après la commande
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reminder3Enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder3Enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            {settings.reminder3Enabled && (
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Délai (en heures)
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  min="1"
                  max="504"
                  value={settings.reminder3Delay}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder3Delay: parseInt(e.target.value) || 120 })
                  }
                  className="w-32 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valeur recommandée: 120 heures (5 jours)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-600 dark:text-blue-400">Comment ça marche</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                <li>Les rappels sont planifiés automatiquement à la création de chaque commande</li>
                <li>Si le client paie, tous les rappels en attente sont annulés</li>
                <li>Si la commande est annulée, les rappels sont également annulés</li>
                <li>Les rappels sont envoyés par SMS et WhatsApp simultanément</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
