'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  User,
  Package,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Printer,
  RefreshCw,
  Save,
  Loader2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  Download,
  Bell,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  X,
  Receipt,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'
import { AdminMessageModal, AdminMessageType } from '@/components/admin/admin-message-modal'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  productId?: string
  product?: {
    id: string
    name: string
    images: string[]
  }
}

interface InvoicePayment {
  id: string
  amount: number
  paymentMethod: string
  paymentType: 'DEPOSIT' | 'INSTALLMENT' | 'FINAL'
  reference: string | null
  paidAt: string
  notes: string | null
  createdBy: {
    id: string
    name: string
  } | null
  receipt: {
    id: string
    receiptNumber: string
  } | null
  createdAt: string
}

// Payment type labels and colors
const paymentTypeConfig: Record<string, { label: string; color: string }> = {
  DEPOSIT: { label: 'Avance', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  INSTALLMENT: { label: 'Acompte', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  FINAL: { label: 'Solde', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOBILE_MONEY: 'MTN MoMo',
  MOOV_MONEY: 'Moov Money',
  WAVE: 'Wave',
  PAIEMENTPRO: 'PaiementPro',
  CARD: 'Carte bancaire',
  PAYPAL: 'PayPal',
  OTHER: 'Autre',
}

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  status: string
  subtotal: number
  tax: number
  shippingCost: number
  discount: number
  total: number
  amountPaid: number
  notes: string | null
  issueDate: string
  dueDate: string | null
  paidDate: string | null
  createdAt: string
  updatedAt: string
  orderId: string | null
  order: {
    id: string
    orderNumber: string
    status: string
    user: {
      id: string
      name: string
      email: string | null
      phone: string
    }
    items: any[]
    shippingAddress: any
  } | null
  items: InvoiceItem[]
  createdBy: {
    id: string
    name: string
    email: string | null
  } | null
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  DRAFT: { color: 'bg-gray-500/20 text-gray-400 border-gray-500', icon: FileText, label: 'Brouillon' },
  SENT: { color: 'bg-blue-500/20 text-blue-400 border-blue-500', icon: Send, label: 'Envoyée' },
  PARTIAL: { color: 'bg-orange-500/20 text-orange-400 border-orange-500', icon: Wallet, label: 'Acompte' },
  PAID: { color: 'bg-green-500/20 text-green-400 border-green-500', icon: CheckCircle, label: 'Payée' },
  OVERDUE: { color: 'bg-red-500/20 text-red-400 border-red-500', icon: AlertCircle, label: 'En retard' },
  CANCELLED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500', icon: XCircle, label: 'Annulée' },
  REFUNDED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500', icon: RefreshCw, label: 'Remboursée' },
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { celebration, success } = useConfetti()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Payments state
  const [payments, setPayments] = useState<InvoicePayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    paymentType: '' as '' | 'DEPOSIT' | 'INSTALLMENT' | 'FINAL', // Empty means auto-detect
    reference: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: AdminMessageType
    title: string
    message: string
    secondaryMessage?: string
    onConfirm?: () => void
    confirmLabel?: string
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  // Editable fields
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editIssueDate, setEditIssueDate] = useState('')
  const [editPaidDate, setEditPaidDate] = useState('')

  useEffect(() => {
    fetchInvoice()
    fetchPayments()
  }, [params.id])

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true)
      const response = await fetch(`/api/admin/invoices/${params.id}/payments`)
      const data = await response.json()
      if (data.success) {
        setPayments(data.payments)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Veuillez entrer un montant valide')
      return
    }

    try {
      setAddingPayment(true)
      const response = await fetch(`/api/admin/invoices/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          paymentType: paymentForm.paymentType || undefined, // undefined = auto-detect
          reference: paymentForm.reference || null,
          paidAt: paymentForm.paidAt,
          notes: paymentForm.notes || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.invoice.isFullyPaid) {
          celebration({ duration: 2500 })
          toast.success('Facture entièrement payée!')
        } else {
          toast.success(data.message)
        }
        setShowPaymentModal(false)
        setPaymentForm({
          amount: '',
          paymentMethod: 'CASH',
          paymentType: '',
          reference: '',
          paidAt: new Date().toISOString().split('T')[0],
          notes: '',
        })
        fetchInvoice()
        fetchPayments()
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajout du paiement')
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Erreur lors de l\'ajout du paiement')
    } finally {
      setAddingPayment(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return

    try {
      const response = await fetch(`/api/admin/invoices/${params.id}/payments?paymentId=${paymentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Paiement supprimé')
        fetchInvoice()
        fetchPayments()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/invoices/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setInvoice(data.invoice)
        setEditStatus(data.invoice.status)
        setEditNotes(data.invoice.notes || '')
        setEditDueDate(data.invoice.dueDate ? data.invoice.dueDate.split('T')[0] : '')
        setEditIssueDate(data.invoice.issueDate ? data.invoice.issueDate.split('T')[0] : '')
        setEditPaidDate(data.invoice.paidDate ? data.invoice.paidDate.split('T')[0] : '')
      } else {
        toast.error(data.error || 'Erreur lors du chargement')
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Erreur lors du chargement de la facture')
    } finally {
      setLoading(false)
    }
  }

  const confirmStatusChange = (newStatus: string) => {
    const statusMessages: Record<string, { title: string; message: string }> = {
      PAID: { title: 'Marquer comme payée ?', message: 'Cette facture sera marquée comme payée.' },
      SENT: { title: 'Envoyer la facture ?', message: 'Le client sera notifié de cette facture.' },
      CANCELLED: { title: 'Annuler la facture ?', message: 'Cette action ne peut pas être annulée.' },
      REFUNDED: { title: 'Marquer comme remboursée ?', message: 'Cette facture sera marquée comme remboursée.' },
    }

    const config = statusMessages[newStatus] || { title: 'Changer le statut ?', message: `Le statut sera changé en ${newStatus}.` }

    setModal({
      isOpen: true,
      type: newStatus === 'CANCELLED' ? 'warning' : 'confirm',
      title: config.title,
      message: config.message,
      confirmLabel: 'Confirmer',
      onConfirm: () => handleStatusChange(newStatus),
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return

    setModal(prev => ({ ...prev, isOpen: false }))

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, sendNotification: notificationsEnabled }),
      })

      const data = await response.json()

      if (data.success) {
        // Celebrate when invoice is paid! 💰
        if (newStatus === 'PAID' && invoice.status !== 'PAID') {
          celebration({ duration: 2500 })
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Paiement reçu !',
            message: `La facture ${invoice.invoiceNumber} a été marquée comme payée.`,
            secondaryMessage: `Montant: ${new Intl.NumberFormat('fr-FR').format(invoice.total)} CFA`,
          })
        } else if (newStatus === 'SENT') {
          success()
          toast.success('Facture envoyée avec succès')
        } else {
          toast.success('Statut mis à jour avec succès')
        }
        fetchInvoice()
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!invoice) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes || null,
          dueDate: editDueDate || null,
          issueDate: editIssueDate || null,
          paidDate: editPaidDate || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Facture mise à jour avec succès')
        setIsEditing(false)
        fetchInvoice()
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleResendNotification = async () => {
    if (!invoice) return

    try {
      setSendingNotification(true)
      const response = await fetch(`/api/admin/invoices/${params.id}/resend-notification`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Notification envoyée avec succès')
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Erreur lors de l\'envoi de la notification')
    } finally {
      setSendingNotification(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const confirmDeleteInvoice = () => {
    if (!invoice) return

    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Supprimer la facture ?',
      message: `Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoiceNumber} ?`,
      secondaryMessage: 'Cette action supprimera également les articles et paiements associés. Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: handleDeleteInvoice,
    })
  }

  const handleDeleteInvoice = async () => {
    if (!invoice) return

    setModal(prev => ({ ...prev, isOpen: false }))

    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/invoices/${params.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Facture supprimée avec succès')
        router.push('/admin/invoices')
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Erreur lors de la suppression de la facture')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="h-4 w-4" />
        <span>{config.label}</span>
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Facture non trouvée</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/invoices"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Facture {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Créée le {formatDateTime(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={fetchInvoice}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            href={`/admin/invoices/${params.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg transition-all duration-200"
          >
            <Pencil className="h-4 w-4" />
            Modifier facture
          </Link>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
            >
              <Edit className="h-4 w-4" />
              Options
            </button>
          ) : (
            <button
              onClick={handleSaveChanges}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          )}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            Voir PDF
          </a>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download={`facture-${invoice.invoiceNumber}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </a>
          <button
            onClick={handleResendNotification}
            disabled={sendingNotification}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg transition-all duration-200"
          >
            {sendingNotification ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Renvoyer notif.
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
          {!['PAID', 'CANCELLED', 'REFUNDED'].includes(invoice.status) && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-green-500/25"
            >
              <Plus className="h-4 w-4" />
              AJOUTER UN ACOMPTE
            </button>
          )}
          <button
            onClick={confirmDeleteInvoice}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition-all duration-200"
          >
            <Trash2 className={`h-4 w-4 ${deleting ? 'animate-spin' : ''}`} />
            Supprimer
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CÈCHÉMOI</h1>
            <p className="text-gray-600">Mode sur-mesure et prêt-à-porter</p>
            <p className="text-gray-600">Abidjan, Côte d'Ivoire</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">FACTURE</h2>
            <p className="text-gray-600">{invoice.invoiceNumber}</p>
            <p className="text-gray-600">Date: {formatDate(invoice.issueDate)}</p>
            {invoice.dueDate && (
              <p className="text-gray-600">Échéance: {formatDate(invoice.dueDate)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Items */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden print:border-gray-300 print:shadow-none print:bg-white">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800 print:border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500 print:text-gray-600" />
                Articles facturés
              </h2>
            </div>
            <div className="p-6 print:p-4">
              <div className="space-y-4 print:space-y-2">
                {invoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-dark-800 last:border-0 last:pb-0 print:border-gray-200"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-dark-800 rounded-lg overflow-hidden flex-shrink-0 print:hidden">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.description}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white print:text-gray-900 font-medium">{item.description}</h3>
                      <p className="text-gray-500 dark:text-gray-400 print:text-gray-600 text-sm">
                        Qté: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white print:text-gray-900 font-semibold">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoice Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-800 print:border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-300 print:text-gray-600">
                  <span>Sous-total</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-300 print:text-gray-600">
                    <span>Taxes</span>
                    <span>{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                {invoice.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-300 print:text-gray-600">
                    <span>Frais de livraison</span>
                    <span>{formatCurrency(invoice.shippingCost)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-green-500 print:text-green-600">
                    <span>Remise</span>
                    <span>-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 dark:text-white print:text-gray-900 text-xl font-bold pt-3 border-t border-gray-200 dark:border-dark-700 print:border-gray-300">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>

                {/* Payment Summary */}
                {(invoice.amountPaid > 0 || payments.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 print:border-gray-300 space-y-2">
                    <div className="flex justify-between text-green-400 print:text-green-600">
                      <span>Montant payé</span>
                      <span>{formatCurrency(invoice.amountPaid || 0)}</span>
                    </div>
                    <div className={`flex justify-between font-semibold ${
                      (invoice.total - (invoice.amountPaid || 0)) > 0
                        ? 'text-orange-400 print:text-orange-600'
                        : 'text-green-400 print:text-green-600'
                    }`}>
                      <span>Solde restant</span>
                      <span>{formatCurrency(invoice.total - (invoice.amountPaid || 0))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payments History */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6 print:bg-white print:border-gray-300 print:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-gray-900 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary-500" />
                Historique des paiements
              </h2>
              {!['PAID', 'CANCELLED', 'REFUNDED'].includes(invoice.status) && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm transition-all print:hidden"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un paiement
                </button>
              )}
            </div>

            {loadingPayments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 print:text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-700 print:border-gray-300">
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium text-sm">Date</th>
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium text-sm">Type</th>
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium text-sm">Mode</th>
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium text-sm">Réf / Reçu</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium text-sm">Montant</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium text-sm print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const typeConfig = paymentTypeConfig[payment.paymentType] || paymentTypeConfig.INSTALLMENT

                      return (
                        <tr key={payment.id} className="border-b border-gray-200 dark:border-dark-800 print:border-gray-200 last:border-0">
                          <td className="py-3 text-gray-900 dark:text-white print:text-gray-900 text-sm">
                            {new Date(payment.paidAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="py-3 text-gray-900 dark:text-white print:text-gray-900 text-sm">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-dark-800 print:bg-gray-100 rounded text-xs">
                              {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600 dark:text-gray-300 print:text-gray-600 text-sm">
                            {payment.reference && <span className="block">{payment.reference}</span>}
                            {payment.receipt && (
                              <Link
                                href={`/admin/receipts/${payment.receipt.id}`}
                                className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs mt-1"
                              >
                                <Receipt className="h-3 w-3" />
                                {payment.receipt.receiptNumber}
                              </Link>
                            )}
                            {payment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                            )}
                            {!payment.reference && !payment.receipt && '-'}
                          </td>
                          <td className="py-3 text-right text-green-400 print:text-green-600 font-medium text-sm">
                            +{formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 text-right print:hidden">
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Supprimer ce paiement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 dark:border-dark-700 print:border-gray-300">
                      <td colSpan={3} className="py-3 text-right text-gray-500 dark:text-gray-400 print:text-gray-600 font-medium">
                        Total payé:
                      </td>
                      <td className="py-3 text-right text-green-400 print:text-green-600 font-bold">
                        {formatCurrency(invoice.amountPaid || 0)}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          {(invoice.notes || isEditing) && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6 print:bg-white print:border-gray-300 print:shadow-none">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-gray-900 mb-4">Notes</h2>
              {isEditing ? (
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Notes ou conditions de paiement..."
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300 print:text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Invoice Info */}
        <div className="space-y-6 print:hidden">
          {/* Status Management */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statut de la facture</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Statut actuel</span>
                {getStatusBadge(invoice.status)}
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Envoyer notification</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-primary-500' : 'bg-dark-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isEditing ? (
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">Changer le statut</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="SENT">Envoyée</option>
                    <option value="PARTIAL">Acompte versé</option>
                    <option value="PAID">Payée</option>
                    <option value="OVERDUE">En retard</option>
                    <option value="CANCELLED">Annulée</option>
                    <option value="REFUNDED">Remboursée</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {invoice.status !== 'PAID' && (
                    <button
                      onClick={() => confirmStatusChange('PAID')}
                      disabled={updating}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm transition-all"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marquer payée
                    </button>
                  )}
                  {invoice.status === 'DRAFT' && (
                    <button
                      onClick={() => confirmStatusChange('SENT')}
                      disabled={updating}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm transition-all"
                    >
                      <Send className="h-4 w-4" />
                      Envoyer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Client
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">{invoice.customerName}</p>
              </div>
              {invoice.customerPhone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.customerEmail && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{invoice.customerEmail}</span>
                </div>
              )}
              {invoice.customerAddress && (
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="whitespace-pre-wrap">{invoice.customerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              Dates
            </h2>
            {isEditing && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-400">
                  Mode édition: Modifiez les dates pour les commandes passées hors ligne
                </p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Date d'émission (création facture)</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editIssueDate}
                    onChange={(e) => setEditIssueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-orange-500/50 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{formatDate(invoice.issueDate)}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Date d'échéance</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Date de paiement</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editPaidDate}
                    onChange={(e) => setEditPaidDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-green-500/50 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className={invoice.paidDate ? 'text-green-400' : 'text-gray-500'}>
                    {invoice.paidDate ? formatDate(invoice.paidDate) : 'Non payée'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Linked Order */}
          {invoice.order && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-500" />
                Commande liée
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Numéro de commande</p>
                  <Link
                    href={`/admin/orders/${invoice.order.id}`}
                    className="text-primary-400 hover:text-primary-300 font-medium"
                  >
                    {invoice.order.orderNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Statut commande</p>
                  <p className="text-gray-900 dark:text-white">{invoice.order.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Created By */}
          {invoice.createdBy && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Créée par</h2>
              <div className="space-y-1">
                <p className="text-gray-900 dark:text-white font-medium">{invoice.createdBy.name}</p>
                {invoice.createdBy.email && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{invoice.createdBy.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
        <div className="text-center text-gray-600 text-sm">
          <p>Merci pour votre confiance!</p>
          <p>CÈCHÉMOI - cechemoicreations@gmail.com - +225 0759545410</p>
        </div>
      </div>

      {/* Confirmation/Success Modal */}
      <AdminMessageModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        secondaryMessage={modal.secondaryMessage}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        isProcessing={updating}
        autoClose={modal.type === 'success' ? 3000 : undefined}
      />

      {/* Add Payment Modal */}
      {showPaymentModal && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Ajouter un paiement
                  </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Payment Summary - Compact */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800/50 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payé</p>
                    <p className="text-base font-bold text-green-400">{formatCurrency(invoice.amountPaid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reste</p>
                    <p className="text-base font-bold text-orange-400">{formatCurrency(invoice.total - (invoice.amountPaid || 0))}</p>
                  </div>
                </div>
                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: String(invoice.total - (invoice.amountPaid || 0)) })}
                    className="px-3 py-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 font-medium"
                  >
                    Solder tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: String(Math.round((invoice.total - (invoice.amountPaid || 0)) / 2)) })}
                    className="px-3 py-1.5 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 font-medium"
                  >
                    50%
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body - 2 columns on desktop */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      Montant <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">CFA</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      Mode de paiement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <optgroup label="Paiements manuels">
                        <option value="CASH">Espèces</option>
                        <option value="BANK_TRANSFER">Virement bancaire</option>
                        <option value="CHECK">Chèque</option>
                      </optgroup>
                      <optgroup label="Mobile Money">
                        <option value="ORANGE_MONEY">Orange Money</option>
                        <option value="MTN_MOBILE_MONEY">MTN MoMo</option>
                        <option value="MOOV_MONEY">Moov Money</option>
                        <option value="WAVE">Wave</option>
                      </optgroup>
                      <optgroup label="Paiements en ligne">
                        <option value="CARD">Carte bancaire</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="PAIEMENTPRO">PaiementPro</option>
                      </optgroup>
                      <optgroup label="Autre">
                        <option value="OTHER">Autre</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      Date du paiement
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paidAt}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      Type de paiement
                    </label>
                    <select
                      value={paymentForm.paymentType}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as '' | 'DEPOSIT' | 'INSTALLMENT' | 'FINAL' })}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">🔄 Auto-détection</option>
                      <option value="DEPOSIT">🔵 Avance (1er paiement)</option>
                      <option value="INSTALLMENT">🟠 Acompte (intermédiaire)</option>
                      <option value="FINAL">🟢 Solde (final)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto = le système détermine le type
                    </p>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      Référence / N° transaction
                    </label>
                    <input
                      type="text"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      placeholder="Ex: TXN123456..."
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/30">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPayment}
                disabled={addingPayment || !paymentForm.amount}
                className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {addingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>{addingPayment ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
