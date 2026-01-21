'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingDown,
  Calendar,
  CreditCard,
  Search,
  User,
  BarChart3,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  description: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference: string | null
  notes: string | null
  category: ExpenseCategory
  staff: { id: string; name: string; role: string } | null
  createdBy: { id: string; name: string } | null
  createdByName: string | null
  createdAt: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  WAVE: 'Wave',
  CHECK: 'Chèque',
  CARD: 'Carte',
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [totals, setTotals] = useState({ totalAmount: 0, count: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [categoryId, paymentMethod, startDate, endDate])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/expenses/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryId) params.set('categoryId', categoryId)
      if (paymentMethod) params.set('paymentMethod', paymentMethod)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (search) params.set('search', search)
      params.set('limit', '100')

      const res = await fetch(`/api/admin/expenses?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setExpenses(data.expenses)
        setTotals(data.totals)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchExpenses()
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryId('')
    setPaymentMethod('')
    setStartDate('')
    setEndDate('')
  }

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Voulez-vous vraiment supprimer cette dépense "${expense.description}"?`)) {
      return
    }

    setDeletingId(expense.id)
    try {
      const res = await fetch(`/api/admin/expenses/${expense.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Dépense supprimée')
        fetchExpenses()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' CFA'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Depenses
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivez toutes les depenses de l'entreprise
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/expenses/reports"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Rapports
          </Link>
          <Link
            href="/admin/expenses/categories"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            Categories
          </Link>
          <Link
            href="/admin/expenses/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle dépense
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total dépenses</p>
              <p className="text-2xl font-bold text-red-500">{formatPrice(totals.totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nombre de depenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
        </div>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          >
            <option value="">Toutes categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tous paiements</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
            >
              Rechercher
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
            >
              Effacer
            </button>
          </div>
        </form>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune dépense
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Commencez par ajouter une dépense.
          </p>
          <Link
            href="/admin/expenses/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une dépense
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(expense.paymentDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${expense.category.color}20`,
                        color: expense.category.color,
                      }}
                    >
                      {expense.category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {expense.description}
                    </p>
                    {expense.reference && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Ref: {expense.reference}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-bold text-red-500">{formatPrice(expense.amount)}</span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded">
                      <CreditCard className="h-3 w-3" />
                      {PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {expense.staff ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <User className="h-3 w-3" />
                        {expense.staff.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/admin/expenses/${expense.id}/edit`}
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors group"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                      </Link>
                      <button
                        onClick={() => handleDelete(expense)}
                        disabled={deletingId === expense.id}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deletingId === expense.id ? (
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
      )}
    </div>
  )
}
