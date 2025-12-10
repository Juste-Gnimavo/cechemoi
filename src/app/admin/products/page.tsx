'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Eye, Package, Star, AlertTriangle, CheckCircle, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { buildProductUrl } from '@/lib/utils'
import { AdminStatsHeader } from '@/components/admin/admin-stats-header'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  salePrice?: number
  stock: number
  published: boolean
  featured: boolean
  images: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  _count: {
    reviews: number
    orderItems: number
  }
}

interface Stats {
  total: number
  published: number
  featured: number
  outOfStock: number
  lowStock: number
  today: number
  week: number
  month: number
  year: number
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    published: '',
    stockStatus: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [filters, pagination.page, pagination.limit])

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
      setLoading(true)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.published) params.append('published', filters.published)
      if (filters.stockStatus) params.append('stockStatus', filters.stockStatus)

      const response = await fetch(`/api/admin/products?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.products)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Erreur lors du chargement des produits')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Veuillez sélectionner au moins un produit')
      return
    }

    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          action: action,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${data.count} produit(s) mis à jour`)
        setSelectedProducts([])
        fetchProducts()
      } else {
        toast.error(data.error || 'Erreur lors de l\'action groupée')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Erreur lors de l\'action groupée')
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Rupture', color: 'text-red-500' }
    if (stock <= 10) return { text: 'Stock faible', color: 'text-yellow-500' }
    return { text: 'En stock', color: 'text-green-500' }
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filters])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gestion des produits</h2>
          <p className="text-gray-500 dark:text-gray-400">Gerez votre catalogue de produits et services</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          Nouveau produit
        </Link>
      </div>

      {/* Stats Header */}
      {stats && (
        <AdminStatsHeader
          stats={[
            { label: 'Total', value: stats.total, icon: Package, color: 'primary' },
            { label: 'Publies', value: stats.published, icon: CheckCircle, color: 'green' },
            { label: 'Vedettes', value: stats.featured, icon: Star, color: 'yellow' },
            { label: 'Rupture', value: stats.outOfStock, icon: AlertTriangle, color: 'red' },
            { label: 'Stock faible', value: stats.lowStock, icon: AlertTriangle, color: 'yellow' },
            { label: "Aujourd'hui", value: stats.today, icon: Calendar, color: 'blue' },
            { label: 'Cette semaine', value: stats.week, icon: TrendingUp, color: 'purple' },
            { label: 'Ce mois', value: stats.month, icon: TrendingUp, color: 'default' },
          ]}
        />
      )}

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, SKU..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
            />
          </div>

          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          >
            <option value="">Toutes categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.published}
            onChange={(e) => setFilters({ ...filters, published: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          >
            <option value="">Tous statuts</option>
            <option value="true">Publie</option>
            <option value="false">Brouillon</option>
          </select>

          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
          >
            <option value="">Tous stocks</option>
            <option value="inStock">En stock</option>
            <option value="lowStock">Stock faible</option>
            <option value="outOfStock">Rupture</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary-500/10 border border-primary-500 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">
              {selectedProducts.length} produit(s) selectionne(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
              >
                Publier
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
              >
                Depublier
              </button>
              <button
                onClick={() => handleBulkAction('feature')}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
              >
                En vedette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Chargement...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">Aucun produit trouve</p>
            <p className="text-gray-500 text-sm mb-4">
              Commencez par ajouter votre premier produit
            </p>
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
            >
              Nouveau produit
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-100 dark:bg-dark-800/50">
                    <th className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length}
                        onChange={toggleAllProducts}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                      Produit
                    </th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">SKU</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                      Categorie
                    </th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Prix</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Stock</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                      Statut
                    </th>
                    <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock)
                    return (
                      <tr key={product.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50 transition-all duration-200">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-800 rounded overflow-hidden flex-shrink-0">
                              {product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-gray-900 dark:text-white font-medium">{product.name}</div>
                              {product.featured && (
                                <span className="text-xs text-yellow-500 flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-500" />
                                  Vedette
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 dark:text-gray-300 font-mono text-sm">{product.sku}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 dark:text-gray-300">{product.category?.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {product.salePrice ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 line-through text-sm">
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="text-green-500 font-semibold">
                                  {product.salePrice.toLocaleString()} CFA
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-900 dark:text-white font-medium">
                                {product.price.toLocaleString()} CFA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={stockStatus.color}>
                            {product.stock} ({stockStatus.text})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              product.published
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            {product.published ? 'Publie' : 'Brouillon'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={buildProductUrl(product.slug, product.category?.slug)}
                              target="_blank"
                              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                              title="Voir"
                            >
                              <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </Link>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
              itemName="produits"
            />
          </>
        )}
      </div>
    </div>
  )
}
