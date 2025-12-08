'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  MessageSquare,
  Smartphone,
  Edit,
  Send,
  Eye,
  Save,
  X,
  Check,
  Filter,
  Search,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NotificationTemplate {
  id: string
  trigger: string
  channel: string
  name: string
  description: string | null
  content: string
  recipientType: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface TemplateStats {
  total: number
  enabled: number
  disabled: number
  byChannel: Record<string, number>
  byRecipient: Record<string, number>
}

const AVAILABLE_VARIABLES = [
  { name: '{customer_name}', description: 'Nom du client' },
  { name: '{billing_first_name}', description: 'Prénom (facturation)' },
  { name: '{billing_last_name}', description: 'Nom (facturation)' },
  { name: '{billing_phone}', description: 'Téléphone (facturation)' },
  { name: '{billing_email}', description: 'Email (facturation)' },
  { name: '{order_number}', description: 'Numéro de commande' },
  { name: '{order_id}', description: 'ID de commande' },
  { name: '{order_date}', description: 'Date de commande' },
  { name: '{order_status}', description: 'Statut de commande' },
  { name: '{order_total}', description: 'Total de commande' },
  { name: '{order_subtotal}', description: 'Sous-total' },
  { name: '{order_tax}', description: 'Taxes' },
  { name: '{order_shipping}', description: 'Frais de livraison' },
  { name: '{order_discount}', description: 'Remise' },
  { name: '{order_product}', description: 'Produits commandés' },
  { name: '{order_product_with_qty}', description: 'Produits avec quantités' },
  { name: '{order_items_count}', description: 'Nombre d\'articles' },
  { name: '{payment_method}', description: 'Méthode de paiement' },
  { name: '{payment_reference}', description: 'Référence de paiement' },
  { name: '{payment_status}', description: 'Statut de paiement' },
  { name: '{tracking_number}', description: 'Numéro de suivi' },
  { name: '{product_name}', description: 'Nom du produit' },
  { name: '{product_quantity}', description: 'Quantité du produit' },
  { name: '{low_stock_quantity}', description: 'Quantité en stock faible' },
  { name: '{store_name}', description: 'Nom du magasin' },
  { name: '{store_url}', description: 'URL du magasin' },
  { name: '{store_phone}', description: 'Téléphone du magasin' },
  { name: '{store_whatsapp}', description: 'WhatsApp du magasin' },
]

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [stats, setStats] = useState<TemplateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState('all')
  const [recipientFilter, setRecipientFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [editContent, setEditContent] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [modalMode, setModalMode] = useState<'edit' | 'test' | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [channelFilter, recipientFilter])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (channelFilter !== 'all') params.append('channel', channelFilter)
      if (recipientFilter !== 'all') params.append('recipientType', recipientFilter)

      const response = await fetch(`/api/admin/notifications/templates?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (templateId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(currentEnabled ? 'Template désactivé' : 'Template activé')
        fetchTemplates()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setEditContent(template.content)
    setModalMode('edit')
  }

  const handleOpenTestModal = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTestPhone('')
    setModalMode('test')
  }

  const closeModal = () => {
    setEditingTemplate(null)
    setEditContent('')
    setTestPhone('')
    setModalMode(null)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return

    if (!editContent.trim()) {
      toast.error('Le contenu ne peut pas être vide')
      return
    }

    try {
      const response = await fetch(`/api/admin/notifications/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Template mis à jour')
        closeModal()
        fetchTemplates()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleTestSend = async (template: NotificationTemplate) => {
    if (!testPhone.trim()) {
      toast.error('Veuillez entrer un numéro de téléphone')
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch(`/api/admin/notifications/templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Test envoyé avec succès')
        setTestPhone('')
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du test')
    } finally {
      setSendingTest(false)
    }
  }

  const insertVariable = (variable: string) => {
    setEditContent((prev) => prev + variable)
  }

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery) {
      return (
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.trigger.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return <Smartphone className="h-4 w-4" />
      case 'WHATSAPP':
      case 'WHATSAPP_CLOUD':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-100 text-blue-800'
      case 'WHATSAPP':
      case 'WHATSAPP_CLOUD':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary-500" />
          Templates de Notifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gérer les templates de notifications SMS et WhatsApp
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Templates</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Activés</p>
            <p className="text-2xl font-bold text-green-500 dark:text-green-400">{stats.enabled}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Désactivés</p>
            <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.disabled}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">SMS / WhatsApp</p>
            <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">
              {stats.byChannel.SMS || 0} / {(stats.byChannel.WHATSAPP || 0) + (stats.byChannel.WHATSAPP_CLOUD || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un template..."
                className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canal</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destinataire</label>
            <select
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="customer">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun template trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getChannelColor(template.channel)}`}>
                      {getChannelIcon(template.channel)}
                      {template.channel}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      {template.recipientType === 'customer' ? 'Client' : 'Admin'}
                    </span>
                    {template.enabled ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Activé
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Désactivé
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">Trigger: {template.trigger}</p>
                  <div className="mt-3 bg-gray-100 dark:bg-dark-800 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{template.content}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleToggleEnabled(template.id, template.enabled)}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${
                    template.enabled
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {template.enabled ? (
                    <>
                      <X className="h-4 w-4" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Activer
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleOpenTestModal(template)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center gap-1"
                >
                  <Send className="h-4 w-4" />
                  Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && modalMode === 'edit' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-700 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Modifier le Template: {editingTemplate.name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trigger
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-dark-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700">
                    {editingTemplate.trigger}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Canal
                  </label>
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${getChannelColor(editingTemplate.channel)}`}>
                    {editingTemplate.channel}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenu du Template
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder="Contenu du message..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Caractères: {editContent.length} / {editingTemplate.channel === 'SMS' ? '160 (SMS standard)' : '4096'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variables Disponibles
                  </label>
                  <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg border border-gray-200 dark:border-dark-700 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_VARIABLES.map((variable) => (
                        <button
                          key={variable.name}
                          onClick={() => insertVariable(variable.name)}
                          className="text-left px-3 py-2 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-primary-500/10 hover:border-primary-500/50 transition-colors"
                        >
                          <span className="font-mono text-primary-500 dark:text-primary-400">{variable.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1 block mt-0.5">{variable.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Send Modal */}
      {editingTemplate && modalMode === 'test' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full border border-gray-200 dark:border-dark-700 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tester: {editingTemplate.name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+2250556791431"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format international avec indicatif pays (ex: +2250556791431)
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg border border-gray-200 dark:border-dark-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Aperçu du message:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                    {editingTemplate.content}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleTestSend(editingTemplate)}
                  disabled={sendingTest || !testPhone.trim()}
                  className="px-5 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 disabled:bg-gray-300 dark:disabled:bg-dark-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Envoyer Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
