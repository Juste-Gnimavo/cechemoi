'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { IPhoneMessagePreview } from '@/components/admin/iphone-message-preview'
import { ConfirmationModal, useConfirmationModal } from '@/components/admin/confirmation-modal'

export default function WhatsAppCloudCampaignPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [customerCount, setCustomerCount] = useState(0)
  const { modal, hideModal, showSuccess, showWarning, showError } = useConfirmationModal()

  // Form state
  const [campaignName, setCampaignName] = useState('')
  const [templateText, setTemplateText] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'custom'>('all')
  const [customNumbers, setCustomNumbers] = useState('')

  useEffect(() => {
    fetchCustomerCount()
  }, [])

  const fetchCustomerCount = async () => {
    try {
      const res = await fetch('/api/admin/customers?limit=1')
      const data = await res.json()
      setCustomerCount(data.pagination?.totalCount || 0)
    } catch (error) {
      console.error('Error fetching customer count:', error)
    }
  }

  const getRecipientCount = () => {
    if (targetType === 'all') {
      return customerCount
    } else {
      return customNumbers.split('\n').filter(n => n.trim()).length
    }
  }

  const handleSaveDraft = async () => {
    if (!campaignName || !templateText) {
      showError('Champs requis', 'Veuillez remplir tous les champs requis')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          channel: 'WHATSAPP_CLOUD',
          message: templateText,
          targetType,
          customNumbers: targetType === 'custom' ? customNumbers.split('\n').filter(n => n.trim()) : null,
          status: 'draft',
          createdBy: (session?.user as any)?.id,
          createdByName: session?.user?.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess(
          'Brouillon sauvegardé',
          'Votre campagne WhatsApp Cloud a été sauvegardée en brouillon avec succès.',
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
      const res = await fetch('/api/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          channel: 'WHATSAPP_CLOUD',
          message: templateText,
          targetType,
          customNumbers: targetType === 'custom' ? customNumbers.split('\n').filter(n => n.trim()) : null,
          createdBy: (session?.user as any)?.id,
          createdByName: session?.user?.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        showSuccess(
          'Campagne envoyée',
          `Votre campagne WhatsApp Cloud est en cours d'envoi à ${data.totalRecipients} destinataire(s).`,
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
    if (!campaignName || !templateText) {
      showError('Champs requis', 'Veuillez remplir tous les champs requis')
      return
    }

    if (targetType === 'custom' && !customNumbers.trim()) {
      showError('Numéros manquants', 'Veuillez entrer au moins un numéro de téléphone')
      return
    }

    const recipientCount = getRecipientCount()
    showWarning(
      'Confirmer l\'envoi',
      `Vous êtes sur le point d'envoyer cette campagne WhatsApp Cloud à ${recipientCount.toLocaleString()} destinataire(s). Cette action est irréversible.`,
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
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Campagne WhatsApp Cloud</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Envoyez des messages WhatsApp via SMSing (proxy pour WhatsApp Cloud API).
          Utilisez vos templates approuvés sur Facebook Business Manager.
        </p>
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

        {/* Template Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Texte du Template WhatsApp Cloud *
          </label>
          <textarea
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            placeholder="content:cechemoi|lang=fr|body=01234|header=image:https://cechemoi.com/wp-content/uploads/2025/11/logo.png"
            rows={4}
            className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm placeholder:text-gray-500"
          />
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Collez le texte de template complet au format SMSing. Ce texte sera envoyé tel quel via l'API SMSing.
            </p>
            <div className="bg-gray-100 dark:bg-dark-900 rounded p-3 space-y-3 text-xs border border-gray-200 dark:border-dark-700">
              <div>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Format:</span>
                <code className="block text-gray-700 dark:text-gray-300 mt-1">
                  content:[nom_template]|lang=[fr/en]|body=[valeur]|header/button=[option]
                </code>
              </div>
              <div className="border-t border-gray-200 dark:border-dark-600 pt-2">
                <span className="text-gray-500">Exemple avec logo:</span>
                <code className="block text-green-600 dark:text-green-400 mt-1 break-all">
                  content:cechemoi|lang=fr|body=01234|header=image:https://cechemoi.com/wp-content/uploads/2025/11/logo.png
                </code>
              </div>
              <div>
                <span className="text-gray-500">Exemple OTP officiel:</span>
                <code className="block text-green-600 dark:text-green-400 mt-1">
                  content:official_otp_code_template|lang=en|body=01234|button=01234
                </code>
              </div>
            </div>
          </div>
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
                  <textarea
                    value={customNumbers}
                    onChange={(e) => setCustomNumbers(e.target.value)}
                    placeholder="2250709757296&#10;2250151092627&#10;Un numéro par ligne"
                    rows={5}
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-500"
                  />
                )}
              </div>
            </label>
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
            className="flex-1 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Envoi en cours...' : 'Envoyer la Campagne'}
          </button>
        </div>
        </div>

        {/* Right Column - iPhone Preview */}
        <div className="w-[380px] flex-shrink-0">
          <div className="sticky top-8">
            <IPhoneMessagePreview
              message={templateText || 'Votre message template WhatsApp Cloud apparaîtra ici...'}
              channel="whatsapp-cloud"
              recipientCount={getRecipientCount()}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
