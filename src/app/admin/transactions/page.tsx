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
  Search,
  RefreshCw,
  CreditCard,
  Receipt,
  FileText,
  CheckCircle,
  Clock,
  Package,
  CalendarDays,
  Filter,
  Download,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DailyTransaction {
  date: string
  revenue: number
  orderCount: number
  invoiceCount: number
  expensesCount: number
  expensesTotal: number
  netProfit: number
}

interface RevenueByDay {
  date: string
  revenue: number
  orders: number
  invoices?: number
}

interface Expense {
  id: string
  amount: number
  paymentDate: string
}

interface Analytics {
  revenue: {
    total: number
    fromOrders: number
    fromStandaloneInvoices: number
    fromCustomOrders: number
    fromStandalonePayments: number
    fromInvoicePayments: number
    fromAppointments: number
  }
  orders: {
    total: number
    paid: number
  }
  standaloneInvoices: {
    total: number
    revenue: number
  }
  customOrders: {
    receiptsCount: number
    revenue: number
  }
}

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
]

const ITEMS_PER_PAGE_OPTIONS = [7, 15, 30, 60]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
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
  const [filteredTransactions, setFilteredTransactions] = useState<DailyTransaction[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [totals, setTotals] = useState({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    orderCount: 0,
    invoiceCount: 0,
    expensesCount: 0,
  })

  // Filter state
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyWithActivity, setShowOnlyWithActivity] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  useEffect(() => {
    fetchTransactions()
  }, [period, startDate, endDate])

  useEffect(() => {
    // Filter transactions based on search and activity filter
    let filtered = [...transactions]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(tx => {
        const dateStr = formatDate(tx.date).toLowerCase()
        return dateStr.includes(search)
      })
    }

    if (showOnlyWithActivity) {
      filtered = filtered.filter(tx => tx.revenue > 0 || tx.expensesTotal > 0)
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }, [transactions, searchTerm, showOnlyWithActivity])

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

      setAnalytics(analyticsData.analytics)

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
            invoiceCount: revenueData?.invoices || 0,
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
          invoiceCount: acc.invoiceCount + day.invoiceCount,
          expensesCount: acc.expensesCount + day.expensesCount,
        }),
        { revenue: 0, expenses: 0, netProfit: 0, orderCount: 0, invoiceCount: 0, expensesCount: 0 }
      )

      setTransactions(dailyTransactions)
      setFilteredTransactions(dailyTransactions)
      setTotals(calculatedTotals)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Erreur lors du chargement des transactions')
    } finally {
      setLoading(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-primary-500" />
              Transactions
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Suivi des recettes et dépenses jour par jour
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchTransactions()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Recettes */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recettes</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totals.revenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Dépenses */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dépenses</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totals.expenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Bénéfice Net */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${totals.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
              <Wallet className={`h-5 w-5 ${totals.netProfit >= 0 ? 'text-emerald-500' : 'text-orange-500'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bénéfice</p>
              <p className={`text-lg font-bold ${totals.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {totals.netProfit >= 0 ? '+' : ''}{formatCurrency(totals.netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Commandes */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Commandes</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {totals.orderCount}
              </p>
            </div>
          </div>
        </div>

        {/* Factures */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Receipt className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Factures</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {analytics?.standaloneInvoices?.total || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Jours avec activité */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CalendarDays className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Jours actifs</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {transactions.filter(t => t.revenue > 0 || t.expensesTotal > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Sources Breakdown */}
      {analytics && (
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Détail des sources de revenus
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Commandes</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(analytics.revenue.fromOrders)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Factures</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(analytics.revenue.fromStandaloneInvoices)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sur-mesure</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(analytics.revenue.fromCustomOrders)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Paiements auto.</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(analytics.revenue.fromStandalonePayments)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Acomptes fact.</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(analytics.revenue.fromInvoicePayments)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">RDV</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(analytics.revenue.fromAppointments)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
        <div className="flex flex-col gap-4">
          {/* Period selector */}
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

          {/* Search and filters row */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Activity filter */}
            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithActivity}
                onChange={(e) => setShowOnlyWithActivity(e.target.checked)}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Jours avec activité uniquement</span>
            </label>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : filteredTransactions.length === 0 ? (
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
            <div className="overflow-x-auto">
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
                      Cmd
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dép.
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
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
                        {tx.orderCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                            <ShoppingCart className="h-3 w-3" />
                            {tx.orderCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {tx.expensesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                            <TrendingDown className="h-3 w-3" />
                            {tx.expensesCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {tx.revenue > 0 || tx.expensesTotal > 0 ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            tx.netProfit > 0
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : tx.netProfit < 0
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                          }`}>
                            {tx.netProfit > 0 ? (
                              <><CheckCircle className="h-3 w-3" /> Positif</>
                            ) : tx.netProfit < 0 ? (
                              <><TrendingDown className="h-3 w-3" /> Négatif</>
                            ) : (
                              <><Clock className="h-3 w-3" /> Neutre</>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Aucune activité</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  ({filteredTransactions.length} total)
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
