'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Tag, Calendar, Users, TrendingUp, Search, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Coupon {
  id: string
  code: string
  description?: string
  discountType: string
  discountValue: number
  minimumOrderAmount?: number
  maximumDiscount?: number
  usageLimit?: number
  usageCount: number
  usageLimitPerUser?: number
  startsAt?: string
  expiresAt?: string
  active: boolean
  status: string
  totalOrders: number
  totalUsages: number
  createdAt: string
}

interface Stats {
  total: number
  active: number
  expired: number
  today: number
  month: number
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    fetchCoupons()
  }, [filter, search, pagination.page, pagination.limit])

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filter, search])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filter === 'active') params.append('active', 'true')
      if (filter === 'inactive') params.append('active', 'false')
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/coupons?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCoupons(data.coupons)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Erreur lors du chargement des coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le coupon ${code} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Coupon supprime avec succes')
        fetchCoupons()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Erreur lors de la suppression du coupon')
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(currentActive ? 'Coupon desactive' : 'Coupon active')
        fetchCoupons()
      } else {
        toast.error(data.error || 'Erreur lors de la mise a jour')
      }
    } catch (error) {
      console.error('Error toggling coupon:', error)
      toast.error('Erreur lors de la mise a jour du coupon')
    }
  }

  const getStatusBadge = (coupon: Coupon) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Actif' },
      expired: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Expire' },
      scheduled: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Programme' },
      depleted: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'Epuise' },
      inactive: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Inactif' },
    }

    const config = statusConfig[coupon.status] || statusConfig.inactive

    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`
    }
    return `${coupon.discountValue.toLocaleString()} CFA`
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des coupons</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Creez et gerez vos codes de reduction</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          Nouveau coupon
        </Link>
      </div>

      {/* Stats Header */}
      {stats && (
        <AdminStatsHeader
          stats={[
            { label: 'Total', value: stats.total, icon: Tag, color: 'primary' },
            { label: 'Actifs', value: stats.active, icon: CheckCircle, color: 'green' },
            { label: 'Expires', value: stats.expired, icon: XCircle, color: 'red' },
            { label: "Aujourd'hui", value: stats.today, icon: Calendar, color: 'blue' },
            { label: 'Ce mois', value: stats.month, icon: TrendingUp, color: 'purple' },
          ]}
        />
      )}

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'inactive'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
              }`}
            >
              Inactifs
            </button>
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <div className="text-gray-500 dark:text-gray-400">Aucun coupon trouve</div>
            <Link
              href="/admin/coupons/new"
              className="mt-4 text-primary-500 hover:text-primary-400"
            >
              Creer votre premier coupon
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-100 dark:bg-dark-800/50">
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Code
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Reduction
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Utilisation
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Validite
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Statut
                    </th>
                    <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50 transition-all duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900 dark:text-white font-mono font-bold">{coupon.code}</p>
                          {coupon.description && (
                            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{coupon.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-gray-900 dark:text-white font-medium">{formatDiscount(coupon)}</span>
                        </div>
                        {coupon.minimumOrderAmount && (
                          <p className="text-gray-500 text-xs mt-1">
                            Min: {coupon.minimumOrderAmount.toLocaleString()} CFA
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-900 dark:text-white">
                            {coupon.usageCount}
                            {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {coupon.totalOrders} commandes
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <div>
                            {coupon.expiresAt ? (
                              <span className="text-gray-700 dark:text-gray-300">
                                {new Date(coupon.expiresAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-500">Illimite</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(coupon)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(coupon.id, coupon.active)}
                            className={`px-3 py-1 rounded text-sm ${
                              coupon.active
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            }`}
                          >
                            {coupon.active ? 'Desactiver' : 'Activer'}
                          </button>
                          <Link
                            href={`/admin/coupons/${coupon.id}`}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                          >
                            <Edit className="h-4 w-4 text-gray-400" />
                          </Link>
                          {coupon.totalOrders === 0 && (
                            <button
                              onClick={() => handleDelete(coupon.id, coupon.code)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          )}
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
              itemName="coupons"
            />
          </>
        )}
      </div>
    </div>
  )
}
