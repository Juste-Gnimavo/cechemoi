'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DailyTransaction {
  date: string
  revenue: number
  orderCount: number
  expensesCount: number
  expensesTotal: number
  netProfit: number
}

interface RevenueByDay {
  date: string
  revenue: number
  orders: number
}

interface Expense {
  id: string
  amount: number
  paymentDate: string
}

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
]

const ITEMS_PER_PAGE_OPTIONS = [7, 15, 30, 60]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDateRange(period: string): { startDate: string; endDate: string } {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  let startDate: string

  switch (period) {
    case 'today':
      startDate = endDate
      break
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = yesterday.toISOString().split('T')[0]
      return { startDate, endDate: startDate }
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString().split('T')[0]
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      startDate = monthAgo.toISOString().split('T')[0]
      break
    case 'year':
      startDate = `${today.getFullYear()}-01-01`
      break
    default:
      const defaultStart = new Date(today)
      defaultStart.setDate(defaultStart.getDate() - 30)
      startDate = defaultStart.toISOString().split('T')[0]
  }

  return { startDate, endDate }
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<DailyTransaction[]>([])
  const [totals, setTotals] = useState({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    orderCount: 0,
    expensesCount: 0,
  })

  // Filter state
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  useEffect(() => {
    fetchTransactions()
  }, [period, startDate, endDate])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // Get date range
      let dateRange: { startDate: string; endDate: string }
      if (period === 'custom' && startDate && endDate) {
        dateRange = { startDate, endDate }
      } else {
        dateRange = getDateRange(period)
      }

      // Fetch analytics and expenses in parallel
      const [analyticsRes, expensesRes] = await Promise.all([
        fetch(`/api/admin/analytics/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/admin/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=1000`),
      ])

      const [analyticsData, expensesData] = await Promise.all([
        analyticsRes.json(),
        expensesRes.json(),
      ])

      if (!analyticsData.success) {
        throw new Error('Failed to fetch analytics')
      }

      const revenueByDay: RevenueByDay[] = analyticsData.analytics?.revenueByDay || []
      const expenses: Expense[] = expensesData.success ? expensesData.expenses : []

      // Group expenses by day
      const expensesByDay: Record<string, { count: number; total: number }> = {}
      expenses.forEach((exp: Expense) => {
        const dateKey = new Date(exp.paymentDate).toISOString().split('T')[0]
        if (!expensesByDay[dateKey]) {
          expensesByDay[dateKey] = { count: 0, total: 0 }
        }
        expensesByDay[dateKey].count++
        expensesByDay[dateKey].total += exp.amount
      })

      // Get all unique dates (from both revenue and expenses)
      const allDates = new Set<string>()
      revenueByDay.forEach((d) => allDates.add(d.date))
      Object.keys(expensesByDay).forEach((d) => allDates.add(d))

      // Create daily transactions
      const dailyTransactions: DailyTransaction[] = Array.from(allDates)
        .map((date) => {
          const revenueData = revenueByDay.find((d) => d.date === date)
          const expenseData = expensesByDay[date]

          const revenue = revenueData?.revenue || 0
          const expensesTotal = expenseData?.total || 0

          return {
            date,
            revenue,
            orderCount: revenueData?.orders || 0,
            expensesCount: expenseData?.count || 0,
            expensesTotal,
            netProfit: revenue - expensesTotal,
          }
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Calculate totals
      const calculatedTotals = dailyTransactions.reduce(
        (acc, day) => ({
          revenue: acc.revenue + day.revenue,
          expenses: acc.expenses + day.expensesTotal,
          netProfit: acc.netProfit + day.netProfit,
          orderCount: acc.orderCount + day.orderCount,
          expensesCount: acc.expensesCount + day.expensesCount,
        }),
        { revenue: 0, expenses: 0, netProfit: 0, orderCount: 0, expensesCount: 0 }
      )

      setTransactions(dailyTransactions)
      setTotals(calculatedTotals)
      setCurrentPage(1) // Reset to first page on new data
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Erreur lors du chargement des transactions')
    } finally {
      setLoading(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / itemsPerPage)
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Transactions Journalières
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Recettes et dépenses jour par jour
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Recettes */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <p className="text-green-700 dark:text-green-400 font-medium">Total Recettes</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totals.revenue)}
          </p>
          <p className="text-xs text-green-500 mt-1">
            {totals.orderCount} commande{totals.orderCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Total Dépenses */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <p className="text-red-700 dark:text-red-400 font-medium">Total Dépenses</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totals.expenses)}
          </p>
          <p className="text-xs text-red-500 mt-1">
            {totals.expensesCount} dépense{totals.expensesCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Bénéfice Net */}
        <div
          className={`rounded-lg p-6 border ${
            totals.netProfit >= 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet
                className={`h-5 w-5 ${
                  totals.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'
                }`}
              />
              <p
                className={`font-medium ${
                  totals.netProfit >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-orange-700 dark:text-orange-400'
                }`}
              >
                Bénéfice Net
              </p>
            </div>
          </div>
          <p
            className={`text-2xl font-bold ${
              totals.netProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}
          >
            {totals.netProfit >= 0 ? '+' : ''}
            {formatCurrency(totals.netProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Recettes - Dépenses</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-white">Période :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  period === p.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune transaction
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucune recette ou dépense pour cette période.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recettes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dépenses
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bénéfice
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commandes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.date} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(tx.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          tx.revenue > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {tx.revenue > 0 ? '+' : ''}
                        {formatCurrency(tx.revenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          tx.expensesTotal > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {tx.expensesTotal > 0 ? '-' : ''}
                        {formatCurrency(tx.expensesTotal)}
                      </span>
                      {tx.expensesCount > 0 && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({tx.expensesCount})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          tx.netProfit > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.netProfit < 0
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {tx.netProfit > 0 ? '+' : ''}
                        {formatCurrency(tx.netProfit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <ShoppingCart className="h-4 w-4" />
                        <span>{tx.orderCount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">jours</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">
                  ({transactions.length} total)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
