'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  X
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export default function NewCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload')
  const [parentId, setParentId] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  // Error state
  const [error, setError] = useState('')

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (autoSlug && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
      setSlug(generatedSlug)
    }
  }, [name, autoSlug])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const validateFile = (file: File): boolean => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Type de fichier invalide. Utilisez JPG, PNG, GIF ou WEBP')
      return false
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Fichier trop volumineux. Maximum 50MB')
      return false
    }

    return true
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!validateFile(file)) return

    setImageFile(file)
    setError('')

    // Upload file immediately
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

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    if (!validateFile(file)) return

    setImageFile(file)
    setError('')

    // Upload file immediately
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
        setImageFile(null)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Erreur lors du téléchargement')
      setImageFile(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
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
      setLoading(true)
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          description: description || undefined,
          image: image || undefined, // Will use default at backend if not provided
          parentId: parentId || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/categories')
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      setError('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Catégorie</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Créez une nouvelle catégorie de produits</p>
        </div>
        <Link
          href="/admin/categories"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
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
              placeholder=""
              required
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Slug (URL)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setAutoSlug(false)
                }}
                placeholder=""
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500">
                Généré automatiquement depuis le nom. Utilisez uniquement des lettres minuscules, chiffres et tirets.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la catégorie..."
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
                {!imageFile && !image && (
                  <>
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
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Si aucune image n'est fournie, le logo CÈCHÉMOI sera utilisé par défaut
                    </p>
                  </>
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
                      <Image
                        src={image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={() => setError("Erreur de chargement de l'image")}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{imageFile?.name || 'Image téléchargée'}</p>
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

                {/* Image Preview */}
                {image && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Aperçu :</p>
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700">
                      <Image
                        src={image}
                        alt="Preview"
                        fill
                        className="object-cover"
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
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Sélectionnez une catégorie parente pour créer une sous-catégorie
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/categories"
            className="px-6 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            <span>{loading ? 'Création...' : 'Créer la Catégorie'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
