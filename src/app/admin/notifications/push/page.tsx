'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  Smartphone,
  Edit,
  Send,
  Eye,
  Save,
  X,
  Check,
  Search,
  RefreshCw,
  Settings,
  AlertCircle,
  Users,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface PushTemplate {
  id: string
  trigger: string
  channel: string
  name: string
  description: string | null
  content: string
  pushTitle: string | null
  pushBody: string | null
  recipientType: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface TemplateStats {
  total: number
  enabled: number
  disabled: number
  customerTemplates: number
  adminTemplates: number
}

const TRIGGER_LABELS: Record<string, string> = {
  ORDER_PLACED: 'Commande passée',
  ORDER_PROCESSING: 'Commande en préparation',
  PAYMENT_RECEIVED: 'Paiement reçu',
  ORDER_SHIPPED: 'Commande expédiée',
  ORDER_DELIVERED: 'Commande livrée',
  ORDER_CANCELLED: 'Commande annulée',
  ORDER_REFUNDED: 'Remboursement',
  PAYMENT_FAILED: 'Paiement échoué',
  CUSTOMER_NOTE: 'Note client',
  NEW_ACCOUNT: 'Nouveau compte',
  PASSWORD_RESET: 'Reset mot de passe',
  LOYALTY_POINTS_EARNED: 'Points fidélité',
  ABANDONED_CART: 'Panier abandonné',
  BACK_IN_STOCK: 'Retour en stock',
  NEW_ORDER_ADMIN: 'Nouvelle commande (Admin)',
  PAYMENT_RECEIVED_ADMIN: 'Paiement reçu (Admin)',
  LOW_STOCK_ADMIN: 'Stock bas (Admin)',
  OUT_OF_STOCK_ADMIN: 'Rupture stock (Admin)',
  NEW_CUSTOMER_ADMIN: 'Nouveau client (Admin)',
  NEW_REVIEW_ADMIN: 'Nouvel avis (Admin)',
  DAILY_REPORT_ADMIN: 'Rapport journalier (Admin)',
  INVOICE_CREATED: 'Facture créée',
  INVOICE_PAID: 'Facture payée',
  REVIEW_REQUEST: 'Demande avis',
  PAYMENT_REMINDER_1: 'Rappel paiement 1',
  PAYMENT_REMINDER_2: 'Rappel paiement 2',
  PAYMENT_REMINDER_3: 'Rappel paiement 3',
}

const AVAILABLE_VARIABLES = [
  { name: '{customer_name}', description: 'Nom du client' },
  { name: '{order_number}', description: 'Numéro de commande' },
  { name: '{order_total}', description: 'Total de commande' },
  { name: '{tracking_number}', description: 'Numéro de suivi' },
  { name: '{product_name}', description: 'Nom du produit' },
  { name: '{points_earned}', description: 'Points gagnés' },
  { name: '{points_balance}', description: 'Solde de points' },
  { name: '{invoice_number}', description: 'Numéro de facture' },
  { name: '{reset_code}', description: 'Code de réinitialisation' },
]

export default function PushNotificationTemplatesPage() {
  const [templates, setTemplates] = useState<PushTemplate[]>([])
  const [stats, setStats] = useState<TemplateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipientFilter, setRecipientFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<PushTemplate | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [testToken, setTestToken] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [modalMode, setModalMode] = useState<'edit' | 'test' | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [recipientFilter])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('channel', 'PUSH')
      if (recipientFilter !== 'all') params.append('recipientType', recipientFilter)

      const response = await fetch(`/api/admin/notifications/templates?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates)
        // Calculate stats
        const pushTemplates = data.templates
        setStats({
          total: pushTemplates.length,
          enabled: pushTemplates.filter((t: PushTemplate) => t.enabled).length,
          disabled: pushTemplates.filter((t: PushTemplate) => !t.enabled).length,
          customerTemplates: pushTemplates.filter((t: PushTemplate) => t.recipientType === 'customer').length,
          adminTemplates: pushTemplates.filter((t: PushTemplate) => t.recipientType === 'admin').length,
        })
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Erreur lors du chargement des modèles')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: PushTemplate) => {
    setEditingTemplate(template)
    setEditTitle(template.pushTitle || '')
    setEditBody(template.pushBody || '')
    setModalMode('edit')
  }

  const handleSave = async () => {
    if (!editingTemplate) return

    try {
      const response = await fetch(`/api/admin/notifications/templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushTitle: editTitle,
          pushBody: editBody,
        }),
      })

      if (response.ok) {
        toast.success('Modèle mis à jour')
        fetchTemplates()
        setModalMode(null)
        setEditingTemplate(null)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const toggleEnabled = async (template: PushTemplate) => {
    try {
      const response = await fetch(`/api/admin/notifications/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !template.enabled }),
      })

      if (response.ok) {
        toast.success(template.enabled ? 'Modèle désactivé' : 'Modèle activé')
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error toggling template:', error)
      toast.error('Erreur lors de la modification')
    }
  }

  const handleTestPush = (template: PushTemplate) => {
    setEditingTemplate(template)
    setTestToken('')
    setModalMode('test')
  }

  const sendTestNotification = async () => {
    if (!editingTemplate || !testToken) return

    setSendingTest(true)
    try {
      const response = await fetch('/api/admin/notifications/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: testToken,
          title: editingTemplate.pushTitle,
          body: editingTemplate.pushBody,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Notification test envoyée!')
        setModalMode(null)
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending test:', error)
      toast.error('Erreur lors de l\'envoi du test')
    } finally {
      setSendingTest(false)
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(search) ||
      t.trigger.toLowerCase().includes(search) ||
      (t.pushTitle?.toLowerCase().includes(search)) ||
      (t.pushBody?.toLowerCase().includes(search))
    )
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-purple-600" />
            Notifications Push
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez les modèles de notifications push pour iOS et Android
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/notifications/templates"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Bell className="w-4 h-4" />
            SMS/WhatsApp
          </Link>
          <Link
            href="/admin/campaigns/push"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
            Campagnes Push
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Actifs</div>
            <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Inactifs</div>
            <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Clients</div>
            <div className="text-2xl font-bold text-blue-600">{stats.customerTemplates}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Admin</div>
            <div className="text-2xl font-bold text-purple-600">{stats.adminTemplates}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <select
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les destinataires</option>
            <option value="customer">Clients uniquement</option>
            <option value="admin">Admin uniquement</option>
          </select>
          <button
            onClick={fetchTemplates}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-gray-500">Chargement...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Aucun modèle push trouvé</p>
          <p className="text-sm text-gray-400 mt-1">
            Exécutez le seed pour créer les modèles: npx ts-node prisma/seed-push-notifications.ts
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl p-4 border ${
                template.enabled ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        template.recipientType === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {template.recipientType === 'admin' ? 'Admin' : 'Client'}
                    </span>
                    <h3 className="font-medium text-gray-900">
                      {TRIGGER_LABELS[template.trigger] || template.trigger}
                    </h3>
                    {!template.enabled && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{template.name}</p>

                  {/* Push Preview */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Aperçu notification</span>
                    </div>
                    <div className="font-medium text-gray-900 text-sm">
                      {template.pushTitle || 'Titre non défini'}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      {template.pushBody || 'Corps non défini'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleTestPush(template)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Tester"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleEnabled(template)}
                    className={`p-2 rounded-lg ${
                      template.enabled
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    title={template.enabled ? 'Désactiver' : 'Activer'}
                  >
                    {template.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {modalMode === 'edit' && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Modifier: {TRIGGER_LABELS[editingTemplate.trigger]}
              </h2>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre (max 65 caractères)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={65}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {editTitle.length}/65 caractères
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Corps du message (max 240 caractères)
                </label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  maxLength={240}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {editBody.length}/240 caractères
                </div>
              </div>

              {/* Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variables disponibles
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => setEditBody(editBody + v.name)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                      title={v.description}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-900 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">Aperçu iOS/Android</div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">CM</span>
                    </div>
                    <span className="text-white text-sm font-medium">CÈCHÉMOI</span>
                    <span className="text-gray-400 text-xs ml-auto">maintenant</span>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {editTitle || 'Titre'}
                  </div>
                  <div className="text-gray-300 text-sm mt-1">
                    {editBody || 'Corps du message'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {modalMode === 'test' && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Tester la notification</h2>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-900">
                  {editingTemplate.pushTitle}
                </div>
                <div className="text-purple-700 text-sm mt-1">
                  {editingTemplate.pushBody}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token FCM du device
                </label>
                <input
                  type="text"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Collez le token FCM ici..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le token FCM est affiché dans la console de l&apos;app mobile au login
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={sendTestNotification}
                disabled={sendingTest || !testToken}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
              >
                {sendingTest ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer le test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
