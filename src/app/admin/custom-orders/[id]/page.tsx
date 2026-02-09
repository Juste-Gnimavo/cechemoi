'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Phone,
  User,
  Calendar,
  CreditCard,
  Scissors,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
  Edit2,
  MessageSquare,
  Ruler,
  ChevronDown,
  ChevronUp,
  Send,
  Package,
  Download,
  FileText,
  Receipt,
  ExternalLink,
  Box,
  Paperclip,
  Upload,
  File,
  Image,
  Video,
  Music,
  X,
  Save,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Status and priority labels
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_PRODUCTION: 'En production',
  FITTING: 'Essayage',
  ALTERATIONS: 'Retouches',
  READY: 'Prêt',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500',
  IN_PRODUCTION: 'bg-blue-500',
  FITTING: 'bg-purple-500',
  ALTERATIONS: 'bg-orange-500',
  READY: 'bg-green-500',
  DELIVERED: 'bg-emerald-600',
  CANCELLED: 'bg-red-500',
}

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CUTTING: 'Coupe',
  SEWING: 'Couture',
  FITTING: 'Essayage',
  ALTERATIONS: 'Retouches',
  FINISHING: 'Finitions',
  COMPLETED: 'Terminé',
  DELIVERED: 'Livré',
}

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500',
  CUTTING: 'bg-yellow-500',
  SEWING: 'bg-blue-500',
  FITTING: 'bg-purple-500',
  ALTERATIONS: 'bg-orange-500',
  FINISHING: 'bg-cyan-500',
  COMPLETED: 'bg-green-500',
  DELIVERED: 'bg-emerald-600',
}

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  VIP: 'VIP',
}

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: 'bg-gray-500',
  URGENT: 'bg-orange-500',
  VIP: 'bg-red-500',
}

interface Order {
  id: string
  orderNumber: string
  status: string
  priority: string
  orderDate: string
  pickupDate: string
  customerDeadline?: string
  totalCost: number
  materialCost: number
  deposit: number
  balance: number
  profit: number
  notes?: string
  customer: {
    id: string
    name: string
    phone: string
    whatsappNumber?: string
    email?: string
    city?: string
    country?: string
  }
  measurement?: any
  items: any[]
  payments: any[]
  timeline: any[]
  createdBy?: {
    id: string
    name: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
    status: string
    total: number
    amountPaid: number
  }
  createdAt: string
}

interface MaterialUsage {
  id: string
  type: string
  quantity: number
  totalCost: number
  createdAt: string
  material: { name: string; unit: string }
  tailor: { name: string } | null
  createdBy: { name: string } | null
}

interface Attachment {
  id: string
  filename: string
  originalName: string
  fileUrl: string
  fileType: string
  fileSize: number
  category: string
  description?: string
  uploadedByName?: string
  createdAt: string
}

