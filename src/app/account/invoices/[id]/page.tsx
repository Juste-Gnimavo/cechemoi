'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Calendar,
  CreditCard,
  Package,
  Printer,
  X,
  Check,
  Wallet
} from 'lucide-react'
import Link from 'next/link'

// Payment channels configuration
const paymentChannels = [
  { code: 'OMCIV2', name: 'Orange Money', color: 'bg-orange-500', abbr: 'OM' },
  { code: 'MOMOCI', name: 'MTN MoMo', color: 'bg-yellow-400', abbr: 'MTN' },
  { code: 'FLOOZ', name: 'Moov Money', color: 'bg-blue-600', abbr: 'M' },
  { code: 'WAVECI', name: 'Wave', color: 'bg-cyan-500', abbr: 'W' },
  { code: 'CARD', name: 'Carte', color: 'bg-purple-600', abbr: 'CB' },
  { code: 'PAYPAL', name: 'PayPal', color: 'bg-[#003087]', abbr: 'PP' },
]

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  product?: {
    id: string
    name: string
    slug: string
    images: string[]
  } | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  status: string
  issueDate: string
  dueDate: string | null
  paidDate: string | null
  subtotal: number
  tax: number
  shippingCost: number
  discount: number
  total: number
  notes: string | null
  pdfUrl: string | null
  currency: string
  order: {
    id: string
    orderNumber: string
  } | null
  items: InvoiceItem[]
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/invoices')
      return
    }

    if (!session) return

    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/account/invoices/${id}`)
        if (res.ok) {
          const data = await res.json()
          setInvoice(data.invoice)
        } else {
          router.push('/account/invoices')
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id, session, router, status])

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      SENT: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock, label: 'Envoyée' },
      PAID: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Payée' },
      OVERDUE: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle, label: 'En retard' },
      CANCELLED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle, label: 'Annulée' },
      REFUNDED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: FileText, label: 'Remboursée' },
    }

    const badge = badges[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: FileText, label: status }
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${badge.color}`}>
        <Icon className="h-4 w-4" />
        <span>{badge.label}</span>
      </span>
    )
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

  // Handle payment submission
  const handlePayment = async () => {
    if (!selectedChannel) {
      setPaymentError('Veuillez sélectionner un mode de paiement')
      return
    }

    setIsPaymentLoading(true)
    setPaymentError('')

    try {
      const response = await fetch(`/api/invoices/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: selectedChannel }),
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setPaymentError(data.error || 'Erreur lors de l\'initialisation du paiement')
        setIsPaymentLoading(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setPaymentError('Erreur de connexion. Veuillez réessayer.')
      setIsPaymentLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950 print:bg-white print:min-h-0">
      <div className="print:hidden">
        <CustomerHeader />
      </div>

      {/* Print Header */}
      <div className="hidden print:block p-8 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CAVE EXPRESS</h1>
            <p className="text-gray-600">Vente de vins et spiritueux</p>
            <p className="text-gray-600">Abidjan, Côte d'Ivoire</p>
            <p className="text-gray-600">Tel: +225 05 56 79 14 31</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">FACTURE</h2>
            <p className="text-gray-600 font-medium">{invoice.invoiceNumber}</p>
            <p className="text-gray-600 mt-2">Date: {formatDate(invoice.issueDate)}</p>
            {invoice.dueDate && (
              <p className="text-gray-600">Échéance: {formatDate(invoice.dueDate)}</p>
            )}
            {invoice.paidDate && (
              <p className="text-green-600 font-medium">Payé le: {formatDate(invoice.paidDate)}</p>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 print:p-8">
        <div className="max-w-4xl mx-auto print:max-w-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 print:hidden">
            <div>
              <Link
                href="/account/invoices"
                className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm mb-2 inline-block"
              >
                ← Retour aux factures
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Facture {invoice.invoiceNumber}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Emise le {formatDate(invoice.issueDate)}
              </p>
            </div>
            {getStatusBadge(invoice.status)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1 print:gap-4">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6 print:col-span-1">
              {/* Invoice Items */}
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 print:bg-white print:border-gray-300 print:shadow-none print:p-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white print:text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary-500 print:text-gray-600" />
                  Détails de la facture
                </h2>
                <div className="space-y-4">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-dark-800 print:border-gray-200 last:border-0">
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white print:text-gray-900 font-medium">{item.description}</p>
                        <p className="text-gray-500 dark:text-gray-400 print:text-gray-600 text-sm mt-1">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="text-gray-900 dark:text-white print:text-gray-900 font-bold">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t border-gray-200 dark:border-dark-800 print:border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 print:text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 print:text-green-600">
                      <span>Réduction</span>
                      <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  {invoice.shippingCost > 0 && (
                    <div className="flex justify-between text-gray-500 dark:text-gray-400 print:text-gray-600">
                      <span>Livraison</span>
                      <span>{formatCurrency(invoice.shippingCost)}</span>
                    </div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-gray-500 dark:text-gray-400 print:text-gray-600">
                      <span>Taxe</span>
                      <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-900 dark:text-white print:text-gray-900 font-bold text-lg pt-2 border-t border-gray-300 dark:border-dark-700 print:border-gray-300">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Notes</h3>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar - Hidden on print */}
            <div className="space-y-6 print:hidden">
              {/* Dates */}
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Date d'émission</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(invoice.issueDate)}</p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Date d'échéance</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(invoice.dueDate)}</p>
                    </div>
                  )}
                  {invoice.paidDate && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Date de paiement</p>
                      <p className="text-green-600 dark:text-green-400">{formatDate(invoice.paidDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-500" />
                  Informations
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Client</p>
                    <p className="text-gray-900 dark:text-white font-medium">{invoice.customerName}</p>
                  </div>
                  {invoice.customerEmail && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">{invoice.customerEmail}</p>
                    </div>
                  )}
                  {invoice.customerPhone && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Téléphone</p>
                      <p className="text-gray-900 dark:text-white">{invoice.customerPhone}</p>
                    </div>
                  )}
                  {invoice.customerAddress && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Adresse</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-line">{invoice.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Order */}
              {invoice.order && (
                <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary-500" />
                    Commande associée
                  </h3>
                  <Link
                    href={`/account/orders/${invoice.order.id}`}
                    className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium"
                  >
                    Commande #{invoice.order.orderNumber} →
                  </Link>
                </div>
              )}

              {/* Pay Invoice Button - Only for SENT status */}
              {invoice.status === 'SENT' && (
                <button
                  onClick={() => {
                    setShowPaymentModal(true)
                    setSelectedChannel('')
                    setPaymentError('')
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 px-4 py-4 rounded-lg transition-all duration-200 font-semibold text-lg"
                >
                  <Wallet className="h-6 w-6" />
                  Payer cette facture
                </button>
              )}

              {/* View PDF */}
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-4 py-3 rounded-lg transition-all duration-200 print:hidden"
              >
                <FileText className="h-5 w-5" />
                Voir le PDF
              </a>

              {/* Download PDF */}
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                download={`facture-${invoice.invoiceNumber}.pdf`}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white border border-gray-200 dark:border-dark-700 px-4 py-3 rounded-lg transition-all duration-200 print:hidden"
              >
                <Download className="h-5 w-5" />
                Télécharger le PDF
              </a>

              {/* Print Invoice */}
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-700 px-4 py-3 rounded-lg transition-all duration-200 print:hidden"
              >
                <Printer className="h-5 w-5" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Print Footer */}
      <div className="hidden print:block p-8 border-t border-gray-300 text-center text-gray-600 text-sm">
        <p className="font-medium">Merci pour votre confiance!</p>
        <p className="mt-2">CAVE EXPRESS - contact@cave-express.ci - +225 05 56 79 14 31</p>
        <p>www.cave-express.ci</p>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Payer la facture
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {invoice.invoiceNumber} - {formatCurrency(invoice.total)}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isPaymentLoading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choisissez votre mode de paiement :
              </p>

              {/* Payment Channels Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {paymentChannels.map((channel) => (
                  <button
                    key={channel.code}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(channel.code)
                      setPaymentError('')
                    }}
                    disabled={isPaymentLoading}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      selectedChannel === channel.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                        : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                    } ${isPaymentLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {selectedChannel === channel.code && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full ${channel.color} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${channel.code === 'MOMOCI' ? 'text-black' : 'text-white'}`}>
                          {channel.abbr}
                        </span>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium text-center">
                        {channel.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                    {paymentError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                disabled={isPaymentLoading || !selectedChannel}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isPaymentLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Payer {formatCurrency(invoice.total)}
                  </>
                )}
              </button>

              <p className="text-center text-gray-400 text-xs mt-3">
                Paiement sécurisé par PaiementPro
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
