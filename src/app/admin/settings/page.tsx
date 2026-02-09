'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Copy, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Settings {
  id: string
  // General
  siteName: string
  siteDescription: string | null
  siteUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string
  // Currency
  currency: string
  currencySymbol: string
  currencyPosition: string
  thousandSeparator: string
  decimalSeparator: string
  decimals: number
  taxRate: number
  pricesIncludeTax: boolean
  calculateTax: boolean
  eurToXofRate: number
  // Shipping
  freeShippingThreshold: number
  flatShippingRate: number
  shippingCalculation: string
  // Product Settings
  shopPageDisplay: string
  productsPerPage: number
  defaultSorting: string
  stockDisplayFormat: string
  lowStockThreshold: number
  outOfStockVisibility: boolean
  enableReviews: boolean
  reviewsRequirePurchase: boolean
  // Cart & Checkout
  enableGuestCheckout: boolean
  cartPageEnabled: boolean
  enableCoupons: boolean
  calculateShipping: boolean
  requirePhone: boolean
  requireEmail: boolean
  // Account & Privacy
  enableRegistration: boolean
  accountCreation: string
  privacyPolicyPage: string | null
  termsPage: string | null
  enableNewsletterSignup: boolean
  // Email
  emailFromName: string
  emailFromAddress: string | null
  enableOrderEmails: boolean
  enableWelcomeEmail: boolean
  enableLowStockEmail: boolean
  lowStockEmailRecipient: string | null
  // Permalinks
  productSlugPrefix: string | null
  categorySlugPrefix: string | null
  // API
  enableAPI: boolean
  apiKey: string | null
  enableWebhooks: boolean
  webhookUrl: string | null
  // Social
  facebookUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  whatsappNumber: string | null
  youtubeUrl: string | null
  tiktokUrl: string | null
  linkedinUrl: string | null
  pinterestUrl: string | null
  snapchatUrl: string | null
  // Maintenance
  maintenanceMode: boolean
  maintenanceMessage: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'Général' },
    { id: 'products', label: 'Produits' },
    { id: 'checkout', label: 'Panier & Paiement' },
    { id: 'account', label: 'Comptes' },
    { id: 'email', label: 'Emails' },
    { id: 'advanced', label: 'Avancé' },
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
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

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Paramètres enregistrés')
        setSettings(data.settings)
      } else {
        toast.error(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const copyApiKey = () => {
    if (settings?.apiKey) {
      navigator.clipboard.writeText(settings.apiKey)
      toast.success('Clé API copiée')
    }
  }

  const regenerateApiKey = async () => {
    if (!confirm('Régénérer la clé API ? L\'ancienne clé ne fonctionnera plus.')) return

    setSettings((prev) => prev ? { ...prev, apiKey: null } : null)
    await handleSave()
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configuration de la boutique</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de la Boutique</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom de la boutique *</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">URL du site</label>
                <input
                  type="url"
                  value={settings.siteUrl || ''}
                  onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={settings.siteDescription || ''}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email de contact</label>
                <input
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Téléphone de contact</label>
                <input
                  type="tel"
                  value={settings.contactPhone || ''}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Adresse</label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Ville</label>
                <input
                  type="text"
                  value={settings.city || ''}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Code postal</label>
                <input
                  type="text"
                  value={settings.zipCode || ''}
                  onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Région/État</label>
                <input
                  type="text"
                  value={settings.state || ''}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Pays</label>
                <input
                  type="text"
                  value={settings.country}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Devise & Taxes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Devise</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Symbole de devise</label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Position du symbole</label>
                <select
                  value={settings.currencyPosition}
                  onChange={(e) => setSettings({ ...settings, currencyPosition: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                >
                  <option value="before">Avant (ex: $100)</option>
                  <option value="after">Après (ex: 100$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nombre de décimales</label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={settings.decimals}
                  onChange={(e) => setSettings({ ...settings, decimals: parseInt(e.target.value) })}
                  min="0"
                  max="4"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Taux de change EUR → XOF</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">1 EUR =</span>
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={settings.eurToXofRate}
                    onChange={(e) => setSettings({ ...settings, eurToXofRate: parseFloat(e.target.value) || 680 })}
                    min="1"
                    step="0.01"
                    className="flex-1 bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  />
                  <span className="text-gray-500 dark:text-gray-400">XOF</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Taux fixe utilisé pour les conversions EUR/XOF</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Séparateur de milliers</label>
                <input
                  type="text"
                  value={settings.thousandSeparator}
                  onChange={(e) => setSettings({ ...settings, thousandSeparator: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Séparateur décimal</label>
                <input
                  type="text"
                  value={settings.decimalSeparator}
                  onChange={(e) => setSettings({ ...settings, decimalSeparator: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="calculateTax"
                    checked={settings.calculateTax}
                    onChange={(e) => setSettings({ ...settings, calculateTax: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="calculateTax" className="text-sm text-gray-700 dark:text-gray-300">
                    Activer le calcul des taxes
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pricesIncludeTax"
                    checked={settings.pricesIncludeTax}
                    onChange={(e) => setSettings({ ...settings, pricesIncludeTax: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="pricesIncludeTax" className="text-sm text-gray-700 dark:text-gray-300">
                    Les prix incluent la taxe
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Réseaux Sociaux</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Facebook</label>
                <input
                  type="url"
                  value={settings.facebookUrl || ''}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Instagram</label>
                <input
                  type="url"
                  value={settings.instagramUrl || ''}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Twitter/X</label>
                <input
                  type="url"
                  value={settings.twitterUrl || ''}
                  onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={settings.whatsappNumber || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="+225..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">YouTube</label>
                <input
                  type="url"
                  value={settings.youtubeUrl || ''}
                  onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">TikTok</label>
                <input
                  type="url"
                  value={settings.tiktokUrl || ''}
                  onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={settings.linkedinUrl || ''}
                  onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Pinterest</label>
                <input
                  type="url"
                  value={settings.pinterestUrl || ''}
                  onChange={(e) => setSettings({ ...settings, pinterestUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://pinterest.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Snapchat</label>
                <input
                  type="url"
                  value={settings.snapchatUrl || ''}
                  onChange={(e) => setSettings({ ...settings, snapchatUrl: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="https://snapchat.com/add/..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Affichage des Produits</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Affichage de la boutique</label>
                <select
                  value={settings.shopPageDisplay}
                  onChange={(e) => setSettings({ ...settings, shopPageDisplay: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                >
                  <option value="grid">Grille</option>
                  <option value="list">Liste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Produits par page</label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={settings.productsPerPage}
                  onChange={(e) => setSettings({ ...settings, productsPerPage: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Tri par défaut</label>
                <select
                  value={settings.defaultSorting}
                  onChange={(e) => setSettings({ ...settings, defaultSorting: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                >
                  <option value="date_desc">Plus récent</option>
                  <option value="date_asc">Plus ancien</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="name_asc">Nom (A-Z)</option>
                  <option value="name_desc">Nom (Z-A)</option>
                  <option value="popularity">Popularité</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Format d'affichage du stock</label>
                <select
                  value={settings.stockDisplayFormat}
                  onChange={(e) => setSettings({ ...settings, stockDisplayFormat: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                >
                  <option value="quantity">Quantité exacte</option>
                  <option value="in_stock_out_stock">En stock / Rupture</option>
                  <option value="hide">Masquer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Seuil de stock bas</label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
                  min="0"
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="outOfStockVisibility"
                  checked={settings.outOfStockVisibility}
                  onChange={(e) => setSettings({ ...settings, outOfStockVisibility: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="outOfStockVisibility" className="text-sm text-gray-700 dark:text-gray-300">
                  Afficher les produits en rupture de stock
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avis & Commentaires</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableReviews"
                  checked={settings.enableReviews}
                  onChange={(e) => setSettings({ ...settings, enableReviews: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableReviews" className="text-sm text-gray-700 dark:text-gray-300">
                  Activer les avis produits
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reviewsRequirePurchase"
                  checked={settings.reviewsRequirePurchase}
                  onChange={(e) => setSettings({ ...settings, reviewsRequirePurchase: e.target.checked })}
                  disabled={!settings.enableReviews}
                  className="w-4 h-4"
                />
                <label htmlFor="reviewsRequirePurchase" className="text-sm text-gray-700 dark:text-gray-300">
                  Seuls les achats vérifiés peuvent laisser un avis
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permaliens</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Préfixe URL produits</label>
                <input
                  type="text"
                  value={settings.productSlugPrefix || ''}
                  onChange={(e) => setSettings({ ...settings, productSlugPrefix: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="produit"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: /produit/nom-du-produit</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Préfixe URL catégories</label>
                <input
                  type="text"
                  value={settings.categorySlugPrefix || ''}
                  onChange={(e) => setSettings({ ...settings, categorySlugPrefix: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="catégorie"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: /catégorie/nom-catégorie</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Tab */}
      {activeTab === 'checkout' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Panier</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cartPageEnabled"
                  checked={settings.cartPageEnabled}
                  onChange={(e) => setSettings({ ...settings, cartPageEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="cartPageEnabled" className="text-sm text-gray-700 dark:text-gray-300">
                  Activer la page panier
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableCoupons"
                  checked={settings.enableCoupons}
                  onChange={(e) => setSettings({ ...settings, enableCoupons: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableCoupons" className="text-sm text-gray-700 dark:text-gray-300">
                  Activer les codes promo dans le panier
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paiement</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableGuestCheckout"
                  checked={settings.enableGuestCheckout}
                  onChange={(e) => setSettings({ ...settings, enableGuestCheckout: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableGuestCheckout" className="text-sm text-gray-700 dark:text-gray-300">
                  Autoriser le paiement sans compte
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="calculateShipping"
                  checked={settings.calculateShipping}
                  onChange={(e) => setSettings({ ...settings, calculateShipping: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="calculateShipping" className="text-sm text-gray-700 dark:text-gray-300">
                  Calculer les frais de livraison au paiement
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requirePhone"
                  checked={settings.requirePhone}
                  onChange={(e) => setSettings({ ...settings, requirePhone: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="requirePhone" className="text-sm text-gray-700 dark:text-gray-300">
                  Téléphone obligatoire au paiement
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireEmail"
                  checked={settings.requireEmail}
                  onChange={(e) => setSettings({ ...settings, requireEmail: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="requireEmail" className="text-sm text-gray-700 dark:text-gray-300">
                  Email obligatoire au paiement
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Livraison</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Calcul de livraison</label>
                <select
                  value={settings.shippingCalculation}
                  onChange={(e) => setSettings({ ...settings, shippingCalculation: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                >
                  <option value="per_order">Par commande</option>
                  <option value="per_item">Par article</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comptes Clients</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableRegistration"
                  checked={settings.enableRegistration}
                  onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableRegistration" className="text-sm text-gray-700 dark:text-gray-300">
                  Autoriser l'inscription des clients
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Création de compte au paiement</label>
                <select
                  value={settings.accountCreation}
                  onChange={(e) => setSettings({ ...settings, accountCreation: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                >
                  <option value="optional">Optionnelle</option>
                  <option value="required">Obligatoire</option>
                  <option value="disabled">Désactivée</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableNewsletterSignup"
                  checked={settings.enableNewsletterSignup}
                  onChange={(e) => setSettings({ ...settings, enableNewsletterSignup: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableNewsletterSignup" className="text-sm text-gray-700 dark:text-gray-300">
                  Activer l'inscription à la newsletter
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confidentialité</h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Page politique de confidentialité</label>
                <input
                  type="text"
                  value={settings.privacyPolicyPage || ''}
                  onChange={(e) => setSettings({ ...settings, privacyPolicyPage: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="/privacy-policy"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Page conditions d'utilisation</label>
                <input
                  type="text"
                  value={settings.termsPage || ''}
                  onChange={(e) => setSettings({ ...settings, termsPage: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="/terms"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration Email</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom de l'expéditeur</label>
                <input
                  type="text"
                  value={settings.emailFromName}
                  onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email de l'expéditeur</label>
                <input
                  type="email"
                  value={settings.emailFromAddress || ''}
                  onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                  placeholder="noreply@cechemoi.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications Email</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableOrderEmails"
                  checked={settings.enableOrderEmails}
                  onChange={(e) => setSettings({ ...settings, enableOrderEmails: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableOrderEmails" className="text-sm text-gray-700 dark:text-gray-300">
                  Envoyer les emails de confirmation de commande
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableWelcomeEmail"
                  checked={settings.enableWelcomeEmail}
                  onChange={(e) => setSettings({ ...settings, enableWelcomeEmail: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableWelcomeEmail" className="text-sm text-gray-700 dark:text-gray-300">
                  Envoyer un email de bienvenue aux nouveaux clients
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableLowStockEmail"
                  checked={settings.enableLowStockEmail}
                  onChange={(e) => setSettings({ ...settings, enableLowStockEmail: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableLowStockEmail" className="text-sm text-gray-700 dark:text-gray-300">
                  Alertes email pour stock bas
                </label>
              </div>

              {settings.enableLowStockEmail && (
                <div className="ml-6">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email pour alertes stock</label>
                  <input
                    type="email"
                    value={settings.lowStockEmailRecipient || ''}
                    onChange={(e) => setSettings({ ...settings, lowStockEmailRecipient: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                    placeholder="admin@cechemoi.com"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableAPI"
                  checked={settings.enableAPI}
                  onChange={(e) => setSettings({ ...settings, enableAPI: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableAPI" className="text-sm text-gray-700 dark:text-gray-300">
                  Activer l'API REST
                </label>
              </div>

              {settings.enableAPI && settings.apiKey && (
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Clé API</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.apiKey}
                      readOnly
                      className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg font-mono text-sm border border-gray-200 dark:border-transparent"
                    />
                    <button
                      onClick={copyApiKey}
                      className="p-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={regenerateApiKey}
                      className="p-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhooks</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableWebhooks"
                  checked={settings.enableWebhooks}
                  onChange={(e) => setSettings({ ...settings, enableWebhooks: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableWebhooks" className="text-sm text-gray-700 dark:text-gray-300">
                  Activer les webhooks
                </label>
              </div>

              {settings.enableWebhooks && (
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">URL du webhook</label>
                  <input
                    type="url"
                    value={settings.webhookUrl || ''}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                    placeholder="https://example.com/webhook"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maintenance</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="maintenanceMode" className="text-sm text-gray-700 dark:text-gray-300">
                  Mode maintenance
                </label>
              </div>

              {settings.maintenanceMode && (
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Message de maintenance</label>
                  <textarea
                    value={settings.maintenanceMessage || ''}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                    placeholder="La boutique est temporairement fermée pour maintenance..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
