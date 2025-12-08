'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Trash2,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  Smartphone,
  Mail,
  Search,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NotificationLog {
  id: string
  trigger: string
  channel: string
  recipientPhone: string | null
  recipientEmail: string | null
  recipientName: string | null
  content: string
  status: string
  errorMessage: string | null
  providerResponse: any
  sentAt: Date | null
  createdAt: Date
}

interface LogStats {
  total: number
  sent: number
  failed: number
  pending: number
  byChannel: Record<string, number>
  byTrigger: Record<string, number>
}

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [statusFilter, channelFilter, triggerFilter, dateFrom, dateTo, page])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (channelFilter !== 'all') params.append('channel', channelFilter)
      if (triggerFilter !== 'all') params.append('trigger', triggerFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/admin/notifications/logs?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOldLogs = async (days: number) => {
    if (!confirm(`Supprimer les logs de plus de ${days} jours ?`)) return

    try {
      const response = await fetch(`/api/admin/notifications/logs?days=${days}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${data.deleted} logs supprimés`)
        fetchLogs()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleExportCSV = () => {
    // Prepare CSV data
    const headers = ['Date', 'Trigger', 'Canal', 'Destinataire', 'Statut', 'Erreur']
    const rows = filteredLogs.map((log) => [
      new Date(log.sentAt || log.createdAt).toLocaleString('fr-FR'),
      log.trigger,
      log.channel,
      log.recipientPhone || log.recipientEmail || '',
      log.status,
      log.errorMessage || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `notification-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Export CSV réussi')
  }

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const recipient = log.recipientPhone || log.recipientEmail || log.recipientName || ''
      return (
        recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.trigger.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-4 w-4 text-green-600" />
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return <Smartphone className="h-4 w-4" />
      case 'WHATSAPP':
      case 'WHATSAPP_CLOUD':
        return <MessageSquare className="h-4 w-4" />
      case 'EMAIL':
        return <Mail className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-100 text-blue-800'
      case 'WHATSAPP':
      case 'WHATSAPP_CLOUD':
        return 'bg-green-100 text-green-800'
      case 'EMAIL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Logs de Notifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Historique de toutes les notifications envoyées
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-dark-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Envoyées</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-dark-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Réussies</p>
            <p className="text-2xl font-bold text-green-500 dark:text-green-400">{stats.sent}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-dark-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Échouées</p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{stats.failed}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-dark-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Attente</p>
            <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{stats.pending}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par destinataire ou trigger..."
                className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="sent">Envoyées</option>
              <option value="failed">Échouées</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canal</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger</label>
            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="ORDER_PLACED">Commande placée</option>
              <option value="PAYMENT_RECEIVED">Paiement reçu</option>
              <option value="ORDER_SHIPPED">Commande expédiée</option>
              <option value="ORDER_DELIVERED">Commande livrée</option>
              <option value="LOW_STOCK_ADMIN">Stock faible</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de début</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de fin</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleExportCSV}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleDeleteOldLogs(30)}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Nettoyer
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50">
          <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun log trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                <thead className="bg-gray-100 dark:bg-dark-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trigger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Canal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Destinataire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {new Date(log.sentAt || log.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {log.trigger}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getChannelColor(
                            log.channel
                          )}`}
                        >
                          {getChannelIcon(log.channel)}
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {log.recipientPhone || log.recipientEmail || log.recipientName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {getStatusIcon(log.status)}
                          {log.status === 'sent'
                            ? 'Envoyé'
                            : log.status === 'failed'
                            ? 'Échoué'
                            : 'En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails du Log</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Date d'envoi
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedLog.sentAt || selectedLog.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Statut</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(selectedLog.status)}`}>
                      {getStatusIcon(selectedLog.status)}
                      {selectedLog.status === 'sent' ? 'Envoyé' : selectedLog.status === 'failed' ? 'Échoué' : 'En attente'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Trigger</label>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded inline-block">
                      {selectedLog.trigger}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Canal</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getChannelColor(selectedLog.channel)}`}>
                      {getChannelIcon(selectedLog.channel)}
                      {selectedLog.channel}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Destinataire
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedLog.recipientPhone || selectedLog.recipientEmail || selectedLog.recipientName || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Contenu du Message
                  </label>
                  <div className="bg-gray-100 dark:bg-dark-800 p-3 rounded border border-gray-200 dark:border-dark-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedLog.content}
                    </p>
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-red-500 dark:text-red-400 mb-1">
                      Erreur
                    </label>
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-700/50">
                      <p className="text-sm text-red-700 dark:text-red-300">{selectedLog.errorMessage}</p>
                    </div>
                  </div>
                )}

                {selectedLog.providerResponse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Réponse du Fournisseur
                    </label>
                    <div className="bg-gray-100 dark:bg-dark-800 p-3 rounded border border-gray-200 dark:border-dark-700">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        {JSON.stringify(selectedLog.providerResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
