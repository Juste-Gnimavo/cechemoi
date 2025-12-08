'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Printer,
  RefreshCw,
  DollarSign,
  FileText,
  Download,
  Eye,
  Bell,
  Calendar,
  Edit,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import OrderNotes from '@/components/admin/order-notes'
import RefundModal from '@/components/admin/refund-modal'
import { useConfetti } from '@/hooks/useConfetti'
import { AdminMessageModal, AdminMessageType } from '@/components/admin/admin-message-modal'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  tax: number
  shippingCost: number
  discount: number
  total: number
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    phone: string
    whatsappNumber?: string
    email?: string
  }
  shippingAddress: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    zipCode?: string
    country: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    total: number
    product: {
      id: string
      name: string
      slug: string
      images: string[]
      sku: string
    }
  }>
  orderNotes: Array<{
    id: string
    content: string
    noteType: string
    authorName: string
    createdAt: string
  }>
  refunds: Array<{
    id: string
    amount: number
    reason: string
    refundType: string
    status: string
    createdAt: string
    processedAt?: string
  }>
  invoice?: {
    id: string
    invoiceNumber: string
    status: string
    total: number
    issueDate: string
  }
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  COMPLETED: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
}

const paymentMethodLabels: Record<string, string> = {
  STRIPE: 'Carte bancaire (Stripe)',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOBILE_MONEY: 'MTN Mobile Money',
  CASH_ON_DELIVERY: 'Paiement à la livraison',
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { celebration, success } = useConfetti()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editOrderDate, setEditOrderDate] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.order)
      } else {
        toast.error(data.error || 'Erreur lors du chargement')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Erreur lors du chargement de la commande')
    } finally {
      setLoading(false)
    }
  }

  const confirmStatusChange = (newStatus: string) => {
    const statusMessages: Record<string, { title: string; message: string; type: AdminMessageType }> = {
      PROCESSING: { title: 'Passer en traitement ?', message: 'La commande sera marquée en cours de traitement.', type: 'confirm' },
      SHIPPED: { title: 'Marquer comme expédiée ?', message: 'Le client sera notifié de l\'expédition.', type: 'confirm' },
      DELIVERED: { title: 'Marquer comme livrée ?', message: 'La commande sera marquée comme livrée.', type: 'confirm' },
      CANCELLED: { title: 'Annuler la commande ?', message: 'Cette action ne peut pas être annulée. Le stock sera restauré.', type: 'warning' },
      REFUNDED: { title: 'Marquer comme remboursée ?', message: 'La commande sera marquée comme remboursée.', type: 'warning' },
    }

    const config = statusMessages[newStatus] || { title: 'Changer le statut ?', message: `Le statut sera changé en ${newStatus}.`, type: 'confirm' as AdminMessageType }

    setModal({
      isOpen: true,
      type: config.type,
      title: config.title,
      message: config.message,
      confirmLabel: 'Confirmer',
      onConfirm: () => handleStatusChange(newStatus),
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    setModal(prev => ({ ...prev, isOpen: false }))

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, sendNotification: notificationsEnabled }),
      })

      const data = await response.json()

      if (data.success) {
        // Celebrate when order is shipped! 🚚
        if (newStatus === 'SHIPPED' && order.status !== 'SHIPPED') {
          success()
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Commande expédiée !',
            message: `La commande ${order.orderNumber} est en route vers le client.`,
            secondaryMessage: 'Le client a été notifié de l\'expédition.',
          })
        }
        // Celebrate when order is delivered! 📦✨
        else if (newStatus === 'DELIVERED' && order.status !== 'DELIVERED') {
          celebration({ duration: 2000 })
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Commande livrée !',
            message: `La commande ${order.orderNumber} a été livrée avec succès.`,
            secondaryMessage: 'Le client a été notifié.',
          })
        } else {
          toast.success('Statut mis à jour avec succès')
        }
        fetchOrder()
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

  const confirmPaymentStatusChange = (newPaymentStatus: string) => {
    const statusMessages: Record<string, { title: string; message: string; type: AdminMessageType }> = {
      COMPLETED: { title: 'Confirmer le paiement ?', message: 'Le paiement sera marqué comme reçu.', type: 'confirm' },
      FAILED: { title: 'Marquer comme échoué ?', message: 'Le paiement sera marqué comme échoué.', type: 'warning' },
      REFUNDED: { title: 'Marquer comme remboursé ?', message: 'Le paiement sera marqué comme remboursé.', type: 'warning' },
    }

    const config = statusMessages[newPaymentStatus] || { title: 'Changer le statut ?', message: `Le statut sera changé en ${newPaymentStatus}.`, type: 'confirm' as AdminMessageType }

    setModal({
      isOpen: true,
      type: config.type,
      title: config.title,
      message: config.message,
      confirmLabel: 'Confirmer',
      onConfirm: () => handlePaymentStatusChange(newPaymentStatus),
    })
  }

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    if (!order) return

    setModal(prev => ({ ...prev, isOpen: false }))

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus, sendNotification: notificationsEnabled }),
      })

      const data = await response.json()

      if (data.success) {
        // Celebrate when payment is confirmed! 💰
        if (newPaymentStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED') {
          celebration({ duration: 2500 })
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Paiement reçu !',
            message: `Le paiement de ${order.total.toLocaleString()} CFA a été confirmé.`,
            secondaryMessage: `Commande ${order.orderNumber}`,
          })
        } else {
          toast.success('Statut de paiement mis à jour')
        }
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveOrderDate = async () => {
    if (!order || !editOrderDate) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderDate: editOrderDate }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Date de commande mise à jour')
        setIsEditingDate(false)
        fetchOrder()
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating order date:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const startEditingDate = () => {
    if (order) {
      // Format date for datetime-local input
      const date = new Date(order.createdAt)
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setEditOrderDate(localDateTime)
      setIsEditingDate(true)
    }
  }

  const confirmDeleteOrder = () => {
    if (!order) return

    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Supprimer la commande ?',
      message: `Êtes-vous sûr de vouloir supprimer la commande #${order.orderNumber} ?`,
      secondaryMessage: 'Cette action supprimera également la facture, les articles, les notes et les remboursements associés. Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: handleDeleteOrder,
    })
  }

  const handleDeleteOrder = async () => {
    if (!order) return

    setModal(prev => ({ ...prev, isOpen: false }))

    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Commande supprimée avec succès')
        router.push('/admin/orders')
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Erreur lors de la suppression de la commande')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Commande non trouvée</div>
      </div>
    )
  }

  const totalRefunded = order.refunds
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Commande #{order.orderNumber}
            </h1>
            {isEditingDate ? (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-orange-400" />
                <input
                  type="datetime-local"
                  value={editOrderDate}
                  onChange={(e) => setEditOrderDate(e.target.value)}
                  className="px-2 py-1 bg-gray-100 dark:bg-dark-800 border border-orange-500/50 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleSaveOrderDate}
                  disabled={updating}
                  className="p-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 dark:text-green-400 rounded transition-colors"
                  title="Enregistrer"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsEditingDate(false)}
                  className="p-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-500 dark:text-gray-400 rounded transition-colors"
                  title="Annuler"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <button
                  onClick={startEditingDate}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                  title="Modifier la date (commande offline)"
                >
                  <Edit className="h-3 w-3 text-gray-500 hover:text-orange-400" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchOrder}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
          <button
            onClick={confirmDeleteOrder}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition-all duration-200"
          >
            <Trash2 className={`h-4 w-4 ${deleting ? 'animate-spin' : ''}`} />
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                Articles commandés
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-dark-800 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-dark-800 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white font-medium">{item.product.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">SKU: {item.product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {item.quantity} × {item.price.toLocaleString()} CFA
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Total: {item.total.toLocaleString()} CFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-800 space-y-2">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Sous-total</span>
                  <span>{order.subtotal.toLocaleString()} CFA</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Taxes</span>
                    <span>{order.tax.toLocaleString()} CFA</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Frais de livraison</span>
                    <span>{order.shippingCost.toLocaleString()} CFA</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-500">
                    <span>Réduction</span>
                    <span>-{order.discount.toLocaleString()} CFA</span>
                  </div>
                )}
                {totalRefunded > 0 && (
                  <div className="flex justify-between text-red-500 dark:text-red-400">
                    <span>Remboursé</span>
                    <span>-{totalRefunded.toLocaleString()} CFA</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 dark:text-white text-lg font-bold pt-2 border-t border-gray-200 dark:border-dark-700">
                  <span>Total</span>
                  <span>{order.total.toLocaleString()} CFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <OrderNotes orderId={order.id} notes={order.orderNotes} onUpdate={fetchOrder} />
        </div>

        {/* Right Column - Order Info */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statut de la commande</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">Statut commande</label>
                <select
                  value={order.status}
                  onChange={(e) => {
                    if (e.target.value !== order.status) {
                      confirmStatusChange(e.target.value)
                    }
                  }}
                  disabled={updating}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                >
                  <option value="PENDING">En attente</option>
                  <option value="PROCESSING">En traitement</option>
                  <option value="SHIPPED">Expédié (livreur a récupéré)</option>
                  <option value="DELIVERED">Livré (Livreur a livré au client)</option>
                  <option value="CANCELLED">Annulé</option>
                  <option value="REFUNDED">Remboursé</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">Statut paiement</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => {
                    if (e.target.value !== order.paymentStatus) {
                      confirmPaymentStatusChange(e.target.value)
                    }
                  }}
                  disabled={updating}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                >
                  <option value="PENDING">En attente</option>
                  <option value="COMPLETED">Payé</option>
                  <option value="FAILED">Échoué</option>
                  <option value="REFUNDED">Remboursé</option>
                </select>
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Envoyer notification</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
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
                <p className="text-gray-900 dark:text-white font-medium">{order.user.name}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{order.user.phone}</span>
              </div>
              {order.user.whatsappNumber && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>WhatsApp: {order.user.whatsappNumber}</span>
                </div>
              )}
              {order.user.email && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{order.user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-500" />
              Adresse de livraison
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p className="text-gray-900 dark:text-white font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.zipCode && `, ${order.shippingAddress.zipCode}`}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Paiement
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Méthode de paiement</p>
                <p className="text-gray-900 dark:text-white">{paymentMethodLabels[order.paymentMethod]}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Statut</p>
                <p className="text-gray-900 dark:text-white">{paymentStatusLabels[order.paymentStatus]}</p>
              </div>
            </div>
          </div>

          {/* Invoice Section */}
          {order.invoice && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-500" />
                Facture
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Numéro de facture</p>
                  <Link
                    href={`/admin/invoices/${order.invoice.id}`}
                    className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium"
                  >
                    {order.invoice.invoiceNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Date d'émission</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(order.invoice.issueDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Montant</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {order.invoice.total.toLocaleString()} CFA
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <a
                    href={`/api/invoices/${order.invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg text-sm transition-all duration-200"
                  >
                    <Eye className="h-4 w-4" />
                    Voir PDF
                  </a>
                  <a
                    href={`/api/invoices/${order.invoice.id}/pdf`}
                    download={`facture-${order.invoice.invoiceNumber}.pdf`}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg text-sm transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Refund Section */}
          {order.paymentStatus === 'COMPLETED' && order.status !== 'REFUNDED' && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red shadow-sm shadow-red-500/10-500 border border-red-500/20 rounded-lg transition-all duration-200"
            >
              <DollarSign className="h-4 w-4" />
              Traiter un remboursement
            </button>
          )}

          {/* Refund History */}
          {order.refunds.length > 0 && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique des remboursements</h2>
              <div className="space-y-3">
                {order.refunds.map((refund) => (
                  <div key={refund.id} className="pb-3 border-b border-gray-200 dark:border-dark-800 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {refund.amount.toLocaleString()} CFA
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          refund.status === 'processed'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-500'
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                        }`}
                      >
                        {refund.status}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{refund.reason}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      {new Date(refund.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <RefundModal
          orderId={order.id}
          orderTotal={order.total}
          totalRefunded={totalRefunded}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            setShowRefundModal(false)
            fetchOrder()
          }}
        />
      )}

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
    </div>
  )
}
