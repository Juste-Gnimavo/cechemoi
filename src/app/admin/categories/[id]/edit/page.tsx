'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  parent: Category | null
  children: Category[]
  _count?: {
    products: number
  }
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [parentId, setParentId] = useState('')
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload')
  const [isDragging, setIsDragging] = useState(false)

  // Error state
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategory()
    fetchCategories()
  }, [params.id])

  const fetchCategory = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/categories/${params.id}`)
      const data = await res.json()

      if (data.success) {
        const cat = data.category
        setCategory(cat)
        setName(cat.name)
        setSlug(cat.slug)
        setDescription(cat.description || '')
        setImage(cat.image || '')
        setParentId(cat.parentId || '')
      } else {
        setError('Catégorie non trouvée')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (data.success) {
        const filtered = data.categories.filter(
          (cat: Category) => cat.id !== params.id
        )
        setCategories(filtered)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Type de fichier invalide. Utilisez JPG, PNG, GIF ou WEBP')
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Fichier trop volumineux. Maximum 50MB')
      return false
    }
    return true
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !validateFile(file)) return
    setError('')
    await uploadFile(file)
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file || !validateFile(file)) return
    setError('')
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'categories')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        setImage(data.url)
      } else {
        setError(data.error || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name) {
      setError('Le nom est requis')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          image: image || undefined,
          parentId: parentId || null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/categories')
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/categories/${params.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/categories')
      } else {
        setError(data.error || 'Erreur lors de la suppression')
        setDeleteConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Erreur lors de la suppression')
      setDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">{error || 'Catégorie non trouvée'}</p>
        <Link
          href="/admin/categories"
          className="inline-block mt-4 text-primary-500 hover:underline"
        >
          Retour aux catégories
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier la Catégorie</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{category.name}</p>
        </div>
        <Link
          href="/admin/categories"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
      </div>

      {/* Category Info */}
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-4 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-primary-500 dark:text-primary-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Produits dans cette catégorie</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {category._count?.products || 0}
              </p>
            </div>
          </div>
          {category._count && category._count.products > 0 && (
            <Link
              href={`/admin/products?category=${category.id}`}
              className="text-sm text-primary-500 hover:underline"
            >
              Voir les produits
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6 shadow-lg shadow-black/5 dark:shadow-black/20">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Nom de la catégorie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Slug (URL)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez uniquement des lettres minuscules, chiffres et tirets.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Image <span className="text-gray-500 text-xs font-normal">(optionnel - logo par défaut si non fourni)</span>
            </label>

            {/* Upload Method Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  uploadMethod === 'upload'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-dark-700'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Télécharger un fichier
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-dark-700'
                }`}
              >
                <ImageIcon className="h-4 w-4 inline mr-2" />
                URL de l'image
              </button>
            </div>

            {/* Upload Method: File Upload */}
            {uploadMethod === 'upload' && (
              <>
                {!image && !uploading && (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragging
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-300 dark:border-dark-700 hover:border-primary-500'
                    }`}
                  >
                    <input
                      type="file"
                      id="imageInput"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="imageInput" className="cursor-pointer block">
                      <Upload className={`h-12 w-12 mx-auto mb-3 transition-colors ${
                        isDragging ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <p className="text-gray-900 dark:text-white mb-1 font-medium">
                        {isDragging ? 'Déposez votre image ici' : 'Glissez-déposez une image ou cliquez pour parcourir'}
                      </p>
                      <p className="text-sm text-gray-500">JPG, PNG, GIF, WEBP (max 50MB)</p>
                    </label>
                  </div>
                )}

                {uploading && (
                  <div className="p-6 bg-primary-500/10 border border-primary-500/30 rounded-lg text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-2" />
                    <p className="text-sm text-primary-400">Téléchargement en cours...</p>
                  </div>
                )}

                {image && !uploading && (
                  <div className="relative border border-gray-200 dark:border-dark-700 rounded-lg p-4 bg-gray-100 dark:bg-dark-900">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">Image actuelle</p>
                      <label
                        htmlFor="imageInputReplace"
                        className="text-xs text-primary-500 hover:text-primary-400 cursor-pointer font-medium"
                      >
                        Remplacer
                      </label>
                      <input
                        type="file"
                        id="imageInputReplace"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Upload Method: URL */}
            {uploadMethod === 'url' && (
              <>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  URL complète de l'image de la catégorie
                </p>

                {image && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Aperçu :</p>
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700">
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setError("URL de l'image invalide")}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Catégorie Parente
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Aucune (Catégorie Racine)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {category.parent && (
              <p className="text-xs text-gray-500 mt-2">
                Actuellement sous : {category.parent.name}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center space-x-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500 text-red-500 rounded-lg transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer</span>
          </button>

          {/* Save Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/categories"
              className="px-6 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 max-w-md w-full shadow-xl shadow-black/10 dark:shadow-black/30">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-500 dark:text-gray-400">
                Êtes-vous sûr de vouloir supprimer la catégorie <strong className="text-gray-900 dark:text-white">{category.name}</strong> ?
              </p>

              {category._count && category._count.products > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3">
                  <p className="text-yellow-600 dark:text-yellow-500 text-sm">
                    Cette catégorie contient {category._count.products} produit(s). Vous devez d'abord déplacer ou supprimer ces produits.
                  </p>
                </div>
              )}

              {category.children && category.children.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3">
                  <p className="text-yellow-600 dark:text-yellow-500 text-sm">
                    Cette catégorie a {category.children.length} sous-catégorie(s). Vous devez d'abord les déplacer ou les supprimer.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || (category._count && category._count.products > 0) || (category.children && category.children.length > 0)}
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
