'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Loader2,
  PieChart,
  Calendar,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SourceStat {
  source: string
  count: number
  percentage: number
}

interface MonthlyData {
  month: string
  sources: Record<string, number>
  total: number
}

interface WeeklyData {
  week: string
  sources: Record<string, number>
  total: number
}

export default function CustomerSourcesPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SourceStat[]>([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [sourceColors, setSourceColors] = useState<Record<string, string>>({})
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('all')
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly')

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/customers/sources?period=${period}`)
      const data = await res.json()

      if (data.success) {
        setStats(data.stats)
        setTotalCustomers(data.totalCustomers)
        setMonthlyData(data.monthlyData)
        setWeeklyData(data.weeklyData)
        setSourceColors(data.sourceColors)
      } else {
        toast.error(data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Error fetching sources:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Get all unique sources for chart
  const allSources = Array.from(
    new Set([
      ...stats.map(s => s.source),
      ...monthlyData.flatMap(m => Object.keys(m.sources)),
    ])
  )

  // Calculate max value for chart scaling
  const trendData = viewMode === 'monthly' ? monthlyData : weeklyData
  const maxValue = Math.max(...trendData.map(d => d.total), 1)

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
              <PieChart className="h-6 w-6 text-primary-500" />
              Sources d'Acquisition
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              D'où viennent vos clients ?
            </p>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-1">
          {[
            { value: 'day', label: "Aujourd'hui" },
            { value: 'week', label: 'Semaine' },
            { value: 'month', label: 'Mois' },
            { value: 'year', label: 'Année' },
            { value: 'all', label: 'Tout' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === option.value
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total clients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Source principale</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats[0]?.source || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sources actives</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart / Source Distribution */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-500" />
                Répartition par source
              </h2>

              {/* Simple visual chart */}
              <div className="space-y-3">
                {stats.map((stat) => (
                  <div key={stat.source}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sourceColors[stat.source] || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{stat.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stat.count}</span>
                        <span className="text-xs text-gray-500">({stat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: sourceColors[stat.source] || '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {stats.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Aucune donnée pour cette période
                </p>
              )}
            </div>

            {/* Trend Chart */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  Évolution
                </h2>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-700 p-0.5">
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'weekly'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Semaines
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'monthly'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Mois
                  </button>
                </div>
              </div>

              {/* Simple bar chart */}
              <div className="flex items-end gap-1 h-48">
                {trendData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all duration-300 min-h-[4px]"
                      style={{
                        height: `${(data.total / maxValue) * 100}%`,
                      }}
                      title={`${data.total} clients`}
                    />
                    <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                      {viewMode === 'monthly' ? (data as MonthlyData).month : (data as WeeklyData).week}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                <div className="flex flex-wrap gap-3">
                  {allSources.slice(0, 6).map((source) => (
                    <div key={source} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sourceColors[source] || '#6B7280' }}
                      />
                      <span className="text-xs text-gray-500">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="mt-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              Détails par source
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Clients</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pourcentage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Graphique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {stats.map((stat) => (
                    <tr key={stat.source} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sourceColors[stat.source] || '#6B7280' }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {stat.source}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {stat.count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {stat.percentage}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full max-w-xs bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${stat.percentage}%`,
                              backgroundColor: sourceColors[stat.source] || '#6B7280',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stats.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Aucune donnée pour cette période
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
