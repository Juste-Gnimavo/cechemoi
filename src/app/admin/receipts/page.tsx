'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Receipt,
  Search,
  Download,
  Calendar,
  ArrowLeft,
  ArrowRight,
  FileText,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'

interface ReceiptData {
  id: string
  receiptNumber: string
  customerName: string
  customerPhone: string | null
  amount: number
  paymentMethod: string
  paymentDate: string
  customOrder?: {
    id: string
    orderNumber: string
  } | null
  invoice?: {
    id: string
    invoiceNumber: string
  } | null
}

interface Stats {
  today: { count: number; total: number }
  week: { count: number; total: number }
  month: { count: number; total: number }
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Especes',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOBILE_MONEY: 'MTN MoMo',
  BANK_TRANSFER: 'Virement',
  CHECK: 'Cheque',
  CARD: 'Carte',
  OTHER: 'Autre',
}

export default function ReceiptsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isToday = searchParams.get('today') === 'true'

  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchReceipts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (isToday) params.set('today', 'true')

      const res = await fetch(`/api/admin/receipts?${params}`)
      const data = await res.json()

      if (data.success) {
        setReceipts(data.receipts)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [page, isToday])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchReceipts()
  }

  const handleDownloadPdf = async (id: string) => {
    setDownloadingId(id)
    try {
      const res = await fetch(`/api/admin/receipts/${id}/pdf`)
      if (!res.ok) throw new Error('PDF error')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recu_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du telechargement')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-7 h-7" />
            {isToday ? "Recus d'aujourd'hui" : 'Tous les recus'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} recu{total > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aujourd&apos;hui</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.today.total)}
                </p>
                <p className="text-xs text-gray-400">{stats.today.count} recu(s)</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cette semaine</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.week.total)}
                </p>
                <p className="text-xs text-gray-400">{stats.week.count} recu(s)</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.month.total)}
                </p>
                <p className="text-xs text-gray-400">{stats.month.count} recu(s)</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numero, client, telephone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Filtrer
          </button>
          {isToday && (
            <Link
              href="/admin/receipts"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Voir tous
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun recu trouve
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    N Recu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-purple-600 dark:text-purple-400">
                        {receipt.receiptNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(receipt.paymentDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {receipt.customerName}
                      </div>
                      {receipt.customerPhone && (
                        <div className="text-xs text-gray-500">{receipt.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(receipt.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {receipt.customOrder && (
                        <Link
                          href={`/admin/custom-orders/${receipt.customOrder.id}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {receipt.customOrder.orderNumber}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      {receipt.invoice && (
                        <Link
                          href={`/admin/invoices?search=${receipt.invoice.invoiceNumber}`}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          {receipt.invoice.invoiceNumber}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDownloadPdf(receipt.id)}
                        disabled={downloadingId === receipt.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50"
                      >
                        {downloadingId === receipt.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
