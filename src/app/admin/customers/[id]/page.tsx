'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ShoppingBag,
  DollarSign,
  Star,
  MessageSquare,
  TrendingUp,
  Package,
  Plus,
  FileText,
  Send,
  Loader2,
  MapPin,
  Pencil,
  X,
  Save,
  Ruler,
  Download,
  User,
  History,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { UserProfileCard } from '@/components/user-profile-card'
import { MeasurementsForm } from '@/components/admin/measurements-form'
import { MeasurementsDisplay } from '@/components/measurements-display'

interface CustomerDetail {
  id: string
  name: string
  phone: string
  whatsappNumber?: string
  email?: string
  image?: string
  role?: string
  country?: string | null
  countryCode?: string | null
  city?: string | null
  ipAddress?: string | null
  lastLoginAt?: string | null
  lastLoginIp?: string | null
  lastLoginBrowser?: string | null
  twoFactorEnabled?: boolean
  phoneVerified?: boolean
  emailVerified?: string | null
  createdAt: string
  updatedAt?: string
  createdByStaffId?: string | null
  createdByStaffName?: string | null
  dateOfBirth?: string | null
  howDidYouHearAboutUs?: string | null
  orders: any[]
  addresses: any[]
  reviews: any[]
  customerNotes: any[]
  analytics: {
    totalOrders: number
    completedOrders: number
    lifetimeValue: number
    averageOrderValue: number
    totalItemsPurchased: number
    ordersByStatus: Record<string, number>
    monthlySpending: Array<{ month: string; amount: number; orders: number }>
    segments: string[]
    lastOrderDate?: string
  }
  _count: {
    orders: number
    reviews: number
    wishlist: number
  }
}

interface Measurement {
  id: string
  measurementDate: string
  unit: string
  takenByStaffId?: string | null
  takenByStaffName?: string | null
  dos?: number | null
  carrureDevant?: number | null
  carrureDerriere?: number | null
  epaule?: number | null
  epauleManche?: number | null
  poitrine?: number | null
  tourDeTaille?: number | null
  longueurDetaille?: number | null
  bassin?: number | null
  longueurManches?: string | null
  tourDeManche?: number | null
  poignets?: number | null
  pinces?: number | null
  longueurTotale?: number | null
  longueurRobes?: string | null
  longueurTunique?: number | null
  ceinture?: number | null
  longueurPantalon?: number | null
  frappe?: number | null
  cuisse?: number | null
  genoux?: number | null
  longueurJupe?: string | null
  autresMesures?: string | null
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<'private' | 'shared'>('private')
  const [addingNote, setAddingNote] = useState(false)

