'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ImageIcon,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  FileText,
  Filter,
  Grid,
  List,
  Loader2,
  X,
  ExternalLink,
  Download,
  FolderOpen,
  RefreshCw,
  Plus,
  Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MediaFile {
  id: string
  name: string
  url: string
  fullUrl: string
  category: string
  type: string
  size: number
  createdAt: string
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('marketing')
  const [newCategory, setNewCategory] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedType) params.set('type', selectedType)
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/admin/media?${params}`)
      const data = await response.json()

      if (data.success) {
        setFiles(data.files)
        setCategories(data.categories)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      } else {
        toast.error(data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Erreur lors du chargement des médias')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedType, searchQuery, pagination.page, pagination.limit])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleCopyUrl = async (file: MediaFile, type: 'relative' | 'full') => {
    const url = type === 'full' ? file.fullUrl : file.url
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(`${file.id}-${type}`)
      toast.success('URL copiée !')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Erreur lors de la copie')
    }
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Supprimer "${file.name}" ?`)) return

    setDeleting(file.id)
    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Fichier supprimé')
        setFiles(prev => prev.filter(f => f.id !== file.id))
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const validateFile = (file: File) => {
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, GIF, WEBP ou PDF')
      return false
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux. Maximum 50MB')
      return false
    }

    return true
  }

  const uploadFile = async (file: File, category: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    return res.json()
  }

  const handleFileUpload = async (fileList: FileList) => {
    const category = newCategory.trim() || uploadCategory
    if (!category) {
      toast.error('Veuillez sélectionner ou créer une catégorie')
      return
    }

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (!validateFile(file)) {
        errorCount++
        continue
      }

      try {
        const data = await uploadFile(file, category)
        if (data.success) {
          successCount++
        } else {
          errorCount++
          toast.error(`Erreur: ${file.name}`)
        }
      } catch (error) {
        errorCount++
      }
    }

    setUploading(false)
    setShowUploadModal(false)
    setNewCategory('')

    if (successCount > 0) {
      toast.success(`${successCount} fichier(s) uploadé(s)`)
      fetchMedia()
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} fichier(s) en erreur`)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      await handleFileUpload(droppedFiles)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-400" />
      case 'document':
        return <FileText className="h-5 w-5 text-blue-400" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Médiathèque</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {pagination.total} fichier{pagination.total !== 1 ? 's' : ''} •
            Gérez vos images et documents pour les campagnes marketing
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          Télécharger
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un fichier..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer min-w-[160px] border border-gray-200 dark:border-transparent"
            >
              <option value="">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer min-w-[140px] border border-gray-200 dark:border-transparent"
            >
              <option value="">Tous types</option>
              <option value="image">Images</option>
              <option value="pdf">PDF</option>
              <option value="document">Documents</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex bg-gray-100 dark:bg-dark-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchMedia}
            disabled={loading}
            className="p-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 p-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun fichier</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || selectedCategory || selectedType
              ? 'Aucun fichier ne correspond aux filtres'
              : 'Commencez par télécharger des images ou documents'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4" />
            Télécharger des fichiers
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map(file => (
            <div
              key={file.id}
              className="group bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 overflow-hidden hover:border-primary-500/50 transition-colors"
            >
              {/* Preview */}
              <div
                className="aspect-square relative cursor-pointer"
                onClick={() => setPreviewFile(file)}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-dark-800">
                    {getFileIcon(file.type)}
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewFile(file)
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Aperçu"
                  >
                    <Eye className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyUrl(file, 'full')
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copier URL"
                  >
                    {copiedId === `${file.id}-full` ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(file)
                    }}
                    disabled={deleting === file.id}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    {deleting === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-400" />
                    )}
                  </button>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 text-xs bg-black/50 text-white rounded">
                    {file.category}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-gray-900 dark:text-white text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Fichier</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Taille</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {files.map(file => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-dark-800 rounded">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm font-medium truncate max-w-[200px]" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-gray-500 text-xs md:hidden">
                          {file.category} • {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 rounded">
                      {file.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm hidden sm:table-cell">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm hidden lg:table-cell">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(file, 'full')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                        title="Copier URL"
                      >
                        {copiedId === `${file.id}-full` ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                        title="Ouvrir"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </a>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deleting === file.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        {deleting === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-400" />
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Précédent
          </button>
          <span className="text-gray-500 dark:text-gray-400">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Télécharger des fichiers</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Catégorie</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['marketing', 'products', 'categories', 'blog', 'banners', 'misc'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setUploadCategory(cat)
                        setNewCategory('')
                      }}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        uploadCategory === cat && !newCategory
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="Ou créer une nouvelle catégorie..."
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  />
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-300 dark:border-dark-700 hover:border-primary-500'
                }`}
              >
                <input
                  type="file"
                  id="mediaUpload"
                  accept="image/*,application/pdf,.doc,.docx"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <label htmlFor="mediaUpload" className="cursor-pointer block">
                  {uploading ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto mb-3 text-primary-500 animate-spin" />
                      <p className="text-gray-900 dark:text-white mb-1 font-medium">Téléchargement en cours...</p>
                    </>
                  ) : (
                    <>
                      <Upload className={`h-12 w-12 mx-auto mb-3 transition-colors ${
                        isDragging ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <p className="text-gray-900 dark:text-white mb-1 font-medium">
                        {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez ou cliquez'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Images (JPG, PNG, GIF, WEBP) ou PDF • Max 50MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 w-full max-w-4xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
                  {previewFile.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {previewFile.category} • {formatFileSize(previewFile.size)} • {formatDate(previewFile.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-4">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[60vh] mx-auto object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-lg">
                  {getFileIcon(previewFile.type)}
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Aperçu non disponible</span>
                </div>
              )}
            </div>

            {/* URLs */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-700 space-y-3">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">URL relative (pour le site)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={previewFile.url}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg text-sm border border-gray-200 dark:border-transparent"
                  />
                  <button
                    onClick={() => handleCopyUrl(previewFile, 'relative')}
                    className="px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    {copiedId === `${previewFile.id}-relative` ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">URL complète (pour marketing externe)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={previewFile.fullUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg text-sm border border-gray-200 dark:border-transparent"
                  />
                  <button
                    onClick={() => handleCopyUrl(previewFile, 'full')}
                    className="px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    {copiedId === `${previewFile.id}-full` ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
              <a
                href={previewFile.url}
                download={previewFile.name}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </a>
              <a
                href={previewFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir
              </a>
              <button
                onClick={() => {
                  handleDelete(previewFile)
                  setPreviewFile(null)
                }}
                disabled={deleting === previewFile.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                {deleting === previewFile.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
