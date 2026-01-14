'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, DollarSign, Calendar, CreditCard, User, FileText, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
}

interface StaffMember {
  id: string
  name: string
  role: string
}

interface Expense {
  id: string
  categoryId: string
  description: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference: string | null
  staffId: string | null
  notes: string | null
  category: ExpenseCategory
  staff: StaffMember | null
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Especes' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MOMO', label: 'MTN MoMo' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'CARD', label: 'Carte bancaire' },
]

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const expenseId = params.id as string

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentDate, setPaymentDate] = useState('')
  const [reference, setReference] = useState('')
  const [staffId, setStaffId] = useState('')
  const [notes, setNotes] = useState('')

  // Check if selected category is "Salaires"
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const isSalaryCategory = selectedCategory?.name.toLowerCase().includes('salaire')

  useEffect(() => {
    fetchData()
  }, [expenseId])

  const fetchData = async () => {
    try {
      const [expenseRes, catRes, staffRes] = await Promise.all([
        fetch(`/api/admin/expenses/${expenseId}`),
        fetch('/api/admin/expenses/categories'),
        fetch('/api/admin/team'),
      ])

      const expenseData = await expenseRes.json()
      const catData = await catRes.json()
      const staffData = await staffRes.json()

      if (!expenseData.success) {
        toast.error('Dépense non trouvée')
        router.push('/admin/expenses')
        return
      }

      const expense: Expense = expenseData.expense

      // Populate form
      setCategoryId(expense.categoryId)
      setDescription(expense.description)
      setAmount(expense.amount.toString())
      setPaymentMethod(expense.paymentMethod)
      setPaymentDate(new Date(expense.paymentDate).toISOString().split('T')[0])
      setReference(expense.reference || '')
      setStaffId(expense.staffId || '')
      setNotes(expense.notes || '')

      if (catData.success) {
        setCategories(catData.categories)
      }

      if (staffData.success) {
        setStaffMembers(staffData.members || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement')
      router.push('/admin/expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryId) {
      toast.error('La catégorie est requise')
      return
    }
    if (!description) {
      toast.error('La description est requise')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Le montant doit être positif')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          description,
          amount: parseFloat(amount),
          paymentMethod,
          paymentDate,
          reference: reference || null,
          staffId: staffId || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Dépense mise à jour avec succès')
        router.push('/admin/expenses')
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/expenses"
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Modifier la Dépense
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Modifier les détails de la dépense
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Facture électricité décembre 2024"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Montant (CFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: 50000"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <CreditCard className="h-4 w-4 inline mr-1" />
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date de paiement
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Référence / N° Facture (optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: FACT-2024-001"
            />
          </div>

          {/* Staff (for salary) */}
          {isSalaryCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Membre du personnel (pour salaire)
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sélectionner un membre (optionnel)</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Notes supplementaires..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/expenses"
            className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  )
}
