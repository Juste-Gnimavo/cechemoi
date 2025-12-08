'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RichTextEditor } from '@/components/admin/rich-text-editor'

interface BlogCategory {
  id: string
  name: string
  slug: string
}

interface BlogTag {
  id: string
  name: string
  slug: string
  color: string | null
}

export default function NewBlogPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [published, setPublished] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Image upload state
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload')
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

  useEffect(() => {
    // Auto-generate slug from title
    if (title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)
    }
  }, [title])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/blog/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/blog/tags')
      const data = await res.json()
      if (data.success) {
        setTags(data.tags)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'blog')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setImage(data.url)
        toast.success('Image téléchargée')
      } else {
        toast.error(data.error || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    if (!content.trim()) {
      toast.error('Le contenu est requis')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          image,
          published,
          featured,
          categoryId: categoryId || null,
          tagIds: selectedTags,
          metaTitle,
          metaDescription
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Article créé avec succès')
        router.push('/admin/blog/posts')
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog/posts"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvel article</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Créer un nouvel article de blog</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/blog/posts')}
            className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informations de base</h2>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Titre de l'article"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="titre-de-larticle"
              />
              <p className="text-gray-500 text-xs mt-1">
                Généré automatiquement si vide
              </p>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                Extrait
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Résumé de l'article (affiché dans les listes)..."
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contenu *</h2>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Écrivez le contenu de votre article..."
            />
          </div>

          {/* Featured Image */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Image à la une</h2>

            {/* Upload Method Tabs */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  uploadMethod === 'upload'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Télécharger
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="h-4 w-4 inline mr-2" />
                URL
              </button>
            </div>

            {uploadMethod === 'upload' ? (
              <div
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-300 dark:border-dark-600 hover:border-primary-500'
                }`}
              >
                <input
                  type="file"
                  id="featuredImage"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="featuredImage" className="cursor-pointer block">
                  {uploading ? (
                    <Loader2 className="h-12 w-12 mx-auto mb-3 text-primary-500 animate-spin" />
                  ) : (
                    <Upload className={`h-12 w-12 mx-auto mb-3 ${isDragging ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  )}
                  <p className="text-gray-900 dark:text-white mb-1 font-medium">
                    {isDragging ? 'Déposez l\'image ici' : 'Glissez-déposez ou cliquez'}
                  </p>
                  <p className="text-sm text-gray-500">JPG, PNG, WEBP (max 10MB)</p>
                </label>
              </div>
            ) : (
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://exemple.com/image.jpg"
              />
            )}

            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SEO</h2>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                Meta titre
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Titre pour les moteurs de recherche"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                Meta description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Description pour les moteurs de recherche"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Publication</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Publier l'article</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Article en vedette</span>
            </label>
          </div>

          {/* Category */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Catégorie</h2>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Aucune catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <Link
              href="/admin/blog/categories/new"
              className="text-primary-500 hover:text-primary-400 text-sm"
            >
              + Créer une catégorie
            </Link>
          </div>

          {/* Tags */}
          <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tags</h2>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            {tags.length === 0 && (
              <p className="text-gray-500 text-sm">Aucun tag disponible</p>
            )}

            <Link
              href="/admin/blog/tags/new"
              className="text-primary-500 hover:text-primary-400 text-sm"
            >
              + Créer un tag
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
