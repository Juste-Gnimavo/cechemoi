'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Search,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
}

interface SMSHistory {
  id: string
  message: string
  status: string
  sentAt: string
  error?: string
  metadata?: any
}

export default function SendSMSPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerIdFromQuery = searchParams.get('customerId')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [message, setMessage] = useState('')
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const maxLength = 160 // Standard SMS length

  // Available variables
  const variables = [
    { key: '{customer_name}', label: 'Nom complet du client' },
    { key: '{billing_first_name}', label: 'Prénom' },
    { key: '{billing_last_name}', label: 'Nom de famille' },
    { key: '{billing_phone}', label: 'Téléphone' },
    { key: '{billing_email}', label: 'Email' },
  ]

  // Load customer if ID is in URL
  useEffect(() => {
    if (customerIdFromQuery) {
      loadCustomer(customerIdFromQuery)
    }
  }, [customerIdFromQuery])

  // Load customer details and history
  const loadCustomer = async (customerId: string) => {
    setLoading(true)
    setError('')
    try {
      // Get customer details
      const customerRes = await fetch(`/api/admin/customers/${customerId}`)
      if (!customerRes.ok) throw new Error('Client non trouvé')
      const customerData = await customerRes.json()

      const customer: Customer = {
        id: customerData.customer.id,
        name: `${customerData.customer.firstName} ${customerData.customer.lastName}`,
        phone: customerData.customer.phone,
        email: customerData.customer.email,
      }
      setSelectedCustomer(customer)

      // Get SMS history
      const historyRes = await fetch(`/api/admin/customers/${customerId}/send-sms`)
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setSmsHistory(historyData.history || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Search customers
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error('Erreur de recherche')
      const data = await res.json()

      const results: Customer[] = data.customers.map((c: any) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phone,
        email: c.email,
      }))
      setSearchResults(results)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  // Select customer from search
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchResults([])
    setSearchQuery('')
    loadCustomer(customer.id)
  }

  // Insert variable into message
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = message.substring(0, start) + variable + message.substring(end)
    setMessage(newMessage)

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  // Send SMS
  const handleSendSMS = async () => {
    if (!selectedCustomer) {
      setError('Veuillez sélectionner un client')
      return
    }

    if (!message.trim()) {
      setError('Veuillez saisir un message')
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setSuccess('SMS envoyé avec succès!')
      setMessage('')

      // Reload history
      loadCustomer(selectedCustomer.id)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green shadow-sm shadow-green-500/10-400">
            <CheckCircle className="w-3 h-3" />
            Envoyé
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red shadow-sm shadow-red-500/10-400">
            <XCircle className="w-3 h-3" />
            Échoué
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow shadow-sm shadow-yellow-500/10-400">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Envoyer un SMS</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Envoyer un SMS individuel à un client</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Selection & Message */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Search */}
          {!selectedCustomer && (
            <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-transparent">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sélectionner un client</h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher par nom, email ou téléphone..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-left transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </span>
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">Aucun client trouvé</p>
              )}
            </div>
          )}

          {/* Selected Customer */}
          {selectedCustomer && (
            <>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-transparent">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Client sélectionné</h2>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setSmsHistory([])
                      setMessage('')
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Changer
                  </button>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    <div className="flex flex-col gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedCustomer.phone}
                      </span>
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedCustomer.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Form */}
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-transparent">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Composer le message</h2>

                <div className="space-y-4">
                  <div>
                    <textarea
                      id="message-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Saisissez votre message ici..."
                      rows={6}
                      maxLength={maxLength * 3} // Allow longer for multiple SMS
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {message.length} caractères
                        {message.length > maxLength && (
                          <span className="ml-2 text-yellow-400">
                            ({Math.ceil(message.length / maxLength)} SMS)
                          </span>
                        )}
                      </span>
                      <span className="text-gray-500">Max: {maxLength * 3}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Variables disponibles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variables.map((v) => (
                        <button
                          key={v.key}
                          onClick={() => insertVariable(v.key)}
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm transition-all duration-200"
                          title={v.label}
                        >
                          {v.key}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Cliquez sur une variable pour l'insérer dans le message
                    </p>
                  </div>

                  <button
                    onClick={handleSendSMS}
                    disabled={sending || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    <Send className="w-5 h-5" />
                    {sending ? 'Envoi en cours...' : 'Envoyer le SMS'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column - SMS History */}
        <div className="lg:col-span-1">
          {selectedCustomer && (
            <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-6 sticky top-6 border border-gray-200 dark:border-transparent">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historique SMS</h2>
              </div>

              {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Chargement...</p>
              ) : smsHistory.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun SMS envoyé</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {smsHistory.map((sms) => (
                    <div key={sms.id} className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        {getStatusBadge(sms.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(sms.sentAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {sms.message}
                      </p>
                      {sms.error && (
                        <p className="text-xs text-red-400 mt-2">
                          Erreur: {sms.error}
                        </p>
                      )}
                      {sms.metadata?.sentByName && (
                        <p className="text-xs text-gray-500 mt-2">
                          Par: {sms.metadata.sentByName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedCustomer && (
            <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-transparent">
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Sélectionnez un client pour voir l'historique SMS
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
