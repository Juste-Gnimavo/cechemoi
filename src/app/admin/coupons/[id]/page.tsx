'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, TrendingUp, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Coupon {
  id: string
  code: string
  description?: string
  discountType: string
  discountValue: number
  minimumOrderAmount?: number
  maximumDiscount?: number
  allowedCategories: string[]
  excludedCategories: string[]
  allowedProducts: string[]
  excludedProducts: string[]
  usageLimit?: number
  usageCount: number
  usageLimitPerUser?: number
  startsAt?: string
  expiresAt?: string
  active: boolean
  totalDiscountGiven: number
  _count: {
    orders: number
    usages: number
  }
}

export default function EditCouponPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coupon, setCoupon] = useState<Coupon | null>(null)

  const [formData, setFormData] = useState({
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumOrderAmount: '',
    maximumDiscount: '',
    usageLimit: '',
    usageLimitPerUser: '',
    startsAt: '',
    expiresAt: '',
    active: true,
  })

  useEffect(() => {
    fetchCoupon()
  }, [params.id])

  const fetchCoupon = async () => {
    try {
      const response = await fetch(`/api/admin/coupons/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setCoupon(data.coupon)
        setFormData({
          description: data.coupon.description || '',
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue.toString(),
          minimumOrderAmount: data.coupon.minimumOrderAmount?.toString() || '',
          maximumDiscount: data.coupon.maximumDiscount?.toString() || '',
          usageLimit: data.coupon.usageLimit?.toString() || '',
          usageLimitPerUser: data.coupon.usageLimitPerUser?.toString() || '',
          startsAt: data.coupon.startsAt
            ? new Date(data.coupon.startsAt).toISOString().slice(0, 16)
            : '',
          expiresAt: data.coupon.expiresAt
            ? new Date(data.coupon.expiresAt).toISOString().slice(0, 16)
            : '',
          active: data.coupon.active,
        })
      } else {
        toast.error('Coupon non trouvé')
        router.push('/admin/coupons')
      }
    } catch (error) {
      console.error('Error fetching coupon:', error)
      toast.error('Erreur lors du chargement du coupon')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/coupons/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Coupon mis à jour avec succès')
        router.push('/admin/coupons')
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating coupon:', error)
      toast.error('Erreur lors de la mise à jour du coupon')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (!coupon) {
    return null
  }

  const formatDiscount = () => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`
    }
    return `${coupon.discountValue.toLocaleString()} CFA`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/coupons"
          className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le coupon</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono">{coupon.code}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Réduction</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDiscount()}</p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Utilisations</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {coupon.usageCount}
            {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
          </p>
          <p className="text-gray-500 text-xs mt-1">{coupon._count.orders} commandes</p>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total remises</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {coupon.totalDiscountGiven.toLocaleString()} CFA
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de base</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code du coupon
              </label>
              <input
                type="text"
                value={coupon.code}
                disabled
                className="w-full bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-lg font-mono cursor-not-allowed"
              />
              <p className="text-gray-500 text-sm mt-1">Le code ne peut pas être modifié</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Description du coupon..."
              />
            </div>
          </div>
        </div>

        {/* Discount Configuration */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration de la réduction</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de réduction
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (CFA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valeur de réduction
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant minimum de commande
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minimumOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minimumOrderAmount: e.target.value })
                }
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="10000"
              />
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Réduction maximale
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maximumDiscount}
                  onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="20000"
                />
              </div>
            )}
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Limites d'utilisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limite d'utilisation totale
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="100"
              />
              <p className="text-gray-500 text-sm mt-1">
                Actuellement utilisé {coupon.usageCount} fois
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limite par utilisateur
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimitPerUser}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimitPerUser: e.target.value })
                }
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Période de validité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de début
              </label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date d'expiration
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded bg-gray-100 dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-gray-700 dark:text-gray-300">
              Coupon actif
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/coupons"
            className="px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
