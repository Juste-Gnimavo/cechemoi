'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { parsePhoneNumbers, getParseResultMessage, PhoneParseResult } from '@/lib/phone-parser'
import { IPhoneMessagePreview } from '@/components/admin/iphone-message-preview'
import { ConfirmationModal, useConfirmationModal } from '@/components/admin/confirmation-modal'

// Site URL for full URLs (WhatsApp needs absolute URLs)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cave-express.ci'

interface MediaFile {
  id: string
  name: string
  url: string
  fullUrl: string
  category: string
  type: string
  size: number
  createdAt: string
}

export default function WhatsAppCampaignPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [customerCount, setCustomerCount] = useState(0)
  const { modal, hideModal, showSuccess, showWarning, showError } = useConfirmationModal()

  // Form state
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'custom'>('all')
  const [customNumbers, setCustomNumbers] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [previewMessage, setPreviewMessage] = useState('')
  const [parseResult, setParseResult] = useState<PhoneParseResult | null>(null)

  // Media browser state
  const [showMediaBrowser, setShowMediaBrowser] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [mediaCategories, setMediaCategories] = useState<string[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [selectedMediaCategory, setSelectedMediaCategory] = useState('')
  const [mediaSearchQuery, setMediaSearchQuery] = useState('')

  // Variables
  const variables = [
    { key: '{customer_name}', label: 'Nom du client', example: 'Jean Dupont' },
    { key: '{customer_phone}', label: 'Téléphone', example: '+225 07 09 75 72 96' },
    { key: '{customer_email}', label: 'Email', example: 'client@example.com' },
    { key: '{order_count}', label: 'Nombre de commandes', example: '5' },
    { key: '{total_spent}', label: 'Montant total dépensé', example: '125,000 FCFA' },
    { key: '{last_order_date}', label: 'Date dernière commande', example: '15/11/2024' },
    { key: '{store_name}', label: 'Nom du magasin', example: 'CAVE EXPRESS' },
    { key: '{store_phone}', label: 'Téléphone magasin', example: '+225 05 56 79 14 31' },
    { key: '{store_url}', label: 'URL du magasin', example: 'https://cave-express.ci' },
  ]

  useEffect(() => {
    fetchCustomerCount()
  }, [])

  useEffect(() => {
    generatePreview()
  }, [message])

  const fetchCustomerCount = async () => {
    try {
      const res = await fetch('/api/admin/customers?limit=1')
      const data = await res.json()
      setCustomerCount(data.pagination?.totalCount || 0)
    } catch (error) {
      console.error('Error fetching customer count:', error)
    }
  }

  const generatePreview = () => {
    let preview = message
    variables.forEach(v => {
      preview = preview.replace(new RegExp(v.key, 'g'), v.example)
    })
    setPreviewMessage(preview)
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement
    const cursorPos = textarea.selectionStart
    const newMessage = message.slice(0, cursorPos) + variable + message.slice(textarea.selectionEnd)
    setMessage(newMessage)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorPos + variable.length, cursorPos + variable.length)
    }, 0)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      showError('Format invalide', 'Type de fichier invalide. Utilisez JPG, PNG, GIF, WEBP ou PDF')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Fichier trop volumineux', 'La taille maximale autorisée est de 5MB')
      return
    }

    setMediaFile(file)

    // Upload file immediately
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'campaigns')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        // Convert relative URL to full URL for WhatsApp
        const fullUrl = data.url.startsWith('http') ? data.url : `${SITE_URL}${data.url}`
        setMediaUrl(fullUrl)
      } else {
        showError('Erreur de téléchargement', data.error || 'Erreur lors du téléchargement du fichier')
        setMediaFile(null)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      showError('Erreur', 'Une erreur est survenue lors du téléchargement')
      setMediaFile(null)
    } finally {
      setUploading(false)
    }
  }

  // Fetch media from library
  const fetchMediaLibrary = useCallback(async () => {
    setLoadingMedia(true)
    try {
      const params = new URLSearchParams()
      if (selectedMediaCategory) params.set('category', selectedMediaCategory)
      if (mediaSearchQuery) params.set('search', mediaSearchQuery)
      params.set('type', 'image') // Only images for WhatsApp
      params.set('limit', '50')

      const response = await fetch(`/api/admin/media?${params}`)
      const data = await response.json()

      if (data.success) {
        setMediaFiles(data.files)
        setMediaCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoadingMedia(false)
    }
  }, [selectedMediaCategory, mediaSearchQuery])

  // Load media when browser is opened
  useEffect(() => {
    if (showMediaBrowser) {
      fetchMediaLibrary()
    }
  }, [showMediaBrowser, fetchMediaLibrary])

  // Select media from browser
  const selectMediaFromBrowser = (file: MediaFile) => {
    // Ensure we use the full URL for WhatsApp
    const fullUrl = file.fullUrl || `${SITE_URL}${file.url}`
    setMediaUrl(fullUrl)
    setMediaFile(null) // Clear any uploaded file reference
    setShowMediaBrowser(false)
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaUrl('')
  }

  const handleFormatNumbers = () => {
    if (!customNumbers.trim()) return

    const result = parsePhoneNumbers(customNumbers)
    setParseResult(result)
    setCustomNumbers(result.formatted)
  }

  const getRecipientCount = () => {
    if (targetType === 'all') {
      return customerCount
    } else {
      const result = parsePhoneNumbers(customNumbers)
      return result.valid.length
    }
  }

  const getValidNumbers = (): string[] => {
    if (targetType === 'all') {
      return []
    }
    const result = parsePhoneNumbers(customNumbers)
    return result.valid
  }

  const handleSaveDraft = async () => {
    if (!campaignName || !message) {
      showError('Champs requis', 'Veuillez remplir tous les champs requis')
      return
    }

    setLoading(true)
    try {
      const validNumbers = getValidNumbers()

      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          channel: 'WHATSAPP',
          message,
          mediaUrl,
          targetType,
          customNumbers: targetType === 'custom' ? validNumbers : null,
          status: 'draft',
          createdBy: (session?.user as any)?.id,
          createdByName: session?.user?.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess(
          'Brouillon sauvegardé',
          'Votre campagne WhatsApp a été sauvegardée en brouillon avec succès.',
          {
            autoClose: 10,
            redirectUrl: '/admin/campaigns/reports',
            onConfirm: () => router.push('/admin/campaigns/reports'),
          }
        )
      } else {
        showError('Erreur', data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      showError('Erreur', 'Erreur lors de la sauvegarde de la campagne')
    } finally {
      setLoading(false)
    }
  }

  const executeSend = async () => {
    setSending(true)
    try {
      const validNumbers = getValidNumbers()

      const res = await fetch('/api/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          channel: 'WHATSAPP',
          message,
          mediaUrl,
          targetType,
          customNumbers: targetType === 'custom' ? validNumbers : null,
          createdBy: (session?.user as any)?.id,
          createdByName: session?.user?.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess(
          'Campagne envoyée',
          `Votre campagne WhatsApp est en cours d'envoi à ${data.totalRecipients} destinataire(s).`,
          {
            autoClose: 10,
            redirectUrl: '/admin/campaigns/reports',
            onConfirm: () => router.push('/admin/campaigns/reports'),
          }
        )
      } else {
        showError('Erreur d\'envoi', data.error || 'Erreur lors de l\'envoi de la campagne')
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      showError('Erreur', 'Une erreur est survenue lors de l\'envoi de la campagne')
    } finally {
      setSending(false)
    }
  }

  const handleSend = async () => {
    if (!campaignName || !message) {
      showError('Champs requis', 'Veuillez remplir tous les champs requis')
      return
    }

    if (targetType === 'custom') {
      const validNumbers = getValidNumbers()
      if (validNumbers.length === 0) {
        showError('Numéros invalides', 'Veuillez entrer au moins un numéro de téléphone valide')
        return
      }

      // Auto-format before sending
      handleFormatNumbers()
    }

    const recipientCount = getRecipientCount()
    showWarning(
      'Confirmer l\'envoi',
      `Vous êtes sur le point d'envoyer cette campagne WhatsApp à ${recipientCount.toLocaleString()} destinataire(s). Cette action est irréversible.`,
      executeSend,
      {
        confirmText: 'Envoyer maintenant',
        cancelText: 'Annuler',
      }
    )
  }

  return (
    <>
    <ConfirmationModal
      isOpen={modal.isOpen}
      onClose={hideModal}
      onConfirm={modal.onConfirm}
      type={modal.type}
      title={modal.title}
      message={modal.message}
      confirmText={modal.confirmText}
      cancelText={modal.cancelText}
      showCancel={modal.showCancel}
      autoClose={modal.autoClose}
      redirectUrl={modal.redirectUrl}
      onRedirect={modal.onConfirm}
    />
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Campagne WhatsApp Business</h1>
        <p className="text-gray-600 dark:text-gray-400">Envoyez des messages WhatsApp avec médias à vos clients</p>
      </div>

      <div className="flex gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 p-6 border border-gray-200 dark:border-dark-700/50">
        {/* Campaign Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom de la campagne *
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Ex: Promo Weekend, Soldes Janvier"
            className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-500"
          />
        </div>

        {/* Target Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Destinataires *
          </label>
          <div className="space-y-3 text-gray-900 dark:text-white">
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="all"
                checked={targetType === 'all'}
                onChange={(e) => setTargetType('all')}
                className="mr-3"
              />
              <span>Tous les clients ({customerCount.toLocaleString()} clients)</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="targetType"
                value="custom"
                checked={targetType === 'custom'}
                onChange={(e) => setTargetType('custom')}
                className="mr-3 mt-1"
              />
              <div className="flex-1">
                <span className="block mb-2">Numéros personnalisés</span>
                {targetType === 'custom' && (
                  <div className="space-y-2">
                    <textarea
                      value={customNumbers}
                      onChange={(e) => {
                        setCustomNumbers(e.target.value)
                        setParseResult(null) // Reset parse result on change
                      }}
                      placeholder="Entrez les numéros séparés par virgule, point-virgule, espace ou nouvelle ligne&#10;Ex: 2250709757296, 2250151092627&#10;ou 07 09 75 72 96; 01 51 09 26 27"
                      rows={5}
                      className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm placeholder:text-gray-500"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleFormatNumbers}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-100 hover:bg-gray-300 dark:hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        Formater & Valider les numéros
                      </button>
                      {parseResult && (
                        <div className="text-sm">
                          <span className={parseResult.invalid.length > 0 ? 'text-orange-600' : 'text-green-600'}>
                            {getParseResultMessage(parseResult)}
                          </span>
                        </div>
                      )}
                    </div>
                    {parseResult && parseResult.invalid.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                          Numéros invalides détectés:
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {parseResult.invalid.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Media Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Média (optionnel) - Image, PDF, Document
          </label>

          {!mediaFile && !mediaUrl && (
            <div className="space-y-3">
              {/* Upload new file */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-500 dark:hover:border-green-500 transition bg-gray-50 dark:bg-transparent">
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer"
                >
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">Cliquez pour télécharger un fichier</p>
                    <p className="text-sm text-gray-500">JPG, PNG, GIF, WEBP, PDF (max 5MB)</p>
                  </div>
                </label>
              </div>

              {/* Or browse media library */}
              <div className="text-center">
                <span className="text-gray-500 text-sm">ou</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaBrowser(true)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-dark-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Parcourir la médiathèque
              </button>
            </div>
          )}

          {uploading && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-500/30">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Téléchargement en cours...</p>
            </div>
          )}

          {mediaUrl && (
            <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-800">
              {mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={mediaUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
              ) : (
                <div className="text-center py-4">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{mediaFile?.name}</p>
                </div>
              )}
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message * (4096 caractères max)
            </label>
            <span className={`text-sm ${message.length > 4096 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
              {message.length}/4096 caractères
            </span>
          </div>

          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bonjour {customer_name}, profitez de notre promo exclusive..."
            rows={6}
            className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-500"
          />

          {/* Variables */}
          <div className="mt-3">
            <details className="group">
              <summary className="cursor-pointer text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 list-none flex items-center">
                <span>Insérer des variables personnalisées</span>
                <svg className="ml-2 w-4 h-4 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 p-4 bg-gray-100 dark:bg-dark-800 rounded-lg grid grid-cols-2 gap-2">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="text-left px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-green-500 dark:hover:border-green-500 transition text-sm"
                  >
                    <div className="font-medium text-green-600 dark:text-green-400">{v.key}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{v.label}</div>
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading || sending || uploading}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || sending || uploading}
            className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Envoi en cours...' : 'Envoyer la Campagne'}
          </button>
        </div>
        </div>

        {/* Right Column - iPhone Preview */}
        <div className="w-[380px] flex-shrink-0">
          <div className="sticky top-8">
            <IPhoneMessagePreview
              message={previewMessage || message}
              mediaUrl={mediaUrl}
              channel="whatsapp"
              recipientCount={getRecipientCount()}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Media Browser Modal */}
    {showMediaBrowser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Médiathèque</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sélectionnez une image pour votre campagne</p>
            </div>
            <button
              onClick={() => setShowMediaBrowser(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={mediaSearchQuery}
                onChange={(e) => setMediaSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedMediaCategory}
              onChange={(e) => setSelectedMediaCategory(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px]"
            >
              <option value="">Toutes catégories</option>
              {mediaCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={fetchMediaLibrary}
              disabled={loadingMedia}
              className="p-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
            >
              <svg className={`h-5 w-5 ${loadingMedia ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-transparent">
            {loadingMedia ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : mediaFiles.length === 0 ? (
              <div className="text-center py-12">
                <svg className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune image</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {mediaSearchQuery || selectedMediaCategory
                    ? 'Aucune image ne correspond aux filtres'
                    : 'La médiathèque est vide'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {mediaFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => selectMediaFromBrowser(file)}
                    className="group relative aspect-square bg-gray-200 dark:bg-dark-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center p-2">
                        <svg className="h-8 w-8 mx-auto text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white text-xs">Sélectionner</span>
                      </div>
                    </div>
                    {/* Category badge */}
                    <div className="absolute top-1 left-1">
                      <span className="px-1.5 py-0.5 text-[10px] bg-black/60 text-white rounded">
                        {file.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mediaFiles.length} image{mediaFiles.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowMediaBrowser(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
