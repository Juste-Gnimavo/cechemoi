'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Phone, MessageSquare, Mail, Key } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NotificationSettings {
  id: string
  adminPhones: string[]
  adminEmails: string[]
  smsEnabled: boolean
  whatsappEnabled: boolean
  emailEnabled: boolean
  failoverEnabled: boolean
  failoverOrder: string[]
  testMode: boolean
  testPhone: string | null
  smsProviderApiKey: string | null
  smsProviderSenderId: string | null
  whatsappProviderApiKey: string | null
  whatsappPhoneId: string | null
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/notifications/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Paramètres enregistrés')
        fetchSettings()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPhone = () => {
    if (!newPhone.trim()) {
      toast.error('Veuillez entrer un numéro de téléphone')
      return
    }

    if (!settings) return

    if (settings.adminPhones.includes(newPhone)) {
      toast.error('Ce numéro existe déjà')
      return
    }

    setSettings({
      ...settings,
      adminPhones: [...settings.adminPhones, newPhone],
    })
    setNewPhone('')
  }

  const handleRemovePhone = (phone: string) => {
    if (!settings) return

    setSettings({
      ...settings,
      adminPhones: settings.adminPhones.filter((p) => p !== phone),
    })
  }

  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      toast.error('Veuillez entrer une adresse email')
      return
    }

    if (!settings) return

    if (settings.adminEmails.includes(newEmail)) {
      toast.error('Cette adresse existe déjà')
      return
    }

    setSettings({
      ...settings,
      adminEmails: [...settings.adminEmails, newEmail],
    })
    setNewEmail('')
  }

  const handleRemoveEmail = (email: string) => {
    if (!settings) return

    setSettings({
      ...settings,
      adminEmails: settings.adminEmails.filter((e) => e !== email),
    })
  }

  if (loading || !settings) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Paramètres de Notifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configurer les paramètres de notifications SMS et WhatsApp
        </p>
      </div>

      <div className="space-y-6">
        {/* Admin Recipients */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-6 border border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Destinataires Admin
          </h2>

          {/* Admin Phones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Numéros de Téléphone
            </label>
            <div className="space-y-2 mb-3">
              {settings.adminPhones.map((phone) => (
                <div key={phone} className="flex items-center justify-between bg-gray-100 dark:bg-dark-800 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{phone}</span>
                  <button
                    onClick={() => handleRemovePhone(phone)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+2250759545410"
                className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddPhone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Admin Emails */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Adresses Email
            </label>
            <div className="space-y-2 mb-3">
              {settings.adminEmails.map((email) => (
                <div key={email} className="flex items-center justify-between bg-gray-100 dark:bg-dark-800 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@cechemoi.com"
                className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Channel Settings */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-6 border border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Canaux de Notification
          </h2>

          <div className="space-y-4">
            {/* SMS Channel */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-800/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">SMS (SMSing)</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, smsEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/25 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.smsProviderApiKey || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, smsProviderApiKey: e.target.value })
                    }
                    placeholder="Votre clé API SMSing"
                    className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    value={settings.smsProviderSenderId || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, smsProviderSenderId: e.target.value })
                    }
                    placeholder="CECHEMOI"
                    className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Channel */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-800/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp (SMSing)</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.whatsappEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/25 dark:peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.whatsappProviderApiKey || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappProviderApiKey: e.target.value })
                    }
                    placeholder="Votre clé API WhatsApp"
                    className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone ID / Number
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappPhoneId || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappPhoneId: e.target.value })
                    }
                    placeholder="+2250759545410"
                    className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Email Channel (Future) */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-800/50 opacity-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Email (Bientôt)</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailEnabled}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                L'envoi de notifications par email sera disponible prochainement.
              </p>
            </div>
          </div>
        </div>

        {/* Failover Settings */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-6 border border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Paramètres de Basculement
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activer le Basculement Automatique
                </label>
                <p className="text-xs text-gray-500">
                  Basculer automatiquement vers un autre canal en cas d'échec
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.failoverEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, failoverEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/25 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.failoverEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordre de Basculement
                </label>
                <div className="bg-gray-100 dark:bg-dark-800 p-3 rounded border border-gray-200 dark:border-dark-600">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    1. <strong className="text-gray-900 dark:text-white">WhatsApp</strong> (prioritaire)
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    2. <strong className="text-gray-900 dark:text-white">SMS</strong> (si WhatsApp échoue)
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    3. <strong className="text-gray-900 dark:text-white">WhatsApp Cloud</strong> (dernière option)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Mode */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-6 border border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mode Test</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activer le Mode Test
                </label>
                <p className="text-xs text-gray-500">
                  Toutes les notifications seront envoyées uniquement au numéro de test
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.testMode}
                  onChange={(e) =>
                    setSettings({ ...settings, testMode: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/25 dark:peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {settings.testMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numéro de Test
                </label>
                <input
                  type="tel"
                  value={settings.testPhone || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, testPhone: e.target.value })
                  }
                  placeholder="+2250759545410"
                  className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Toutes les notifications seront envoyées à ce numéro en mode test
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer les Paramètres
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
