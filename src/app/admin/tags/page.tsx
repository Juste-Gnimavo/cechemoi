'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Tag,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  TrendingUp,
  GitMerge,
  Eye
} from 'lucide-react'

interface TagData {
  name: string
  count: number
  productIds: string[]
}

interface TagStats {
  totalTags: number
  totalProducts: number
  productsWithTags: number
  avgTagsPerProduct: string
  mostUsedTag: string | null
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([])
  const [stats, setStats] = useState<TagStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count')

  // Modals
  const [renameModal, setRenameModal] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const [mergeModal, setMergeModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [mergeTarget, setMergeTarget] = useState('')
  const [merging, setMerging] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/tags')
      const data = await res.json()
      if (data.success) {
        setTags(data.tags)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      setError('Erreur lors du chargement des tags')
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async () => {
    if (!renameModal || !newName) return

    try {
      setRenaming(true)
      setError('')
      const res = await fetch('/api/admin/tags/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: renameModal,
          newName: newName.trim(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        fetchTags()
        setRenameModal(null)
        setNewName('')
      } else {
        setError(data.error || 'Erreur lors du renommage')
      }
    } catch (error) {
      console.error('Error renaming tag:', error)
      setError('Erreur lors du renommage')
    } finally {
      setRenaming(false)
    }
  }

  const handleMerge = async () => {
    if (selectedTags.length === 0 || !mergeTarget) {
      setError('Sélectionnez des tags à fusionner et un tag cible')
      return
    }

    try {
      setMerging(true)
      setError('')
      const res = await fetch('/api/admin/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTags: selectedTags,
          targetTag: mergeTarget.trim(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        fetchTags()
        setMergeModal(false)
        setSelectedTags([])
        setMergeTarget('')
      } else {
        setError(data.error || 'Erreur lors de la fusion')
      }
    } catch (error) {
      console.error('Error merging tags:', error)
      setError('Erreur lors de la fusion')
    } finally {
      setMerging(false)
    }
  }

  const handleDelete = async (tagName: string) => {
    try {
      setDeleting(true)
      setError('')
      const res = await fetch(`/api/admin/tags/${encodeURIComponent(tagName)}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        fetchTags()
        setDeleteConfirm(null)
      } else {
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      setError('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const toggleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName))
    } else {
      setSelectedTags([...selectedTags, tagName])
    }
  }

  // Filter and sort tags
  const filteredTags = tags
    .filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return b.count - a.count
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Étiquettes (Tags)</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gérez les tags de vos produits - renommer, fusionner ou supprimer
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Tags</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalTags}</p>
              </div>
              <Tag className="h-8 w-8 text-primary-500" />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Produits avec tags</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.productsWithTags}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Moy. tags/produit</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.avgTagsPerProduct}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Tag le plus utilisé</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                  {stats.mostUsedTag || 'N/A'}
                </p>
              </div>
              <Tag className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'count')}
          className="px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="count">Plus utilisé</option>
          <option value="name">Nom (A-Z)</option>
        </select>

        {/* Merge Button */}
        <button
          onClick={() => setMergeModal(true)}
          disabled={selectedTags.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitMerge className="h-5 w-5" />
          <span>Fusionner ({selectedTags.length})</span>
        </button>
      </div>

      {/* Tags List */}
      <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
        {filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun tag trouvé' : 'Aucun tag. Ajoutez des tags à vos produits !'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {filteredTags.map(tag => (
              <div
                key={tag.name}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Checkbox for merge */}
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.name)}
                    onChange={() => toggleTagSelection(tag.name)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
                  />

                  {/* Tag Icon */}
                  <div className="p-2 bg-primary-500/20 rounded">
                    <Tag className="h-5 w-5 text-primary-400" />
                  </div>

                  {/* Tag Info */}
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-medium">{tag.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Utilisé dans {tag.count} produit{tag.count > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Product Count Badge */}
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-dark-900 rounded-full">
                    <Package className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tag.count}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/products?tags=${encodeURIComponent(tag.name)}`}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-all duration-200"
                      title="Voir les produits"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setRenameModal(tag.name)
                        setNewName(tag.name)
                      }}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-all duration-200"
                      title="Renommer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(tag.name)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-all duration-200"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Renommer le tag</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Tag actuel</label>
                <div className="px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-500 dark:text-gray-400">
                  {renameModal}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Nouveau nom</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  setRenameModal(null)
                  setNewName('')
                }}
                disabled={renaming}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleRename}
                disabled={renaming || !newName || newName === renameModal}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {renaming && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Renommer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fusionner les tags</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Tags à fusionner ({selectedTags.length})
                </label>
                <div className="p-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary-500/20 text-primary-400 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Tag cible (résultat)</label>
                <input
                  type="text"
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  placeholder="Entrez le nom du tag final"
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tous les produits auront ce tag à la place des tags sélectionnés
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  setMergeModal(false)
                  setMergeTarget('')
                }}
                disabled={merging}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleMerge}
                disabled={merging || !mergeTarget}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {merging && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Fusionner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer le tag <strong className="text-gray-900 dark:text-white">{deleteConfirm}</strong> de tous les produits ?
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