  // Quick notification state
  const [notificationForm, setNotificationForm] = useState({
    channel: 'WHATSAPP' as 'WHATSAPP' | 'SMS' | 'WHATSAPP_CLOUD',
    recipient: '',
    message: '',
  })
  const [sendingNotification, setSendingNotification] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    city: '',
    country: '',
    countryCode: '',
    inscriptionDate: '',
  })

  // Measurements state
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement | null>(null)
  const [measurementHistory, setMeasurementHistory] = useState<Measurement[]>([])
  const [showMeasurementModal, setShowMeasurementModal] = useState(false)
  const [measurementFormData, setMeasurementFormData] = useState<any>({})
  const [savingMeasurement, setSavingMeasurement] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    fetchCustomer()
    fetchMeasurements()
  }, [params.id])

  // Initialize edit form when customer loads
  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        whatsappNumber: customer.whatsappNumber || '',
        city: customer.city || '',
        country: customer.country || '',
        countryCode: customer.countryCode || '',
        inscriptionDate: customer.createdAt ? new Date(customer.createdAt).toISOString().slice(0, 16) : '',
      })
    }
  }, [customer])

  // Set recipient when customer loads
  useEffect(() => {
    if (customer) {
      setNotificationForm(prev => ({
        ...prev,
        recipient: customer.whatsappNumber || customer.phone || ''
      }))
    }
  }, [customer])

  const sendNotification = async () => {
    if (!notificationForm.recipient || !notificationForm.message) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    try {
      setSendingNotification(true)
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: notificationForm.channel,
          recipient: notificationForm.recipient,
          message: notificationForm.message,
          customerId: customer?.id,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Message envoyé avec succès!')
        setNotificationForm(prev => ({ ...prev, message: '' }))
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingNotification(false)
    }
  }

  const saveCustomer = async () => {
    if (!editForm.name || !editForm.phone) {
      toast.error('Nom et téléphone sont requis')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone,
          whatsappNumber: editForm.whatsappNumber || null,
          city: editForm.city || null,
          country: editForm.country || null,
          countryCode: editForm.countryCode || null,
          inscriptionDate: editForm.inscriptionDate || null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Client mis à jour avec succès')
        setShowEditModal(false)
        fetchCustomer() // Refresh data
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/customers/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setCustomer(data.customer)
      } else {
        toast.error('Client non trouvé')
        router.push('/admin/customers')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchMeasurements = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}/measurements`)
      const data = await response.json()

      if (data.success) {
        setCurrentMeasurement(data.currentMeasurement)
        setMeasurementHistory(data.measurementHistory || [])
      }
    } catch (error) {
      console.error('Error fetching measurements:', error)
    }
  }

  const saveMeasurement = async () => {
    try {
      setSavingMeasurement(true)
      const response = await fetch(`/api/admin/customers/${params.id}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(measurementFormData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Mensurations enregistrées avec succès')
        setShowMeasurementModal(false)
        setMeasurementFormData({})
        fetchMeasurements()
      } else {
        toast.error(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error saving measurement:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSavingMeasurement(false)
    }
  }

  const downloadMeasurementPdf = async (measurementId?: string) => {
    try {
      setDownloadingPdf(true)
      const url = measurementId
        ? `/api/admin/customers/${params.id}/measurements-pdf?measurementId=${measurementId}`
        : `/api/admin/customers/${params.id}/measurements-pdf`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `mensurations-${customer?.name || 'client'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!noteContent.trim()) {
      toast.error('Veuillez entrer une note')
      return
    }

    try {
      setAddingNote(true)
      const response = await fetch(`/api/admin/customers/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent.trim(),
          noteType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Note ajoutée avec succès')
        setNoteContent('')
        setNoteType('private')
        fetchCustomer()
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Erreur lors de l\'ajout de la note')
    } finally {
      setAddingNote(false)
    }
  }

  const getSegmentBadge = (segment: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      vip: { label: 'VIP', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      'high-value': {
        label: 'Haute valeur',
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      },
      new: { label: 'Nouveau', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
      inactive: { label: 'Inactif', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    }

    const badge = badges[segment]
    if (!badge) return null

    return (
      <span className={`px-2 py-1 rounded text-xs border ${badge.color}`}>{badge.label}</span>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/10 text-yellow-500',
      PROCESSING: 'bg-blue-500/10 text-blue-500',
      SHIPPED: 'bg-purple-500/10 text-purple-500',
      DELIVERED: 'bg-green-500/10 text-green-500',
      CANCELLED: 'bg-red-500/10 text-red-500',
      REFUNDED: 'bg-gray-500/10 text-gray-400',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Client non trouvé</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name || 'Client'}</h1>
              {customer.analytics.segments.map((segment, idx) => (
                <span key={idx}>{getSegmentBadge(segment)}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {currentMeasurement && (
            <button
              onClick={() => downloadMeasurementPdf()}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Fiche PDF</span>
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span>Modifier</span>
          </button>
          <Link
            href={`/admin/orders/new?customerId=${customer.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle commande</span>
          </Link>
          <Link
            href={`/admin/invoices/new?customerId=${customer.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Nouvelle facture</span>
          </Link>
        </div>
      </div>

      {/* User Profile Card - Contact & Account Info */}
      <UserProfileCard
        user={{
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          whatsappNumber: customer.whatsappNumber,
          image: customer.image,
          role: customer.role || 'CUSTOMER',
          country: customer.country,
          countryCode: customer.countryCode,
          city: customer.city,
          ipAddress: customer.ipAddress,
          lastLoginAt: customer.lastLoginAt,
          lastLoginIp: customer.lastLoginIp,
          lastLoginBrowser: customer.lastLoginBrowser,
          twoFactorEnabled: customer.twoFactorEnabled,
          phoneVerified: customer.phoneVerified,
          emailVerified: customer.emailVerified,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        }}
        variant="full"
        editable={false}
        showLoginInfo={true}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Total commandes</span>
            <ShoppingBag className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{customer.analytics.totalOrders}</div>
          <p className="text-sm text-gray-500 mt-1">
            {customer.analytics.completedOrders} livrées
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Valeur vie client</span>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer.analytics.lifetimeValue.toLocaleString()} CFA
          </div>
          <p className="text-sm text-gray-500 mt-1">Depuis inscription</p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Panier moyen</span>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer.analytics.averageOrderValue.toLocaleString()} CFA
          </div>
          <p className="text-sm text-gray-500 mt-1">Par commande</p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Articles achetés</span>
            <Package className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer.analytics.totalItemsPurchased}
          </div>
          <p className="text-sm text-gray-500 mt-1">Total unités</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order History */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary-500" />
                Historique des commandes
              </h2>
            </div>
            <div className="p-6">
              {customer.orders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune commande</p>
              ) : (
                <div className="space-y-3">
                  {customer.orders.slice(0, 10).map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-4 bg-gray-100 dark:bg-dark-800 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-gray-900 dark:text-white font-medium">#{order.orderNumber}</p>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {order.total.toLocaleString()} CFA
                        </p>
                        <p className="text-gray-500 text-sm">{order.items.length} article(s)</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Measurements Section */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary-500" />
                Mensurations
                {measurementHistory.length > 0 && (
                  <span className="text-xs bg-primary-500/20 text-primary-500 px-2 py-0.5 rounded-full">
                    {measurementHistory.length} enregistrement{measurementHistory.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowMeasurementModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
            <div className="p-6">
              {currentMeasurement ? (
                <MeasurementsDisplay
                  measurement={currentMeasurement}
                  measurementHistory={measurementHistory}
                  showHistory={true}
                />
              ) : (
                <div className="text-center py-8">
                  <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Aucune mensuration enregistrée pour ce client
                  </p>
                  <button
                    onClick={() => setShowMeasurementModal(true)}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Ajouter des mensurations
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary-500" />
                Notes
              </h2>
            </div>
            <div className="p-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mb-6 pb-6 border-b border-gray-200 dark:border-dark-800">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="private"
                        checked={noteType === 'private'}
                        onChange={() => setNoteType('private')}
                        className="text-primary-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Privée</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="shared"
                        checked={noteType === 'shared'}
                        onChange={() => setNoteType('shared')}
                        className="text-primary-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Partagée (envoie notification)</span>
                    </label>
                  </div>

                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Ajouter une note..."
                    rows={3}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={addingNote || !noteContent.trim()}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    {addingNote ? 'Ajout...' : 'Ajouter la note'}
                  </button>
                </div>
              </form>

              {/* Notes List */}
              {customer.customerNotes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune note</p>
              ) : (
                <div className="space-y-3">
                  {customer.customerNotes.map((note: any) => (
                    <div key={note.id} className="pb-3 border-b border-gray-200 dark:border-dark-800 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium text-sm">{note.authorName}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              note.noteType === 'private'
                                ? 'bg-gray-500/10 text-gray-500 dark:text-gray-400'
                                : 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                            }`}
                          >
                            {note.noteType === 'private' ? 'Privée' : 'Partagée'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Created By Info */}
          {customer.createdByStaffName && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-500" />
                Fiche créée par
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {customer.createdByStaffName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {customer.createdByStaffName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(customer.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Notification Sender */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Envoi Rapide
              </h2>
            </div>

            <div className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Canal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotificationForm({ ...notificationForm, channel: 'WHATSAPP' })}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      notificationForm.channel === 'WHATSAPP'
                        ? 'bg-green-500/10 border-green-500 text-green-500'
                        : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-green-500/50'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationForm({ ...notificationForm, channel: 'SMS' })}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      notificationForm.channel === 'SMS'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                        : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-blue-500/50'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-xs">SMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationForm({ ...notificationForm, channel: 'WHATSAPP_CLOUD' })}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      notificationForm.channel === 'WHATSAPP_CLOUD'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                        : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-purple-500/50'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-xs">WA Cloud</span>
                  </button>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Destinataire
                </label>
                <input
                  type="text"
                  value={notificationForm.recipient}
                  onChange={(e) => setNotificationForm({ ...notificationForm, recipient: e.target.value })}
                  placeholder="+225..."
                  className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Message
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  placeholder="Entrez votre message..."
                  rows={3}
                  className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={sendNotification}
                disabled={sendingNotification}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingNotification ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Addresses */}
          {customer.addresses.length > 0 && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-500" />
                Adresses
              </h2>
              <div className="space-y-3">
                {customer.addresses.map((address: any) => (
                  <div key={address.id} className="text-sm">
                    {address.isDefault && (
                      <span className="text-primary-500 text-xs">Par défaut</span>
                    )}
                    <p className="text-gray-900 dark:text-white font-medium">{address.fullName}</p>
                    <p className="text-gray-500 dark:text-gray-400">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="text-gray-500 dark:text-gray-400">{address.addressLine2}</p>}
                    <p className="text-gray-500 dark:text-gray-400">
                      {address.city}, {address.country}
                    </p>
                    <p className="text-gray-500">{address.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {customer.reviews.length > 0 && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary-500" />
                Avis ({customer.reviews.length})
              </h2>
              <div className="space-y-3">
                {customer.reviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="text-sm pb-3 border-b border-gray-200 dark:border-dark-800 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <Link href={`/admin/products/${review.product.id}`} className="text-gray-500 dark:text-gray-400 hover:text-primary-500">
                      {review.product.name}
                    </Link>
                    {review.comment && <p className="text-gray-700 dark:text-gray-300 mt-1">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-orange-400" />
                Modifier le client
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={editForm.whatsappNumber}
                    onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Ville</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Pays</label>
                  <select
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Mali">Mali</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Bénin">Bénin</option>
                    <option value="Togo">Togo</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="France">France</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Code Pays</label>
                  <input
                    type="text"
                    value={editForm.countryCode}
                    onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="CI"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Custom Inscription Date */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-semibold text-orange-400">Date d&apos;inscription</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Modifier la date d&apos;inscription du client si nécessaire.
                </p>
                <input
                  type="datetime-local"
                  value={editForm.inscriptionDate}
                  onChange={(e) => setEditForm({ ...editForm, inscriptionDate: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveCustomer}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {showMeasurementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowMeasurementModal(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary-500" />
                Ajouter des mensurations
              </h2>
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <MeasurementsForm
                onChange={(data) => setMeasurementFormData(data)}
                collapsed={false}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-700">
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveMeasurement}
                disabled={savingMeasurement}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {savingMeasurement ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{savingMeasurement ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
