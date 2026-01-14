'use client'

import { useState, useEffect } from 'react'
import { Search, User, DollarSign, ShoppingBag, Star, Users, Calendar, TrendingUp, Eye, Pencil, FileText, Trash2, Loader2, X, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Customer {
  id: string
  name: string
  phone: string
  whatsappNumber?: string
  email?: string
  image?: string
  createdAt: string
  totalOrders: number
  lifetimeValue: number
  averageOrderValue: number
  lastOrderDate?: string
  segments: string[]
  reviewsCount: number
}

interface Stats {
  total: number
  today: number
  week: number
  month: number
  year: number
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState({
    search: '',
    segment: '',
    period: '', // today, week, month, year
    dateFrom: '',
    dateTo: '',
    month: '',
    year: '',
  })
  const [showDateFilters, setShowDateFilters] = useState(false)
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [filters, pagination.page, pagination.limit])

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.segment) params.append('segment', filters.segment)
      if (filters.period) params.append('period', filters.period)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.month) params.append('month', filters.month)
      if (filters.year) params.append('year', filters.year)

      const response = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCustomers(data.customers)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const getSegmentBadge = (segments: string[]) => {
    if (segments.includes('vip')) {
      return (
        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-xs flex items-center gap-1">
          <Star className="h-3 w-3" />
          VIP
        </span>
      )
    }
    if (segments.includes('high-value')) {
      return (
        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded text-xs">
          Haute valeur
        </span>
      )
    }
    if (segments.includes('active')) {
      return (
        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded text-xs">
          Actif
        </span>
      )
    }
    if (segments.includes('new')) {
      return (
        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-xs">
          Nouveau
        </span>
      )
    }
    if (segments.includes('inactive')) {
      return (
        <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-xs">
          Inactif
        </span>
      )
    }
    return null
  }

  const handleDownloadPdf = async (e: React.MouseEvent, customerId: string, customerName: string | null) => {
    e.stopPropagation()
    try {
      setDownloadingPdfId(customerId)
      const response = await fetch(`/api/admin/customers/${customerId}/measurements-pdf`)

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 404) {
          toast.error('Aucune mensuration trouvée pour ce client')
          return
        }
        throw new Error(data.error || 'Erreur')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mensurations-${customerName?.replace(/\s+/g, '_') || customerId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const handleDeleteCustomer = async (e: React.MouseEvent, customerId: string, customerName: string | null) => {
    e.stopPropagation()
    if (!confirm(`Voulez-vous vraiment supprimer le client ${customerName || customerId}?`)) {
      return
    }

    try {
      setDeletingId(customerId)
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Client supprimé avec succès')
        fetchCustomers()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des clients</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez votre base de clients</p>
        </div>
      </div>

      {/* Stats Header */}
      {stats && (
        <AdminStatsHeader
          stats={[
            { label: 'Total clients', value: stats.total, icon: Users, color: 'primary' },
            { label: "Aujourd'hui", value: stats.today, icon: Calendar, color: 'green' },
            { label: 'Cette semaine', value: stats.week, icon: TrendingUp, color: 'blue' },
            { label: 'Ce mois', value: stats.month, icon: TrendingUp, color: 'purple' },
            { label: 'Cette année', value: stats.year, icon: TrendingUp, color: 'default' },
          ]}
        />
      )}

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="flex flex-col gap-4">
          {/* Ligne 1: Recherche + Segment + Bouton Date */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, telephone, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.segment}
              onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
              className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les segments</option>
              <option value="vip">VIP</option>
              <option value="high-value">Haute valeur</option>
              <option value="active">Actifs</option>
              <option value="new">Nouveaux</option>
              <option value="inactive">Inactifs</option>
            </select>

            {/* Bouton filtres de date */}
            <button
              onClick={() => setShowDateFilters(!showDateFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                showDateFilters || filters.period || filters.dateFrom || filters.dateTo || filters.month || filters.year
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-dark-800/50 border-gray-200 dark:border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Filtrer par date</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDateFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Ligne 2: Filtres de date (visible si showDateFilters) */}
          {showDateFilters && (
            <div className="border-t border-gray-200 dark:border-dark-700 pt-4 space-y-4">
              {/* Periodes predefines */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 py-1 mr-2">Periode:</span>
                {[
                  { value: '', label: 'Tous' },
                  { value: 'today', label: "Aujourd'hui" },
                  { value: 'week', label: 'Cette semaine' },
                  { value: 'month', label: 'Ce mois' },
                  { value: 'year', label: 'Cette annee' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        period: p.value,
                        dateFrom: '',
                        dateTo: '',
                        month: '',
                        year: '',
                      })
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.period === p.value && !filters.dateFrom && !filters.month
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-700 hover:bg-gray-200 dark:hover:bg-dark-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Plage de dates personnalisee */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Plage personnalisee:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateFrom: e.target.value,
                        period: '',
                        month: '',
                        year: '',
                      })
                    }
                    className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <span className="text-gray-500">→</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateTo: e.target.value,
                        period: '',
                        month: '',
                        year: '',
                      })
                    }
                    className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>

              {/* Mois et annee specifiques */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Mois/Annee:</span>
                <select
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      month: e.target.value,
                      period: '',
                      dateFrom: '',
                      dateTo: '',
                    })
                  }
                  className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">Tous les mois</option>
                  <option value="1">Janvier</option>
                  <option value="2">Fevrier</option>
                  <option value="3">Mars</option>
                  <option value="4">Avril</option>
                  <option value="5">Mai</option>
                  <option value="6">Juin</option>
                  <option value="7">Juillet</option>
                  <option value="8">Aout</option>
                  <option value="9">Septembre</option>
                  <option value="10">Octobre</option>
                  <option value="11">Novembre</option>
                  <option value="12">Decembre</option>
                </select>
                <select
                  value={filters.year}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      year: e.target.value,
                      period: '',
                      dateFrom: '',
                      dateTo: '',
                    })
                  }
                  className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">Toutes les annees</option>
                  {[2026, 2025, 2024, 2023, 2022].map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton reinitialiser */}
              {(filters.period || filters.dateFrom || filters.dateTo || filters.month || filters.year) && (
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        period: '',
                        dateFrom: '',
                        dateTo: '',
                        month: '',
                        year: '',
                      })
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Reinitialiser les filtres de date
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Indicateur de filtres actifs */}
          {(filters.period || filters.dateFrom || filters.dateTo || filters.month || filters.year) && !showDateFilters && (
            <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
              <Calendar className="h-4 w-4" />
              <span>
                Filtre actif:{' '}
                {filters.period === 'today' && "Aujourd'hui"}
                {filters.period === 'week' && 'Cette semaine'}
                {filters.period === 'month' && 'Ce mois'}
                {filters.period === 'year' && 'Cette annee'}
                {filters.dateFrom && filters.dateTo && `Du ${filters.dateFrom} au ${filters.dateTo}`}
                {filters.dateFrom && !filters.dateTo && `Depuis le ${filters.dateFrom}`}
                {!filters.dateFrom && filters.dateTo && `Jusqu'au ${filters.dateTo}`}
                {filters.month && filters.year && `${['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'][parseInt(filters.month) - 1]} ${filters.year}`}
                {filters.year && !filters.month && `Annee ${filters.year}`}
              </span>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    period: '',
                    dateFrom: '',
                    dateTo: '',
                    month: '',
                    year: '',
                  })
                }
                className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Aucun client trouvé</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-100 dark:bg-dark-800/50">
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Inscrit le
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Client
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Contact
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Commandes
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Valeur totale
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Panier moyen
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Segment
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-100 dark:hover:bg-dark-800/50 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/admin/customers/${customer.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {new Date(customer.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {customer.image ? (
                              <img
                                src={customer.image}
                                alt={customer.name || 'Client'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {customer.name || 'Sans nom'}
                            </p>
                            {customer.reviewsCount > 0 && (
                              <p className="text-gray-500 text-xs">
                                {customer.reviewsCount} avis
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-700 dark:text-gray-300">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-gray-500 text-xs">{customer.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-900 dark:text-white font-medium">{customer.totalOrders}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {customer.lifetimeValue.toLocaleString()} CFA
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 dark:text-gray-300">
                          {customer.averageOrderValue.toLocaleString()} CFA
                        </span>
                      </td>
                      <td className="px-6 py-4">{getSegmentBadge(customer.segments)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/admin/customers/${customer.id}`
                            }}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group"
                            title="Voir le détail"
                          >
                            <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/admin/customers/${customer.id}?edit=true`
                            }}
                            className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                          </button>

                          {/* PDF Download */}
                          <button
                            onClick={(e) => handleDownloadPdf(e, customer.id, customer.name)}
                            disabled={downloadingPdfId === customer.id}
                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors group disabled:opacity-50"
                            title="Télécharger PDF"
                          >
                            {downloadingPdfId === customer.id ? (
                              <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteCustomer(e, customer.id, customer.name)}
                            disabled={deletingId === customer.id}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingId === customer.id ? (
                              <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemName="clients"
            />
          </>
        )}
      </div>
    </div>
  )
}
