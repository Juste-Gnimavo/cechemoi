'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ConfirmationModal, useConfirmationModal } from '@/components/admin/confirmation-modal'
import {
  Bell,
  Send,
  Users,
  User,
  MapPin,
  Trophy,
  Smartphone,
  Clock,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

type TargetType = 'ALL_USERS' | 'SPECIFIC_USERS' | 'BY_TIER' | 'BY_LOCATION'

export default function PushNotificationPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [deviceCount, setDeviceCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const { modal, hideModal, showSuccess, showWarning, showError } = useConfirmationModal()

  // Form state
  const [campaignName, setCampaignName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [deepLink, setDeepLink] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('ALL_USERS')
  const [targetUserIds, setTargetUserIds] = useState<string[]>([])
  const [targetTier, setTargetTier] = useState<string>('')
  const [targetCity, setTargetCity] = useState<string>('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [sendNow, setSendNow] = useState(true)

  // Users for specific targeting
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])

  // Available cities for targeting
  const cities = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

  // Deep link presets
  const deepLinkPresets = [
    { label: 'Accueil', value: 'caveexpress://home' },
    { label: 'Catalogue', value: 'caveexpress://catalogue' },
    { label: 'Panier', value: 'caveexpress://cart' },
    { label: 'Mes commandes', value: 'caveexpress://orders' },
    { label: 'Fidélité', value: 'caveexpress://loyalty' },
  ]

  // Fetch stats on load
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [customersRes] = await Promise.all([
        fetch('/api/admin/customers?limit=1'),
      ])
      const customersData = await customersRes.json()
      setUserCount(customersData.pagination?.totalCount || 0)
      // Device count would come from a separate endpoint
      setDeviceCount(Math.floor((customersData.pagination?.totalCount || 0) * 0.7)) // Estimate
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      setSearchResults(data.customers || [])
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const addUser = (user: any) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
      setTargetUserIds([...targetUserIds, user.id])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
    setTargetUserIds(targetUserIds.filter(id => id !== userId))
  }

  const getEstimatedRecipients = () => {
    switch (targetType) {
      case 'ALL_USERS':
        return deviceCount
      case 'SPECIFIC_USERS':
        return selectedUsers.length
      case 'BY_TIER':
        return Math.floor(deviceCount * 0.3) // Estimate
      case 'BY_LOCATION':
        return Math.floor(deviceCount * 0.5) // Estimate
      default:
        return 0
    }
  }

  const validateForm = (): boolean => {
    if (!campaignName.trim()) {
      showError('Champ requis', 'Veuillez saisir un nom de campagne')
      return false
    }
    if (!title.trim()) {
      showError('Champ requis', 'Veuillez saisir un titre')
      return false
    }
    if (title.length > 65) {
      showError('Titre trop long', 'Le titre ne doit pas dépasser 65 caractères')
      return false
    }
    if (!body.trim()) {
      showError('Champ requis', 'Veuillez saisir un message')
      return false
    }
    if (body.length > 240) {
      showError('Message trop long', 'Le message ne doit pas dépasser 240 caractères')
      return false
    }
    if (targetType === 'SPECIFIC_USERS' && selectedUsers.length === 0) {
      showError('Aucun destinataire', 'Veuillez sélectionner au moins un utilisateur')
      return false
    }
    if (targetType === 'BY_TIER' && !targetTier) {
      showError('Niveau requis', 'Veuillez sélectionner un niveau de fidélité')
      return false
    }
    if (targetType === 'BY_LOCATION' && !targetCity) {
      showError('Ville requise', 'Veuillez sélectionner une ville')
      return false
    }
    return true
  }

  const handleSend = async () => {
    if (!validateForm()) return

    showWarning(
      'Confirmer l\'envoi',
      `Vous êtes sur le point d'envoyer une notification push à environ ${getEstimatedRecipients()} appareils. Continuer ?`,
      sendCampaign,
      {
        confirmText: 'Envoyer',
        cancelText: 'Annuler',
      }
    )
  }

  const sendCampaign = async () => {
    hideModal()
    setSending(true)

    try {
      const res = await fetch('/api/admin/campaigns/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          title,
          body,
          imageUrl: imageUrl || null,
          deepLink: deepLink || null,
          targetType,
          targetUserIds: targetType === 'SPECIFIC_USERS' ? targetUserIds : [],
          targetTier: targetType === 'BY_TIER' ? targetTier : null,
          targetCity: targetType === 'BY_LOCATION' ? targetCity : null,
          scheduledFor: !sendNow && scheduledFor ? scheduledFor : null,
          sendNow,
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (data.sent) {
          showSuccess(
            'Notification envoyée',
            `La notification a été envoyée à ${data.stats?.success || 0} appareil(s).`,
            {
              autoClose: 5,
              redirectUrl: '/admin/campaigns/reports',
              onConfirm: () => router.push('/admin/campaigns/reports'),
            }
          )
        } else if (data.sendError) {
          showError(
            'Campagne créée (envoi échoué)',
            `La campagne a été créée mais l'envoi a échoué: ${data.sendError}`
          )
        } else {
          showSuccess(
            'Campagne créée',
            sendNow ? 'La campagne sera envoyée prochainement.' : 'La campagne a été programmée.',
            {
              autoClose: 5,
              redirectUrl: '/admin/campaigns/reports',
              onConfirm: () => router.push('/admin/campaigns/reports'),
            }
          )
        }
      } else {
        showError('Erreur', data.error || 'Erreur lors de la création de la campagne')
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      showError('Erreur', 'Erreur lors de l\'envoi de la campagne')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg">
              <Bell className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Push</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Envoyez des notifications push à vos clients sur l'application mobile
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Appareils enregistrés</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{deviceCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-500 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{userCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Destinataires estimés</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getEstimatedRecipients().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Name */}
            <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détails de la campagne</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom de la campagne *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Ex: Promo Noël 2025"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notification Content */}
            <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contenu de la notification</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titre * <span className="text-gray-500">({title.length}/65)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Offre spéciale !"
                    maxLength={65}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message * <span className="text-gray-500">({body.length}/240)</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Ex: Profitez de -20% sur tous les vins ce weekend !"
                    maxLength={240}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ImageIcon className="h-4 w-4 inline mr-1" />
                    Image (URL) - Optionnel
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Lien de destination - Optionnel
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={deepLink}
                      onChange={(e) => setDeepLink(e.target.value)}
                      placeholder="caveexpress://products/wine-id"
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <select
                      value=""
                      onChange={(e) => setDeepLink(e.target.value)}
                      className="px-3 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Préréglages</option>
                      {deepLinkPresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audience cible</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setTargetType('ALL_USERS')}
                    className={`p-4 rounded-lg border transition-colors ${
                      targetType === 'ALL_USERS'
                        ? 'bg-primary-100 dark:bg-primary-500/20 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Users className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm">Tous</span>
                  </button>
                  <button
                    onClick={() => setTargetType('SPECIFIC_USERS')}
                    className={`p-4 rounded-lg border transition-colors ${
                      targetType === 'SPECIFIC_USERS'
                        ? 'bg-primary-100 dark:bg-primary-500/20 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <User className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm">Spécifiques</span>
                  </button>
                  <button
                    onClick={() => setTargetType('BY_TIER')}
                    className={`p-4 rounded-lg border transition-colors ${
                      targetType === 'BY_TIER'
                        ? 'bg-primary-100 dark:bg-primary-500/20 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Trophy className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm">Par niveau</span>
                  </button>
                  <button
                    onClick={() => setTargetType('BY_LOCATION')}
                    className={`p-4 rounded-lg border transition-colors ${
                      targetType === 'BY_LOCATION'
                        ? 'bg-primary-100 dark:bg-primary-500/20 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <MapPin className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm">Par ville</span>
                  </button>
                </div>

                {/* Specific Users Search */}
                {targetType === 'SPECIFIC_USERS' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          searchUsers(e.target.value)
                        }}
                        placeholder="Rechercher un client par nom ou téléphone..."
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {searchResults.map(user => (
                            <button
                              key={user.id}
                              onClick={() => addUser(user)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-900 dark:text-white"
                            >
                              <span className="font-medium">{user.name || 'Sans nom'}</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">{user.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                          <span
                            key={user.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-full text-sm"
                          >
                            {user.name || user.phone}
                            <button
                              onClick={() => removeUser(user.id)}
                              className="hover:text-red-500 dark:hover:text-red-400"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tier Selection */}
                {targetType === 'BY_TIER' && (
                  <div className="grid grid-cols-4 gap-3">
                    {tiers.map(tier => (
                      <button
                        key={tier}
                        onClick={() => setTargetTier(tier)}
                        className={`p-3 rounded-lg border transition-colors ${
                          targetTier === tier
                            ? 'bg-primary-100 dark:bg-primary-500/20 border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                )}

                {/* City Selection */}
                {targetType === 'BY_LOCATION' && (
                  <select
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner une ville</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Planification</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={sendNow}
                      onChange={() => setSendNow(true)}
                      className="text-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">Envoyer maintenant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!sendNow}
                      onChange={() => setSendNow(false)}
                      className="text-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">Planifier</span>
                  </label>
                </div>
                {!sendNow && (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Mobile Preview */}
              <div className="bg-white/80 dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aperçu</h2>
                <div className="flex justify-center">
                  {/* iOS Style Notification Preview */}
                  <div className="w-full max-w-xs">
                    <div className="bg-gray-100 dark:bg-gray-200 rounded-2xl p-3 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg">W</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 text-sm">Cave Express</span>
                            <span className="text-gray-500 text-xs">maintenant</span>
                          </div>
                          <p className="font-medium text-gray-900 text-sm mt-0.5 line-clamp-1">
                            {title || 'Titre de la notification'}
                          </p>
                          <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">
                            {body || 'Message de la notification...'}
                          </p>
                        </div>
                      </div>
                      {imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden bg-gray-200 h-32 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sending || !title || !body}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-colors ${
                  sending || !title || !body
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {sendNow ? 'Envoyer maintenant' : 'Programmer'}
                  </>
                )}
              </button>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Conseils</p>
                    <ul className="list-disc list-inside text-blue-600 dark:text-blue-200 space-y-1">
                      <li>Gardez le titre court et accrocheur</li>
                      <li>Utilisez des emojis pour attirer l'attention</li>
                      <li>Incluez un appel à l'action clair</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal {...modal} onClose={hideModal} />
    </div>
  )
}
