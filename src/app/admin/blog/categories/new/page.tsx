'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

const COLORS = [
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Jaune', value: '#eab308' },
  { name: 'Vert', value: '#22c55e' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Rose', value: '#ec4899' },
]

export default function NewBlogCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug
    const generatedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          image,
          color
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Catégorie créée avec succès')
        router.push('/admin/blog/categories')
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating category:', error)
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
            href="/admin/blog/categories"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle catégorie</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Créer une nouvelle catégorie de blog</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Nom de la catégorie *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Conseils"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Slug (URL)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="conseils"
            />
            <p className="text-gray-500 text-xs mt-1">
              Généré automatiquement si vide
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Description de la catégorie..."
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Image (URL)
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://exemple.com/image.jpg"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Couleur
            </label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c.value ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-dark-800' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Aperçu
            </label>
            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-dark-900 rounded-lg">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                <span style={{ color }} className="text-xl font-bold">
                  {name.charAt(0).toUpperCase() || 'C'}
                </span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">{name || 'Nom de la catégorie'}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">/{slug || 'slug'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <Link
              href="/admin/blog/categories"
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-900 dark:text-white rounded-lg text-center transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Créer la catégorie
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
