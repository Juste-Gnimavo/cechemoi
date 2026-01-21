'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Receipt,
  ArrowLeft,
  Download,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  ExternalLink,
  Trash2,
} from 'lucide-react'

interface ReceiptDetail {
  id: string
  receiptNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  amount: number
  paymentMethod: string
  paymentDate: string
  createdByName: string | null
  createdAt: string
  customOrder?: {
    id: string
    orderNumber: string
    customer: {
      id: string
      name: string | null
      phone: string
    }
  } | null
  invoice?: {
    id: string
    invoiceNumber: string
    total: number
    amountPaid: number
    status: string
  } | null
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Espèces',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOBILE_MONEY: 'MTN MoMo',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
  CARD: 'Carte bancaire',
  OTHER: 'Autre',
}

const invoiceStatusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Envoyee', color: 'bg-blue-100 text-blue-700' },
  PARTIAL: { label: 'Partielle', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Payee', color: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Annulee', color: 'bg-gray-100 text-gray-700' },
}

export default function ReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/admin/receipts/${params.id}`)
        const data = await res.json()
        if (data.success) {
          setReceipt(data.receipt)
        }
      } catch (error) {
        console.error('Error fetching receipt:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReceipt()
    }
  }, [params.id])

  const handleDownloadPdf = async () => {
    if (!receipt) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/admin/receipts/${receipt.id}/pdf`)
      if (!res.ok) throw new Error('PDF error')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reçu_${receipt.receiptNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!receipt) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce reçu ?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/receipts/${receipt.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/receipts')
      } else {
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Reçu non trouvé
        </h2>
        <Link href="/admin/receipts" className="text-purple-600 hover:underline">
          Retour aux reçus
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/receipts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-7 h-7 text-purple-600" />
              Reçu {receipt.receiptNumber}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Émis le {formatDate(receipt.paymentDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {downloading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Télécharger PDF
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
          >
            {deleting ? (
              <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Receipt Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                CECHEMOI
              </h2>
              <p className="text-sm text-gray-500">Couture & Mode</p>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                RECU DE PAIEMENT
              </h3>
              <p className="text-purple-600 font-mono mt-2">{receipt.receiptNumber}</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Montant paye</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(receipt.amount)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(receipt.paymentDate)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Mode de paiement
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
                </span>
              </div>
              {receipt.createdByName && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Reçu par</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {receipt.createdByName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Information client
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{receipt.customerName}</span>
              </div>
              {receipt.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{receipt.customerPhone}</span>
                </div>
              )}
              {receipt.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{receipt.customerEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Links */}
          {receipt.customOrder && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Commande liee
              </h3>
              <Link
                href={`/admin/custom-orders/${receipt.customOrder.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div>
                  <p className="font-mono text-purple-600 dark:text-purple-400">
                    {receipt.customOrder.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {receipt.customOrder.customer.name || receipt.customOrder.customer.phone}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          )}

          {receipt.invoice && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Facture liee
              </h3>
              <Link
                href={`/admin/invoices?search=${receipt.invoice.invoiceNumber}`}
                className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-blue-600 dark:text-blue-400">
                    {receipt.invoice.invoiceNumber}
                  </p>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${invoiceStatusLabels[receipt.invoice.status]?.color || 'bg-gray-100'}`}
                  >
                    {invoiceStatusLabels[receipt.invoice.status]?.label || receipt.invoice.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Total: {formatCurrency(receipt.invoice.total)}</p>
                  <p>Paye: {formatCurrency(receipt.invoice.amountPaid)}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
