'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  Phone,
  Mail,
  MessageCircle,
  CalendarDays,
  Clock,
  User,
  CreditCard,
  FileText,
  Send,
  Loader2,
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  Save
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ConsultationType {
  id: string
  name: string
  slug: string
  description: string
  price: number
  duration: number
  color: string
  icon: string
}

interface Appointment {
  id: string
  reference: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  customerNotes: string | null
  date: string
  time: string
  duration: number
  status: string
  paymentStatus: string
  paymentMethod: string | null
  paidAmount: number
  price: number
  adminNotes: string | null
  confirmedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
  type: ConsultationType
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  CONFIRMED: { label: 'Confirmé', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  COMPLETED: { label: 'Terminé', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  CANCELLED: { label: 'Annulé', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  NO_SHOW: { label: 'Absent', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' }
}

const paymentConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  UNPAID: { label: 'Non payé', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  PAID: { label: 'Payé', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  REFUNDED: { label: 'Remboursé', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  QUOTE_PENDING: { label: 'Sur devis', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' }
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)

  // Editable fields
  const [adminNotes, setAdminNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    fetchAppointment()
  }, [id])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/appointments/${id}`)
      const data = await response.json()

      if (data.appointment) {
        setAppointment(data.appointment)
        setAdminNotes(data.appointment.adminNotes || '')
      } else {
        toast.error('Rendez-vous non trouvé')
        router.push('/admin/appointments/list')
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Sur devis'
    return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA'
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!appointment) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        toast.success(`Statut mis à jour: ${statusConfig[newStatus]?.label}`)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentUpdate = async (newPaymentStatus: string) => {
    if (!appointment) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        toast.success(`Paiement mis à jour: ${paymentConfig[newPaymentStatus]?.label}`)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!appointment) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes })
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setEditingNotes(false)
        toast.success('Notes enregistrées')
      } else {
        toast.error('Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setUpdating(false)
    }
  }

  const handleSendNotification = async (type: string) => {
    if (!appointment) return
    if (type === 'custom' && !customMessage.trim()) {
      toast.error('Veuillez saisir un message')
      return
    }

    setSendingNotification(true)
    try {
      const response = await fetch(`/api/admin/appointments/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          customMessage: type === 'custom' ? customMessage : undefined
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const channels = []
        if (data.channels?.sms) channels.push('SMS')
        if (data.channels?.whatsapp) channels.push('WhatsApp')
        toast.success(`Notification envoyée (${channels.join(' + ')})`)
        setCustomMessage('')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Rendez-vous non trouvé</p>
        <Link href="/admin/appointments/list" className="text-primary-500 hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const status = statusConfig[appointment.status] || statusConfig.PENDING
  const payment = paymentConfig[appointment.paymentStatus] || paymentConfig.UNPAID

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/appointments/list"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rendez-vous #{appointment.reference}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Créé le {formatDateTime(appointment.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${payment.bgColor} ${payment.color}`}>
            {payment.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Informations client
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: appointment.type?.color || '#6b7280' }}
                >
                  {appointment.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {appointment.customerName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">Client</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                    <a href={`tel:${appointment.customerPhone}`} className="text-gray-900 dark:text-white font-medium hover:text-primary-500">
                      {appointment.customerPhone}
                    </a>
                  </div>
                </div>

                {appointment.customerEmail && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <a href={`mailto:${appointment.customerEmail}`} className="text-gray-900 dark:text-white font-medium hover:text-primary-500">
                        {appointment.customerEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {appointment.customerNotes && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notes du client</p>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    {appointment.customerNotes}
                  </p>
                </div>
              )}

              {/* Quick Contact Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={`https://wa.me/${appointment.customerPhone.replace(/\s/g, '')}?text=Bonjour ${appointment.customerName}, concernant votre rendez-vous ${appointment.reference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${appointment.customerPhone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Appeler
                </a>
              </div>
            </div>
          </div>

          {/* Appointment Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              Détails du rendez-vous
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Service</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: appointment.type?.color }}
                  />
                  <p className="text-gray-900 dark:text-white font-medium">{appointment.type?.name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(appointment.date)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Heure</p>
                <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {appointment.time}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Durée</p>
                <p className="text-gray-900 dark:text-white font-medium">{appointment.duration} minutes</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Prix</p>
                <p className="text-gray-900 dark:text-white font-semibold text-lg">{formatPrice(appointment.price)}</p>
              </div>

              {appointment.paidAmount > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Montant payé</p>
                  <p className="text-green-600 font-semibold text-lg">{formatPrice(appointment.paidAmount)}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Historique</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Créé le {formatDateTime(appointment.createdAt)}</span>
                </div>
                {appointment.confirmedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">Confirmé le {formatDateTime(appointment.confirmedAt)}</span>
                  </div>
                )}
                {appointment.completedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">Terminé le {formatDateTime(appointment.completedAt)}</span>
                  </div>
                )}
                {appointment.cancelledAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-gray-600 dark:text-gray-400">Annulé le {formatDateTime(appointment.cancelledAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Notes Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                Notes admin
              </h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingNotes(false)
                      setAdminNotes(appointment.adminNotes || '')
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={updating}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {appointment.adminNotes || 'Aucune note'}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Changer le statut
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handleStatusUpdate('CONFIRMED')}
                disabled={updating || appointment.status === 'CONFIRMED'}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirmer
              </button>
              <button
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={updating || appointment.status === 'COMPLETED'}
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Terminer
              </button>
              <button
                onClick={() => handleStatusUpdate('NO_SHOW')}
                disabled={updating || appointment.status === 'NO_SHOW'}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                Client absent
              </button>
              <button
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={updating || appointment.status === 'CANCELLED'}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-500" />
              Paiement
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handlePaymentUpdate('PAID')}
                disabled={updating || appointment.paymentStatus === 'PAID'}
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Marquer payé
              </button>
              <button
                onClick={() => handlePaymentUpdate('REFUNDED')}
                disabled={updating || appointment.paymentStatus === 'REFUNDED'}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Rembourser
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              Notifications
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Envoyer SMS + WhatsApp au client
            </p>

            {/* Quick Templates */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleSendNotification('confirmation')}
                disabled={sendingNotification}
                className="w-full px-4 py-2.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors text-sm"
              >
                Envoyer confirmation
              </button>
              <button
                onClick={() => handleSendNotification('reminder')}
                disabled={sendingNotification}
                className="w-full px-4 py-2.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-lg font-medium transition-colors text-sm"
              >
                Envoyer rappel
              </button>
              <button
                onClick={() => handleSendNotification('cancellation')}
                disabled={sendingNotification}
                className="w-full px-4 py-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors text-sm"
              >
                Envoyer annulation
              </button>
            </div>

            {/* Custom Message */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Message personnalisé</p>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Votre message..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSendNotification('custom')}
                disabled={sendingNotification || !customMessage.trim()}
                className="w-full mt-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {sendingNotification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
