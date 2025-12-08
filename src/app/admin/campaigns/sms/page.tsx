'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { parsePhoneNumbers, getParseResultMessage, PhoneParseResult } from '@/lib/phone-parser'
import { IPhoneMessagePreview } from '@/components/admin/iphone-message-preview'
import { ConfirmationModal, useConfirmationModal } from '@/components/admin/confirmation-modal'

export default function SMSCampaignPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [customerCount, setCustomerCount] = useState(0)
  const { modal, hideModal, showSuccess, showWarning, showError } = useConfirmationModal()

  // Form state
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'custom'>('all')
  const [customNumbers, setCustomNumbers] = useState('')
  const [previewMessage, setPreviewMessage] = useState('')
  const [parseResult, setParseResult] = useState<PhoneParseResult | null>(null)

  // Variables that can be inserted
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

  // Fetch customer count on load
  useEffect(() => {
    fetchCustomerCount()
  }, [])

  // Update preview when message changes
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
    // Replace with example values
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

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorPos + variable.length, cursorPos + variable.length)
    }, 0)
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
          channel: 'SMS',
          message,
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
          'Votre campagne a été sauvegardée en brouillon avec succès.',
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
          channel: 'SMS',
          message,
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
          `Votre campagne SMS est en cours d'envoi à ${data.totalRecipients} destinataire(s).`,
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
      `Vous êtes sur le point d'envoyer cette campagne SMS à ${recipientCount.toLocaleString()} destinataire(s). Cette action est irréversible.`,
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
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Campagne SMS</h1>
        <p className="text-gray-600 dark:text-gray-400">Envoyez des messages SMS en masse à vos clients</p>
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
            className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-500 dark:placeholder:text-gray-500"
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

        {/* Message */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-2">
              Message *
              <div className="relative group">
                <svg className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                  <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-800 dark:text-gray-200 text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-1">Combien de caractères doit contenir votre message?</p>
                    <p className="text-gray-500 dark:text-gray-400">Votre message doit contenir au maximum 5 sms</p>
                    <p className="text-gray-500 dark:text-gray-400">1 SMS = 160 caractères</p>
                    <p className="text-gray-500 dark:text-gray-400">5 SMS = 800 caractères maximum</p>
                    <p className="text-gray-500 dark:text-gray-400">5 SMS = 800 caractères maximum</p>
                    <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-dark-600"></div>
                  </div>
                </div>
              </div>
            </label>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${message.length > 800 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                {message.length}/800 caractères
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                message.length === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  : message.length <= 160
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                    : message.length <= 320
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                      : message.length <= 480
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                        : message.length <= 640
                          ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400'
                          : message.length <= 800
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                            : 'bg-red-600 text-white'
              }`}>
                {message.length === 0 ? '0 SMS' : `${Math.ceil(message.length / 160)} SMS`}
              </span>
            </div>
          </div>

          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bonjour {customer_name}, profitez de notre promo..."
            rows={5}
            className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-500"
          />

          {/* Variables Dropdown */}
          <div className="mt-3">
            <details className="group">
              <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 list-none flex items-center">
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
                    className="text-left px-3 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-blue-500 dark:hover:border-blue-500 transition text-sm"
                  >
                    <div className="font-medium text-blue-600 dark:text-blue-400">{v.key}</div>
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
            disabled={loading || sending}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || sending}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              channel="sms"
              recipientCount={getRecipientCount()}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
