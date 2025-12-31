'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Plus,
  Search,
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
}

interface Material {
  id: string
  name: string
  sku: string | null
  unit: string
  unitPrice: number
  stock: number
  lowStockThreshold: number
  supplier: string | null
  color: string | null
  isLowStock: boolean
  category: Category
  movementsCount: number
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [search, categoryFilter, lowStockFilter])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/materials/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (lowStockFilter) params.set('lowStock', 'true')

      const res = await fetch(`/api/admin/materials?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setMaterials(data.materials)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (material: Material) => {
    if (!confirm(`Voulez-vous vraiment supprimer "${material.name}"?`)) {
      return
    }

    setDeletingId(material.id)
    try {
      const res = await fetch(`/api/admin/materials/${material.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Materiel supprime')
        fetchMaterials()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Materiels</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestion du stock des materiels de l'atelier
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/materials/in"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <ArrowDownCircle className="h-4 w-4" />
            Entree
          </Link>
          <Link
            href="/admin/materials/out"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Sortie
          </Link>
          <Link
            href="/admin/materials/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <Package className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total materiels</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock bas</p>
                <p className="text-2xl font-bold text-red-500">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Valeur totale</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(stats.totalValue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Filter className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, SKU, fournisseur..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Toutes les categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Stock bas uniquement</span>
        </label>
        <button
          onClick={fetchMaterials}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Materials Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun materiel trouve
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {search || categoryFilter || lowStockFilter
              ? 'Aucun materiel ne correspond a vos criteres de recherche.'
              : 'Commencez par ajouter vos materiels pour gerer votre stock.'}
          </p>
          <Link
            href="/admin/materials/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un materiel
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Materiel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix unitaire
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valeur stock
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {materials.map((material) => (
                  <tr
                    key={material.id}
                    className={`hover:bg-gray-50 dark:hover:bg-dark-700/50 ${
                      material.isLowStock ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {material.name}
                          {material.isLowStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              Stock bas
                            </span>
                          )}
                        </p>
                        {material.sku && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {material.sku}
                          </p>
                        )}
                        {material.supplier && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {material.supplier}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded">
                        {material.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${
                          material.isLowStock
                            ? 'text-red-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {material.stock} {material.unit}
                      </span>
                      {material.lowStockThreshold > 0 && (
                        <p className="text-xs text-gray-400">
                          Seuil: {material.lowStockThreshold}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatPrice(material.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatPrice(material.stock * material.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/materials/out?materialId=${material.id}`}
                          className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group"
                          title="Sortie"
                        >
                          <ArrowUpCircle className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                        </Link>
                        <Link
                          href={`/admin/materials/in?materialId=${material.id}`}
                          className="p-2 hover:bg-green-500/10 rounded-lg transition-colors group"
                          title="Entree"
                        >
                          <ArrowDownCircle className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
                        </Link>
                        <Link
                          href={`/admin/materials/${material.id}/edit`}
                          className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors group"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                        </Link>
                        <button
                          onClick={() => handleDelete(material)}
                          disabled={deletingId === material.id}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deletingId === material.id ? (
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
        </div>
      )}

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/materials/movements"
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <RefreshCw className="h-4 w-4" />
          Historique des mouvements
        </Link>
        <Link
          href="/admin/materials/categories"
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <Filter className="h-4 w-4" />
          Gerer les categories
        </Link>
        <Link
          href="/admin/materials/reports"
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <Package className="h-4 w-4" />
          Rapports
        </Link>
      </div>
    </div>
  )
}
