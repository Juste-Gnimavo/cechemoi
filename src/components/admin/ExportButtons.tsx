'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export type FinancialFamily =
  | 'online-sales'
  | 'custom-orders'
  | 'invoices'
  | 'transactions'
  | 'refunds'
  | 'expenses'
  | 'clients'

export interface ExportButtonsProps {
  family: FinancialFamily
  filters: {
    period?: string
    startDate?: string
    endDate?: string
    status?: string
    paymentMethod?: string
    source?: string
    type?: string
    dateBasis?: string
    segment?: string
  }
  label?: string
}

export function ExportButtons({ family, filters, label }: ExportButtonsProps) {
  const [loading, setLoading] = useState<'xlsx' | 'pdf' | null>(null)

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    setLoading(format)
    try {
      const res = await fetch('/api/admin/reports/financial/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family, format, ...filters }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match ? match[1] : `rapport-${family}.${format}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success(`Rapport ${format.toUpperCase()} téléchargé`)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Échec de l\'export')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-600 mr-1">{label}</span>}
      <button
        type="button"
        onClick={() => handleExport('xlsx')}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'xlsx' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        Exporter Excel
      </button>
      <button
        type="button"
        onClick={() => handleExport('pdf')}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'pdf' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Exporter PDF
      </button>
    </div>
  )
}

export default ExportButtons