export default function CustomOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [tailors, setTailors] = useState<any[]>([])
  const [materialUsages, setMaterialUsages] = useState<MaterialUsage[]>([])
  const [materialTotalCost, setMaterialTotalCost] = useState(0)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Collapsed states
  const [itemsExpanded, setItemsExpanded] = useState(true)
  const [paymentsExpanded, setPaymentsExpanded] = useState(true)
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  const [materialsExpanded, setMaterialsExpanded] = useState(true)

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16))
  const [paymentNotes, setPaymentNotes] = useState('')
  const [addingPayment, setAddingPayment] = useState(false)

  // Timeline form
  const [timelineEvent, setTimelineEvent] = useState('')
  const [timelineDescription, setTimelineDescription] = useState('')
  const [addingTimeline, setAddingTimeline] = useState(false)

  useEffect(() => {
    fetchOrder()
    fetchTailors()
    fetchMaterialUsages()
    fetchAttachments()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}`)
      const data = await res.json()
      if (data.success) {
        setOrder(data.order)
      } else {
        toast.error('Commande non trouvée')
        router.push('/admin/custom-orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchTailors = async () => {
    try {
      const res = await fetch('/api/admin/tailors')
      const data = await res.json()
      if (data.success) {
        setTailors(data.tailors)
      }
    } catch (error) {
      console.error('Error fetching tailors:', error)
    }
  }

  const fetchMaterialUsages = async () => {
    try {
      const res = await fetch(`/api/admin/materials/movements?customOrderId=${orderId}&limit=50`)
      const data = await res.json()
      if (data.success) {
        setMaterialUsages(data.movements)
        // Calculate total cost
        const total = data.movements.reduce((sum: number, m: MaterialUsage) => sum + m.totalCost, 0)
        setMaterialTotalCost(total)
      }
    } catch (error) {
      console.error('Error fetching material usages:', error)
    }
  }

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/attachments`)
      const data = await res.json()
      if (data.success) {
        setAttachments(data.attachments)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux. Maximum 500MB')
      return
    }

    setUploadingFile(true)
    try {
      // First upload to storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', `custom-orders/${orderId}`)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      // Then save attachment record
      const res = await fetch(`/api/admin/custom-orders/${orderId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadData.filename,
          originalName: file.name,
          fileUrl: uploadData.url,
          fileType: file.type,
          fileSize: file.size,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Fichier ajouté')
        fetchAttachments()
        fetchOrder() // Refresh timeline
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.message || 'Erreur lors du téléchargement')
    } finally {
      setUploadingFile(false)
      // Reset input
      e.target.value = ''
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Supprimer ce fichier ?')) return

    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Fichier supprimé')
        fetchAttachments()
        fetchOrder() // Refresh timeline
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error deleting attachment:', error)
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesValue }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Notes enregistrées')
        setEditingNotes(false)
        fetchOrder()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error saving notes:', error)
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingNotes(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType.startsWith('video/')) return Video
    if (fileType.startsWith('audio/')) return Music
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Statut mis à jour')
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Article mis à jour')
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const updateItemTailor = async (itemId: string, tailorId: string) => {
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, tailorId: tailorId || null }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Couturier assigné')
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'assignation')
    }
  }

  const addPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Montant invalide')
      return
    }

    setAddingPayment(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod,
          paidAt: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
          notes: paymentNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Paiement enregistré')
        setShowPaymentModal(false)
        setPaymentAmount(0)
        setPaymentMethod('')
        setPaymentDate(new Date().toISOString().slice(0, 16))
        setPaymentNotes('')
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du paiement')
    } finally {
      setAddingPayment(false)
    }
  }

  const addTimelineEntry = async () => {
    if (!timelineEvent) {
      toast.error('Événement requis')
      return
    }

    setAddingTimeline(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: timelineEvent,
          description: timelineDescription,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Événement ajouté')
        setShowTimelineModal(false)
        setTimelineEvent('')
        setTimelineDescription('')
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setAddingTimeline(false)
    }
  }

  const deleteOrder = async () => {
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Commande supprimée')
        router.push('/admin/custom-orders')
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
    setShowDeleteModal(false)
  }

  const downloadPdf = async () => {
    if (!order) return

    try {
      setDownloadingPdf(true)
      const response = await fetch(`/api/admin/custom-orders/${orderId}/pdf`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `commande_${order.orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Commande non trouvée</p>
        <Link href="/admin/custom-orders" className="text-primary-500 mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const daysUntilPickup = Math.ceil(
    (new Date(order.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${PRIORITY_COLORS[order.priority]}`}>
              {PRIORITY_LABELS[order.priority]}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Créée le {new Date(order.orderDate).toLocaleDateString('fr-FR')}
            {order.createdBy && ` par ${order.createdBy.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            title="Télécharger PDF"
          >
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Fiche PDF</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-5 w-5 text-red-400" />
          </button>
          <Link
            href="/admin/custom-orders"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Link>
        </div>
      </div>

      {/* Alert for upcoming deadline */}
      {daysUntilPickup <= 3 && daysUntilPickup > 0 && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span className="text-orange-600 dark:text-orange-400">
            Retrait prévu dans {daysUntilPickup} jour(s) - {new Date(order.pickupDate).toLocaleDateString('fr-FR')}
          </span>
        </div>
      )}

      {daysUntilPickup <= 0 && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-600 dark:text-red-400">
            Retrait en retard! Prévu le {new Date(order.pickupDate).toLocaleDateString('fr-FR')}
          </span>
        </div>
      )}

      {/* Alert for delivered with unpaid balance */}
      {order.status === 'DELIVERED' && order.balance > 0 && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span className="text-orange-600 dark:text-orange-400">
            Commande livrée avec un solde impayé de {order.balance.toLocaleString()} FCFA
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-400" />
              Client
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-lg">{order.customer.name}</p>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.customer.phone}
                </p>
                {order.customer.email && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{order.customer.email}</p>
                )}
                {order.customer.city && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {order.customer.city}, {order.customer.country || 'Côte d\'Ivoire'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {order.customer.whatsappNumber && (
                  <a
                    href={`https://wa.me/${order.customer.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
                    title="WhatsApp"
                  >
                    <Send className="h-5 w-5 text-green-500" />
                  </a>
                )}
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="p-2 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors"
                  title="Voir le profil"
                >
                  <User className="h-5 w-5 text-primary-500" />
                </Link>
              </div>
            </div>

            {/* Measurements info */}
            {order.measurement && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Ruler className="h-4 w-4" />
                  <span>
                    Mensurations du {new Date(order.measurement.measurementDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
            <button
              onClick={() => setItemsExpanded(!itemsExpanded)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Scissors className="h-5 w-5 text-primary-400" />
                Articles ({order.items.length})
              </h2>
              {itemsExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {itemsExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {index + 1}. {item.garmentType}
                          {item.customType && ` (${item.customType})`}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${ITEM_STATUS_COLORS[item.status]}`}
                      >
                        {ITEM_STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Quantité:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{item.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Prix:</span>{' '}
                        <span className="text-gray-900 dark:text-white">
                          {(item.unitPrice * item.quantity).toLocaleString()} FCFA
                        </span>
                      </div>
                      {item.estimatedHours && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Heures estimées:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{item.estimatedHours}h</span>
                        </div>
                      )}
                      {item.actualHours && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Heures réelles:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{item.actualHours}h</span>
                        </div>
                      )}
                    </div>

                    {/* Item controls */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-dark-700">
                      {/* Tailor assignment */}
                      <select
                        value={item.tailorId || ''}
                        onChange={(e) => updateItemTailor(item.id, e.target.value)}
                        className="flex-1 min-w-[150px] px-2 py-1 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white"
                      >
                        <option value="">Non assigné</option>
                        {tailors.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      {/* Status change */}
                      <select
                        value={item.status}
                        onChange={(e) => updateItemStatus(item.id, e.target.value)}
                        className="flex-1 min-w-[150px] px-2 py-1 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white"
                      >
                        {Object.entries(ITEM_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tailor info */}
                    {item.tailor && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assigné à {item.tailor.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline Section */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
            <button
              onClick={() => setTimelineExpanded(!timelineExpanded)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-400" />
                Historique ({order.timeline.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTimelineModal(true)
                  }}
                  className="p-1.5 bg-primary-500/10 hover:bg-primary-500/20 rounded transition-colors"
                >
                  <Plus className="h-4 w-4 text-primary-500" />
                </button>
                {timelineExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {timelineExpanded && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {order.timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-dark-700"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900 dark:text-white">{entry.event}</p>
                        {entry.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{entry.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(entry.createdAt).toLocaleString('fr-FR')}
                          {entry.userName && ` - ${entry.userName}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Control */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Statut de la commande</h3>
            <select
              value={order.status}
              onChange={(e) => updateOrderStatus(e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-400" />
              Dates
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Commande:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Retrait:</span>
                <span className={`font-medium ${daysUntilPickup <= 0 ? 'text-red-500' : daysUntilPickup <= 3 ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                  {new Date(order.pickupDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {order.customerDeadline && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Deadline client:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(order.customerDeadline).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-400" />
              Finances
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Coût tenues:</span>
                <span className="text-gray-900 dark:text-white">{order.totalCost.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Coût matériel:</span>
                <span className="text-gray-900 dark:text-white">{order.materialCost.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(order.totalCost + order.materialCost).toLocaleString()} FCFA
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-dark-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-green-500">Payé:</span>
                  <span className="text-green-500">{order.deposit.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-1">
                  <span className={order.balance > 0 ? 'text-orange-500' : 'text-green-500'}>Reliquat:</span>
                  <span className={order.balance > 0 ? 'text-orange-500' : 'text-green-500'}>
                    {order.balance.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un paiement
            </button>
          </div>

          {/* Payments Section */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
            <button
              onClick={() => setPaymentsExpanded(!paymentsExpanded)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary-400" />
                Paiements ({order.payments.length})
              </h3>
              {paymentsExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {paymentsExpanded && order.payments.length > 0 && (
              <div className="px-6 pb-6 space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-green-500">+{payment.amount.toLocaleString()} FCFA</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {payment.paymentType === 'DEPOSIT'
                            ? 'Avance'
                            : payment.paymentType === 'FINAL'
                              ? 'Solde'
                              : 'Acompte'}
                          {payment.paymentMethod && ` - ${payment.paymentMethod}`}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-gray-500 mt-2">{payment.notes}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-dark-700">
                      {payment.receivedBy && (
                        <p className="text-xs text-gray-400">Reçu par {payment.receivedBy.name}</p>
                      )}
                      {payment.receipt && (
                        <Link
                          href={`/admin/receipts/${payment.receipt.id}`}
                          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <Receipt className="h-3 w-3" />
                          {payment.receipt.receiptNumber}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary-400" />
                Notes
              </h3>
              {!editingNotes && (
                <button
                  onClick={() => {
                    setNotesValue(order.notes || '')
                    setEditingNotes(true)
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ajouter des notes..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {savingNotes && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Save className="h-3 w-3" />
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : order.notes ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{order.notes}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune note</p>
            )}
          </div>

          {/* Material Usages Section */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
            <button
              onClick={() => setMaterialsExpanded(!materialsExpanded)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Box className="h-4 w-4 text-primary-400" />
                Matériels utilisés ({materialUsages.length})
              </h3>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/materials/out?customOrderId=${orderId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-primary-500/10 hover:bg-primary-500/20 rounded transition-colors"
                  title="Ajouter sortie matériel"
                >
                  <Plus className="h-4 w-4 text-primary-500" />
                </Link>
                {materialsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {materialsExpanded && (
              <div className="px-6 pb-6">
                {materialUsages.length > 0 ? (
                  <>
                    <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Coût total: </span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {materialTotalCost.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="space-y-2">
                      {materialUsages.map((usage) => (
                        <div
                          key={usage.id}
                          className="p-3 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {usage.material.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {usage.quantity} {usage.material.unit}
                                {usage.tailor && ` - ${usage.tailor.name}`}
                              </p>
                            </div>
                            <p className="font-medium text-orange-500 text-sm">
                              {usage.totalCost.toLocaleString()} FCFA
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(usage.createdAt).toLocaleDateString('fr-FR')}
                            {usage.createdBy && ` par ${usage.createdBy.name}`}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/admin/materials/movements?customOrderId=${orderId}`}
                      className="block mt-3 text-center text-sm text-primary-500 hover:text-primary-400"
                    >
                      Voir tout l'historique
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Box className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Aucun matériel enregistré
                    </p>
                    <Link
                      href={`/admin/materials/out?customOrderId=${orderId}`}
                      className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400"
                    >
                      <Plus className="h-3 w-3" />
                      Enregistrer une sortie
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
            <button
              onClick={() => setAttachmentsExpanded(!attachmentsExpanded)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary-400" />
                Fichiers joints ({attachments.length})
              </h3>
              <div className="flex items-center gap-2">
                <label
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-primary-500/10 hover:bg-primary-500/20 rounded transition-colors cursor-pointer"
                  title="Ajouter un fichier"
                >
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    disabled={uploadingFile}
                  />
                  {uploadingFile ? (
                    <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-primary-500" />
                  )}
                </label>
                {attachmentsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {attachmentsExpanded && (
              <div className="px-6 pb-6">
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.fileType)
                      return (
                        <div
                          key={attachment.id}
                          className="p-3 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-gray-200 dark:bg-dark-700 rounded-lg">
                              <FileIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <a
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-500 truncate block"
                              >
                                {attachment.originalName}
                              </a>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(attachment.fileSize)}
                                {attachment.uploadedByName && ` - par ${attachment.uploadedByName}`}
                                {' - '}
                                {new Date(attachment.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors"
                              title="Ouvrir"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </a>
                            <button
                              onClick={() => deleteAttachment(attachment.id)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Paperclip className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Aucun fichier joint
                    </p>
                    <label className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400 cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        disabled={uploadingFile}
                      />
                      <Upload className="h-3 w-3" />
                      Ajouter un fichier (max 500MB)
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Invoice Section */}
          {order.invoice && (
            <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-400" />
                Facture liée
              </h3>
              <Link
                href={`/admin/invoices?search=${order.invoice.invoiceNumber}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <div>
                  <p className="font-mono text-blue-600 dark:text-blue-400 font-medium">
                    {order.invoice.invoiceNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${
                      order.invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      order.invoice.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.invoice.status === 'PAID' ? 'Payée' :
                       order.invoice.status === 'PARTIAL' ? 'Partielle' :
                       order.invoice.status === 'SENT' ? 'Envoyée' : order.invoice.status}
                    </span>
                    <span>{order.invoice.amountPaid.toLocaleString()} / {order.invoice.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ajouter un paiement</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder={`Reliquat: ${order.balance.toLocaleString()}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Mode de paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="MTN MoMo">MTN MoMo</option>
                  <option value="Wave">Wave</option>
                  <option value="Carte">Carte bancaire</option>
                  <option value="Virement">Virement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Date du paiement *</label>
                <input
                  type="datetime-local"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={addPayment}
                disabled={addingPayment || !paymentAmount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {addingPayment && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTimelineModal(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ajouter un événement</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Événement *</label>
                <input
                  type="text"
                  value={timelineEvent}
                  onChange={(e) => setTimelineEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Essayage effectué, Client contacté..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Description</label>
                <textarea
                  value={timelineDescription}
                  onChange={(e) => setTimelineDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Détails supplémentaires..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTimelineModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={addTimelineEntry}
                disabled={addingTimeline || !timelineEvent}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                {addingTimeline && <Loader2 className="h-4 w-4 animate-spin" />}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Supprimer la commande ?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Cette action est irréversible. La commande {order.orderNumber} et tous ses éléments seront supprimés.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={deleteOrder}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
