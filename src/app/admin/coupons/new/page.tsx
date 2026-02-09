'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useConfetti } from '@/hooks/useConfetti'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
}

export default function NewCouponPage() {
  const router = useRouter()
  const { mini } = useConfetti()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumOrderAmount: '',
    maximumDiscount: '',
    allowedCategories: [] as string[],
    excludedCategories: [] as string[],
    allowedProducts: [] as string[],
    excludedProducts: [] as string[],
    usageLimit: '',
    usageLimitPerUser: '',
    startsAt: '',
    expiresAt: '',
    active: true,
  })

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Mini celebration for new coupon! 🎟️
        mini()
        toast.success('Coupon créé avec succès')
        router.push('/admin/coupons')
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating coupon:', error)
      toast.error('Erreur lors de la création du coupon')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau coupon</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Créez un nouveau code de réduction</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code du coupon *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                placeholder="PROMO2024"
                required
              />
              <p className="text-gray-500 text-sm mt-1">
                Utilisez des lettres majuscules et des chiffres
              </p>
            </div>

            <div className="md:col-span-2">
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
                Type de réduction *
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
                Valeur de réduction *
              </label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                step="0.01"
                min="0"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={formData.discountType === 'percentage' ? '10' : '5000'}
                required
              />
              <p className="text-gray-500 text-sm mt-1">
                {formData.discountType === 'percentage'
                  ? 'Entre 0 et 100%'
                  : 'Montant en CFA'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant minimum de commande
              </label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                step="0.01"
                min="0"
                value={formData.minimumOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minimumOrderAmount: e.target.value })
                }
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="10000"
              />
              <p className="text-gray-500 text-sm mt-1">Optionnel (en CFA)</p>
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Réduction maximale
                </label>
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  step="0.01"
                  min="0"
                  value={formData.maximumDiscount}
                  onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="20000"
                />
                <p className="text-gray-500 text-sm mt-1">Plafond de réduction (en CFA)</p>
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
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="100"
              />
              <p className="text-gray-500 text-sm mt-1">Laissez vide pour illimité</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limite par utilisateur
              </label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                min="1"
                value={formData.usageLimitPerUser}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimitPerUser: e.target.value })
                }
                className="w-full bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-transparent text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="1"
              />
              <p className="text-gray-500 text-sm mt-1">Fois par client</p>
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
              <p className="text-gray-500 text-sm mt-1">Laissez vide pour démarrer immédiatement</p>
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
              <p className="text-gray-500 text-sm mt-1">Laissez vide pour aucune expiration</p>
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
              Activer immédiatement
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
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Création...' : 'Créer le coupon'}
          </button>
        </div>
      </form>
    </div>
  )
}
