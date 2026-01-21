'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  Users,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Trash2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ParsedCustomer {
  firstName: string
  lastName: string
  phone: string
  email?: string
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export default function ImportCustomersPage() {
  const [rawText, setRawText] = useState('')
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [delimiter, setDelimiter] = useState<'tab' | 'comma' | 'semicolon' | 'auto'>('auto')

  const parseText = () => {
    if (!rawText.trim()) {
      toast.error('Veuillez coller des donnees')
      return
    }

    const lines = rawText.trim().split('\n').filter(line => line.trim())
    const customers: ParsedCustomer[] = []

    for (const line of lines) {
      let parts: string[]

      // Detect delimiter
      if (delimiter === 'auto') {
        if (line.includes('\t')) {
          parts = line.split('\t')
        } else if (line.includes(';')) {
          parts = line.split(';')
        } else if (line.includes(',')) {
          parts = line.split(',')
        } else {
          parts = line.split(/\s{2,}/) // Multiple spaces
        }
      } else {
        const delimiters = { tab: '\t', comma: ',', semicolon: ';' }
        parts = line.split(delimiters[delimiter])
      }

      parts = parts.map(p => p.trim()).filter(p => p)

      if (parts.length >= 2) {
        // Try to detect which column is phone
        const phoneIndex = parts.findIndex(p => /^[\+\d\s\-\.]{8,}$/.test(p.replace(/\s/g, '')))

        if (phoneIndex >= 0) {
          const phone = parts[phoneIndex]
          const nameParts = parts.filter((_, i) => i !== phoneIndex)

          // Check if there's an email
          const emailIndex = nameParts.findIndex(p => p.includes('@'))
          const email = emailIndex >= 0 ? nameParts[emailIndex] : undefined
          const nameOnly = nameParts.filter((_, i) => i !== emailIndex)

          customers.push({
            firstName: nameOnly[0] || '',
            lastName: nameOnly.slice(1).join(' ') || '',
            phone,
            email,
          })
        } else {
          // Assume first is name, second is phone
          customers.push({
            firstName: parts[0],
            lastName: parts.length > 2 ? parts[1] : '',
            phone: parts.length > 2 ? parts[2] : parts[1],
            email: parts.length > 3 ? parts[3] : undefined,
          })
        }
      }
    }

    if (customers.length === 0) {
      toast.error('Aucun client détecté. Vérifiez le format.')
      return
    }

    setParsedCustomers(customers)
    setResult(null)
    toast.success(`${customers.length} client(s) détecté(s)`)
  }

  const removeCustomer = (index: number) => {
    setParsedCustomers(prev => prev.filter((_, i) => i !== index))
  }

  const importCustomers = async () => {
    if (parsedCustomers.length === 0) {
      toast.error('Aucun client a importer')
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/admin/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: parsedCustomers }),
      })
      const data = await res.json()

      if (data.success) {
        setResult(data.results)
        if (data.results.created > 0) {
          toast.success(`${data.results.created} client(s) importe(s)`)
        }
        if (data.results.skipped > 0) {
          toast.error(`${data.results.skipped} client(s) ignore(s)`)
        }
        // Clear parsed if all successful
        if (data.results.skipped === 0) {
          setParsedCustomers([])
          setRawText('')
        }
      } else {
        toast.error(data.error || 'Erreur lors de l\'import')
      }
    } catch (error) {
      console.error('Error importing:', error)
      toast.error('Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  const exportCustomers = () => {
    window.open('/api/admin/customers/export?format=csv', '_blank')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary-500" />
              Importer des Clients
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Collez vos donnees clients pour les importer en masse
            </p>
          </div>
        </div>
        <button
          onClick={exportCustomers}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Format attendu</h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
          Collez vos données avec une ligne par client. Les champs requis sont: <strong>Prénom</strong> et <strong>Téléphone</strong>.
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-500">
          Exemples:<br/>
          <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">Marie;+2250758001234;marie@email.com</code><br/>
          <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">Pierre, +2250505050505</code>
        </p>
      </div>

      {/* Delimiter Selection */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">Separateur:</span>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-1">
          {[
            { value: 'auto', label: 'Auto' },
            { value: 'tab', label: 'Tab' },
            { value: 'comma', label: 'Virgule' },
            { value: 'semicolon', label: 'Point-virgule' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDelimiter(option.value as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                delimiter === option.value
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
          <FileText className="h-4 w-4 inline mr-2" />
          Collez vos donnees ici
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Juste,+2250709757296"
        />
        <div className="mt-3 flex gap-3">
          <button
            onClick={parseText}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Users className="h-4 w-4" />
            Analyser
          </button>
          <button
            onClick={() => {
              setRawText('')
              setParsedCustomers([])
              setResult(null)
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Parsed Customers Preview */}
      {parsedCustomers.length > 0 && (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-500" />
              Apercu ({parsedCustomers.length} clients)
            </h2>
            <button
              onClick={importCustomers}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importer {parsedCustomers.length} client(s)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {parsedCustomers.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{customer.firstName}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{customer.lastName || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">{customer.phone}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{customer.email || '-'}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => removeCustomer(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resultat de l'import</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{result.created}</span>
              </div>
              <p className="text-sm text-green-600">Client(s) créé(s)</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{result.skipped}</span>
              </div>
              <p className="text-sm text-yellow-600">Client(s) ignore(s)</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details des erreurs:</h3>
              <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-dark-900 rounded-lg p-3">
                {result.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/customers"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Voir les clients
            </Link>
            <button
              onClick={() => {
                setResult(null)
                setRawText('')
                setParsedCustomers([])
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Nouvel import
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
