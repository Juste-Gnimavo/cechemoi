'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Ruler,
  Calendar,
  TrendingUp,
  Download,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface StaffPerformance {
  id: string
  name: string
  email: string | null
  role: string
  customersCreated: number
  measurementsTaken: number
  lastActivity: string | null
  memberSince: string
}

interface Totals {
  totalStaff: number
  totalCustomersCreated: number
  totalMeasurementsTaken: number
}

type SortField = 'name' | 'customersCreated' | 'measurementsTaken' | 'lastActivity'
type SortOrder = 'asc' | 'desc'

export default function StaffPerformancePage() {
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortField, setSortField] = useState<SortField>('customersCreated')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchStaffPerformance()
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate: string | null = null
    let endDate: string | null = now.toISOString().split('T')[0]

    switch (dateRange) {
      case 'today':
        startDate = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      default:
        startDate = null
        endDate = null
    }

    return { startDate, endDate }
  }

  const fetchStaffPerformance = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()

      let url = '/api/admin/staff-performance'
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setStaffPerformance(data.staffPerformance)
        setTotals(data.totals)
      }
    } catch (error) {
      console.error('Error fetching staff performance:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = [...staffPerformance].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      case 'customersCreated':
        comparison = a.customersCreated - b.customersCreated
        break
      case 'measurementsTaken':
        comparison = a.measurementsTaken - b.measurementsTaken
        break
      case 'lastActivity':
        const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
        const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
        comparison = dateA - dateB
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const exportToCSV = () => {
    const headers = ['Nom', 'Email', 'Rôle', 'Clients Créés', 'Mensurations Prises', 'Dernière Activité']
    const rows = staffPerformance.map(staff => [
      staff.name,
      staff.email || '-',
      staff.role,
      staff.customersCreated.toString(),
      staff.measurementsTaken.toString(),
      staff.lastActivity ? new Date(staff.lastActivity).toLocaleDateString('fr-FR') : 'Jamais'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `performance-équipe-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Export CSV téléchargé')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-500 border-red-500/30'
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30'
      case 'STAFF':
        return 'bg-green-500/10 text-green-500 border-green-500/30'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin'
      case 'MANAGER':
        return 'Manager'
      case 'STAFF':
        return 'Staff'
      default:
        return role
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary-500 transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary-500' : 'text-gray-400'}`} />
    </button>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Performance de l'Équipe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivi des clients créés et mensurations prises par membre
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-1">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'today'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              30 jours
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 p-6 border border-gray-200 dark:border-dark-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Membres</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.totalStaff}</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 p-6 border border-gray-200 dark:border-dark-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Clients Créés</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.totalCustomersCreated}</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 p-6 border border-gray-200 dark:border-dark-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Mensurations Prises</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.totalMeasurementsTaken}</p>
          </div>
        </div>
      )}

      {/* Staff Performance Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : staffPerformance.length === 0 ? (
        <div className="text-center py-12 bg-white/80 dark:bg-dark-900/50 rounded-lg shadow border border-gray-200 dark:border-dark-700/50">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun membre de l'équipe</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden border border-gray-200 dark:border-dark-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="name">Membre</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="customersCreated">Clients Créés</SortButton>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="measurementsTaken">Mensurations</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="lastActivity">Dernière Activité</SortButton>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-dark-700">
                {sortedData.map((staff, index) => (
                  <tr
                    key={staff.id}
                    className={`hover:bg-gray-50 dark:hover:bg-dark-800/50 ${
                      index === 0 && sortField !== 'name' && sortOrder === 'desc'
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {staff.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {staff.name || 'Sans nom'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {staff.email || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(staff.role)}`}>
                        {getRoleLabel(staff.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <UserPlus className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {staff.customersCreated}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Ruler className="h-4 w-4 text-purple-500" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {staff.measurementsTaken}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {staff.lastActivity ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(staff.lastActivity).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          Aucune activité
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>* Les statistiques sont basées sur la période sélectionnée. "Tout" affiche l'ensemble des données.</p>
      </div>
    </div>
  )
}
