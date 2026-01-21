'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Megaphone, Send, CheckCircle, MessageSquare, Calendar, Bell } from 'lucide-react'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Campaign {
  id: string
  name: string
  channel: 'SMS' | 'WHATSAPP' | 'WHATSAPP_CLOUD' | 'PUSH'
  status: string
  message: string
  mediaUrl?: string
  totalRecipients: number
  sentCount: number
  failedCount: number
  createdBy: string
  createdByName: string
  createdAt: string
  // Push-specific fields (optional)
  totalDelivered?: number
  totalOpened?: number
  totalClicked?: number
}

interface PushCampaign {
  id: string
  name: string
  title: string
  body: string
  status: string
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  createdBy: string
  creator?: { name: string; email: string }
  createdAt: string
  _count?: { logs: number }
  imageUrl?: string
}

interface CampaignLog {
  id: string
  phone: string
  customerName: string | null
  status: string
  errorMessage: string | null
  sentAt: string | null
}

export default function CampaignReportsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalSent: 0,
    successRate: 0,
    sms: 0,
    whatsapp: 0,
    whatsappCloud: 0,
    push: 0,
  })

  useEffect(() => {
    fetchCampaigns()
  }, [channelFilter, statusFilter])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (channelFilter !== 'all' && channelFilter !== 'PUSH') params.append('channel', channelFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      // Fetch both regular campaigns and push campaigns
      const [campaignsRes, pushRes] = await Promise.all([
        channelFilter === 'PUSH' ? Promise.resolve({ json: async () => ({ success: true, campaigns: [] }) }) : fetch(`/api/admin/campaigns?${params.toString()}`),
        channelFilter === 'all' || channelFilter === 'PUSH' ? fetch(`/api/admin/campaigns/push?limit=100`) : Promise.resolve({ json: async () => ({ success: true, campaigns: [] }) }),
      ])

      const [data, pushData] = await Promise.all([
        campaignsRes.json(),
        pushRes.json(),
      ])

      // Convert push campaigns to the Campaign format
      const pushCampaigns: Campaign[] = (pushData.campaigns || []).map((p: PushCampaign) => ({
        id: p.id,
        name: p.name,
        channel: 'PUSH' as const,
        status: p.status.toLowerCase(),
        message: `${p.title}\n\n${p.body}`,
        mediaUrl: p.imageUrl,
        totalRecipients: p._count?.logs || p.totalSent || 0,
        sentCount: p.totalSent || 0,
        failedCount: 0, // Push notifications don't track failures the same way
        createdBy: p.createdBy,
        createdByName: p.creator?.name || 'Admin',
        createdAt: p.createdAt,
        // Additional push-specific data for display
        totalDelivered: p.totalDelivered,
        totalOpened: p.totalOpened,
        totalClicked: p.totalClicked,
      }))

      // Merge and sort by date
      const allCampaigns = [...(data.campaigns || []), ...pushCampaigns].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setCampaigns(allCampaigns)
      calculateStats(allCampaigns, pushCampaigns.length)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (campaignsList: Campaign[], pushCount: number = 0) => {
    const total = campaignsList.length
    const totalSent = campaignsList.reduce((sum, c) => sum + c.sentCount, 0)
    const totalRecipients = campaignsList.reduce((sum, c) => sum + c.totalRecipients, 0)
    const successRate = totalRecipients > 0 ? (totalSent / totalRecipients) * 100 : 0

    const sms = campaignsList.filter(c => c.channel === 'SMS').length
    const whatsapp = campaignsList.filter(c => c.channel === 'WHATSAPP').length
    const whatsappCloud = campaignsList.filter(c => c.channel === 'WHATSAPP_CLOUD').length
    const push = campaignsList.filter(c => c.channel === 'PUSH').length

    setStats({
      total,
      totalSent,
      successRate: Math.round(successRate * 10) / 10,
      sms,
      whatsapp,
      whatsappCloud,
      push,
    })
  }

  const fetchCampaignLogs = async (campaignId: string, channel: string) => {
    setLogsLoading(true)
    try {
      // Use different endpoint for push campaigns
      const endpoint = channel === 'PUSH'
        ? `/api/admin/campaigns/push/${campaignId}/logs`
        : `/api/admin/campaigns/${campaignId}/logs`

      const res = await fetch(endpoint)
      const data = await res.json()

      if (data.success) {
        // Transform push logs to match regular campaign log format
        if (channel === 'PUSH') {
          const transformedLogs = (data.logs || []).map((log: any) => ({
            id: log.id,
            phone: log.user?.phone || 'N/A',
            customerName: log.user?.name || 'Client',
            status: log.status.toLowerCase(),
            errorMessage: log.error,
            sentAt: log.sentAt,
          }))
          setCampaignLogs(transformedLogs)
        } else {
          setCampaignLogs(data.logs || [])
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      setCampaignLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const handleViewDetails = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowDetailsModal(true)
    await fetchCampaignLogs(campaign.id, campaign.channel)
  }

  const handleDelete = async (id: string, channel: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return

    try {
      // Use different endpoint for push campaigns
      const endpoint = channel === 'PUSH'
        ? `/api/admin/campaigns/push/${id}`
        : `/api/admin/campaigns/${id}`

      const res = await fetch(endpoint, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        alert('Campagne supprimée')
        fetchCampaigns()
      } else {
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const getChannelBadge = (channel: string) => {
    const colors = {
      SMS: 'bg-blue-100 text-blue-800',
      WHATSAPP: 'bg-green-100 text-green-800',
      WHATSAPP_CLOUD: 'bg-purple-100 text-purple-800',
      PUSH: 'bg-orange-100 text-orange-800',
    }
    return colors[channel as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Rapports de Campagnes</h1>
        <p className="text-gray-600 dark:text-gray-400">Consultez les statistiques et l'historique de vos campagnes</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <AdminStatsHeader
          stats={[
            { label: 'Total campagnes', value: stats.total, icon: Megaphone, color: 'primary' },
            { label: 'Messages envoyés', value: stats.totalSent.toLocaleString(), icon: Send, color: 'blue' },
            { label: 'Taux de succès', value: `${stats.successRate}%`, icon: CheckCircle, color: 'green' },
            { label: 'SMS', value: stats.sms, icon: MessageSquare, color: 'blue' },
            { label: 'WhatsApp', value: stats.whatsapp + stats.whatsappCloud, icon: MessageSquare, color: 'green' },
            { label: 'Push', value: stats.push, icon: Bell, color: 'yellow' },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 p-6 mb-6 border border-gray-200 dark:border-dark-700/50">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Canal
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp Business</option>
              <option value="WHATSAPP_CLOUD">WhatsApp Cloud</option>
              <option value="PUSH">Push Notifications</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="scheduled">Programmée</option>
              <option value="sending">En cours</option>
              <option value="sent">Envoyée</option>
              <option value="failed">Échouée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden border border-gray-200 dark:border-dark-700/50">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Aucune campagne trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statistiques
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getChannelBadge(campaign.channel)}`}>
                        {campaign.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div>{campaign.sentCount}/{campaign.totalRecipients}</div>
                      {campaign.failedCount > 0 && (
                        <div className="text-xs text-red-500 dark:text-red-400">{campaign.failedCount} échecs</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {campaign.createdByName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(campaign.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(campaign)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-4"
                      >
                        Voir
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id, campaign.channel)}
                        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) setShowDetailsModal(false)
          }}
        >
          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header - Sticky */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 sticky top-0 z-10 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedCampaign.name}</h2>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getChannelBadge(selectedCampaign.channel)}`}>
                      {selectedCampaign.channel}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedCampaign.status)}`}>
                      {selectedCampaign.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Stats */}
              <div className="p-4 bg-gray-50 dark:bg-dark-800/50 border-b border-gray-200 dark:border-dark-700">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-100 dark:bg-dark-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Destinataires</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCampaign.totalRecipients}</div>
                </div>
                <div className="bg-gray-100 dark:bg-dark-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Envoyés</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedCampaign.sentCount}</div>
                </div>
                <div className="bg-gray-100 dark:bg-dark-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Échecs</div>
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400">{selectedCampaign.failedCount}</div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="p-6 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Message envoyé
              </h3>
              <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                {selectedCampaign.mediaUrl && (
                  <div className="mb-3">
                    {selectedCampaign.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={selectedCampaign.mediaUrl}
                        alt="Media"
                        className="max-h-48 rounded-lg border border-gray-300 dark:border-dark-600"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <a href={selectedCampaign.mediaUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Voir le fichier joint
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedCampaign.message || 'Aucun message'}
                </p>
              </div>
            </div>

            {/* Logs */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Send className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Détails d'envoi ({campaignLogs.length} destinataires)
              </h3>
              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
                </div>
              ) : campaignLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun log disponible</p>
              ) : (
                <div className="space-y-2">
                  {campaignLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{log.customerName || log.phone}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{log.phone}</div>
                        {log.errorMessage && (
                          <div className="text-sm text-red-500 dark:text-red-400 mt-1">{log.errorMessage}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'sent'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30'
                            : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                        }`}>
                          {log.status === 'sent' ? 'Envoyé' : 'Échec'}
                        </span>
                        {log.sentAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(log.sentAt), 'HH:mm:ss', { locale: fr })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
            {/* End Scrollable Content */}

            {/* Footer - Sticky */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 flex-shrink-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
