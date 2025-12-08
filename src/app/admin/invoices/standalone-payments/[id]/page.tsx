'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Phone,
  User,
  Calendar,
  Hash,
  Send,
  Copy,
  ExternalLink,
  Bell,
  AlertTriangle,
  FileJson
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StandalonePayment {
  id: string
  reference: string
  amount: number
  customerName: string
  customerPhone: string
  channel: string | null
  status: string
  sessionId: string | null
  paymentId: string | null
  providerResponse: any
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  paidAt: string | null
  webhookReceived: boolean
  webhookReceivedAt: string | null
  notificationSent: boolean
  notificationSentAt: string | null
}

export default function StandalonePaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [payment, setPayment] = useState<StandalonePayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)

  const paymentId = params.id as string

  useEffect(() => {
    fetchPayment()
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/standalone-payments/${paymentId}`)
      const data = await res.json()

      if (data.success) {
        setPayment(data.payment)
      } else {
        toast.error(data.error || 'Paiement non trouvé')
        router.push('/admin/invoices/standalone-payments')
      }
    } catch (error) {
      console.error('Error fetching payment:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleResendNotification = async () => {
    try {
      setResending(true)
      const res = await fetch(`/api/admin/standalone-payments/${paymentId}?action=resend`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Notification renvoyée avec succès')
        fetchPayment()
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error resending notification:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setResending(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copié!`)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
      PENDING: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500', icon: Clock, label: 'En attente' },
      COMPLETED: { color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500', icon: CheckCircle, label: 'Payé' },
      FAILED: { color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500', icon: XCircle, label: 'Échoué' },
      REFUNDED: { color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500', icon: RefreshCw, label: 'Remboursé' },
    }
    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${badge.bgColor} ${badge.color}`}>
        <Icon className="h-5 w-5" />
        {badge.label}
      </span>
    )
  }

  const getChannelLabel = (channel: string | null) => {
    const channels: Record<string, string> = {
      OMCIV2: 'Orange Money',
      MOMOCI: 'MTN MoMo',
      FLOOZ: 'Moov Money',
      WAVECI: 'Wave',
      CARD: 'Carte Bancaire',
      PAYPAL: 'PayPal',
    }
    return channel ? channels[channel] || channel : 'Non spécifié'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!payment) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/invoices/standalone-payments"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-primary-500" />
              Paiement {payment.reference}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Détails du paiement autonome
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(payment.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Info Card */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Informations du paiement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Montant</label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatAmount(payment.amount)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Canal de paiement</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                  {getChannelLabel(payment.channel)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Référence</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="font-mono text-sm bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                    {payment.reference}
                  </code>
                  <button
                    onClick={() => copyToClipboard(payment.reference, 'Référence')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Lien de paiement</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="font-mono text-xs bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-gray-900 dark:text-white truncate max-w-[200px]">
                    /payer/{payment.amount}
                  </code>
                  <button
                    onClick={() => copyToClipboard(`https://cave-express.ci/payer/${payment.amount}`, 'Lien')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                  <a
                    href={`/payer/${payment.amount}`}
                    target="_blank"
                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Informations client
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Nom complet</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                  {payment.customerName}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Téléphone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${payment.customerPhone}`}
                    className="text-primary-500 hover:underline"
                  >
                    {payment.customerPhone}
                  </a>
                  <a
                    href={`https://wa.me/${payment.customerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded text-green-500"
                    title="Ouvrir WhatsApp"
                  >
                    <Send className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              Chronologie
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Paiement initié</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</p>
                </div>
              </div>

              {payment.webhookReceived && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Webhook reçu</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.webhookReceivedAt)}</p>
                  </div>
                </div>
              )}

              {payment.status === 'COMPLETED' && payment.paidAt && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Paiement confirmé</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.paidAt)}</p>
                  </div>
                </div>
              )}

              {payment.status === 'FAILED' && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Paiement échoué</p>
                    {payment.errorMessage && (
                      <p className="text-sm text-red-400 mt-1">{payment.errorMessage}</p>
                    )}
                  </div>
                </div>
              )}

              {payment.notificationSent && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Bell className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Notification envoyée</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.notificationSentAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Provider Response */}
          {payment.providerResponse && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary-500" />
                Réponse PaiementPro
              </h2>
              <pre className="bg-gray-100 dark:bg-dark-700 p-4 rounded-lg text-sm overflow-x-auto text-gray-900 dark:text-white">
                {JSON.stringify(payment.providerResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleResendNotification}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-lg transition-colors"
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Renvoyer notification
              </button>

              <button
                onClick={() => copyToClipboard(`https://cave-express.ci/payer/${payment.amount}`, 'Lien de paiement')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copier lien de paiement
              </button>

              <a
                href={`https://wa.me/${payment.customerPhone.replace(/\D/g, '')}?text=Bonjour ${payment.customerName}, concernant votre paiement de ${formatAmount(payment.amount)} (Ref: ${payment.reference})`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
                Contacter sur WhatsApp
              </a>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Détails techniques
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">ID</span>
                <code className="font-mono text-xs text-gray-900 dark:text-white">{payment.id}</code>
              </div>

              {payment.sessionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Session ID</span>
                  <code className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[150px]">
                    {payment.sessionId}
                  </code>
                </div>
              )}

              {payment.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Payment ID</span>
                  <code className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[150px]">
                    {payment.paymentId}
                  </code>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Webhook reçu</span>
                {payment.webhookReceived ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Notification envoyée</span>
                {payment.notificationSent ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
