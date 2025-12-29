'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X, Plus, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { ProductMultiSelect } from '@/components/admin/product-multi-select'
import { useConfetti } from '@/hooks/useConfetti'

interface Category {
  id: string
  name: string
  slug: string
}

interface TaxClass {
  id: string
  name: string
  rate: number
}

export default function NewProductPage() {
  const router = useRouter()
  const { success } = useConfetti()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [taxClasses, setTaxClasses] = useState<TaxClass[]>([])

  // Basic fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description] = useState('') // Legacy - kept for API compatibility
  const [shortDescription, setShortDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [sku, setSku] = useState('')
  const [stock, setStock] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [categoryId, setCategoryId] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([]) // Additional categories
  const [taxClassId, setTaxClassId] = useState('')
  const [published, setPublished] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [isWine, setIsWine] = useState(true) // Has clothing details toggle

  // Marketing - Related and Upsell
  const [relatedProducts, setRelatedProducts] = useState<string[]>([])
  const [upsellProducts, setUpsellProducts] = useState<string[]>([])

  // Clothing specific (using same field names for API compatibility)
  const [vintage, setVintage] = useState('') // Collection
  const [region, setRegion] = useState('') // Style
  const [country, setCountry] = useState('Cote d\'Ivoire') // Origine
  const [grapeVariety, setGrapeVariety] = useState('') // Tissu/Matiere
  const [alcoholContent, setAlcoholContent] = useState('') // Not used for clothing
  const [volume, setVolume] = useState('') // Tailles disponibles
  const [wineType, setWineType] = useState('') // Type de vêtement

  // Metadata
  const [weight, setWeight] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Images
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchTaxClasses()
  }, [])

  useEffect(() => {
    // Auto-generate slug from name
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
      setSlug(generatedSlug)
    }
  }, [name])

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

  const fetchTaxClasses = async () => {
    try {
      const response = await fetch('/api/admin/tax')
      const data = await response.json()
      if (data.success) {
        setTaxClasses(data.taxClasses || [])
      }
    } catch (error) {
      console.error('Error fetching tax classes:', error)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, GIF ou WEBP')
      return false
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux. Maximum 50MB')
      return false
    }

    return true
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!validateFile(file)) continue
      await uploadFile(file)
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!validateFile(file)) continue
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'products')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setImages([...images, data.url])
        toast.success('Image ajoutée avec succès')
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

  const handleAddImage = () => {
    if (imageInput.trim() && !images.includes(imageInput.trim())) {
      setImages([...images, imageInput.trim()])
      setImageInput('')
    }
  }

  const handleRemoveImage = (imageToRemove: string) => {
    setImages(images.filter((img) => img !== imageToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !sku || !categoryId) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          description,
          shortDescription,
          longDescription,
          price: parseFloat(price),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          sku,
          stock: parseInt(stock) || 0,
          lowStockThreshold: parseInt(lowStockThreshold) || 10,
          images,
          categoryId,
          categoryIds, // Additional categories
          taxClassId: taxClassId || null,
          published,
          featured,
          isWine, // Product type flag
          // Marketing
          relatedProducts,
          upsellProducts,
          // Wine fields (only if isWine is true)
          vintage: isWine ? vintage : null,
          region: isWine ? region : null,
          country: isWine ? country : null,
          grapeVariety: isWine ? grapeVariety : null,
          alcoholContent: isWine && alcoholContent ? parseFloat(alcoholContent) : null,
          volume: isWine ? volume : null,
          wineType: isWine ? wineType : null,
          // Metadata
          weight: weight ? parseFloat(weight) : null,
          dimensions,
          tags,
          metaTitle,
          metaDescription,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Celebrate new product! 🍷
        success()
        toast.success('Produit créé avec succès')
        router.push('/admin/products')
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Erreur lors de la création du produit')
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
            href="/admin/products"
            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau produit</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-gray-200 dark:bg-dark-800 hover:bg-gray-300 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 text-white rounded-lg transition-all duration-200"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations de base
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="Ex: Robe Elegance Wax"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Slug (URL)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="robe-elegance-wax"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Généré automatiquement si vide
                </p>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Description courte
                </label>
                <p className="text-gray-500 text-xs mb-2">
                  Résumé du produit (affiché dans les listes)
                </p>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none border border-gray-200 dark:border-transparent"
                  placeholder="Courte description du produit..."
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Description détaillée
                </label>
                <p className="text-gray-500 text-xs mb-2">
                  Description complète avec mise en forme (affiché sur la page produit)
                </p>
                <RichTextEditor
                  value={longDescription}
                  onChange={setLongDescription}
                  placeholder="Description détaillée du produit avec mise en forme..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prix et stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Prix (CFA) *</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="25000"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Prix promotionnel (CFA)
                </label>
                <input
                  type="text"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="20000"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">SKU *</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="ROBE-WAX-001"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Stock</label>
                <input
                  type="text"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Seuil de stock bas
                </label>
                <input
                  type="text"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Marketing - Related & Upsell Products */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Marketing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Produits associés
                </label>
                <p className="text-gray-500 text-xs mb-2">
                  Produits similaires recommandés aux clients
                </p>
                <ProductMultiSelect
                  selectedIds={relatedProducts}
                  onChange={setRelatedProducts}
                  placeholder="Rechercher des produits associés..."
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Produits de vente incitative
                </label>
                <p className="text-gray-500 text-xs mb-2">
                  Produits premium pour augmenter les ventes
                </p>
                <ProductMultiSelect
                  selectedIds={upsellProducts}
                  onChange={setUpsellProducts}
                  placeholder="Rechercher des produits de vente incitative..."
                />
              </div>
            </div>
          </div>

          {/* Clothing Specific Information */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Caractéristiques du vêtement
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Afficher les détails ?</span>
                <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-dark-700">
                  <button
                    type="button"
                    onClick={() => setIsWine(true)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      isWine
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWine(false)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      !isWine
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Non
                  </button>
                </div>
              </div>
            </div>

            {!isWine && (
              <p className="text-gray-500 text-sm italic">
                Les caractéristiques sont masquées (utile pour accessoires, cartes cadeaux, etc.)
              </p>
            )}

            {isWine && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Type de vêtement</label>
                <select
                  value={wineType}
                  onChange={(e) => setWineType(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="Robe">Robe</option>
                  <option value="Robe de soirée">Robe de soirée</option>
                  <option value="Robe de mariée">Robe de mariée</option>
                  <option value="Robe traditionnelle">Robe traditionnelle</option>
                  <option value="Ensemble">Ensemble</option>
                  <option value="Ensemble homme">Ensemble homme</option>
                  <option value="Ensemble femme">Ensemble femme</option>
                  <option value="Boubou">Boubou</option>
                  <option value="Chemise">Chemise</option>
                  <option value="Pantalon">Pantalon</option>
                  <option value="Jupe">Jupe</option>
                  <option value="Veste">Veste</option>
                  <option value="Costume">Costume</option>
                  <option value="Accessoire">Accessoire</option>
                  <option value="Sac">Sac</option>
                  <option value="Bijou">Bijou</option>
                  <option value="Chaussure">Chaussure</option>
                  <option value="Foulard">Foulard</option>
                  <option value="Sur-mesure">Sur-mesure</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Collection</label>
                <input
                  type="text"
                  value={vintage}
                  onChange={(e) => setVintage(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="Collection 2025"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Style</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="Traditionnel">Traditionnel</option>
                  <option value="Moderne">Moderne</option>
                  <option value="Casual">Casual</option>
                  <option value="Chic">Chic</option>
                  <option value="Cérémonie">Cérémonie</option>
                  <option value="Mariage">Mariage</option>
                  <option value="Soirée">Soirée</option>
                  <option value="Travail">Travail</option>
                  <option value="Streetwear">Streetwear</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Origine</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="Cote d'Ivoire"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Tissu / Matière</label>
                <select
                  value={grapeVariety}
                  onChange={(e) => setGrapeVariety(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="Wax">Wax</option>
                  <option value="Kente">Kente</option>
                  <option value="Bazin">Bazin</option>
                  <option value="Soie">Soie</option>
                  <option value="Coton">Coton</option>
                  <option value="Lin">Lin</option>
                  <option value="Satin">Satin</option>
                  <option value="Velours">Velours</option>
                  <option value="Dentelle">Dentelle</option>
                  <option value="Pagne">Pagne</option>
                  <option value="Bogolan">Bogolan</option>
                  <option value="Ankara">Ankara</option>
                  <option value="Cuir">Cuir</option>
                  <option value="Jean">Jean</option>
                  <option value="Polyester">Polyester</option>
                  <option value="Mixte">Mixte</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Tailles disponibles</label>
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="S, M, L, XL ou Sur-mesure"
                />
              </div>
            </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images du produit</h2>

            {/* Upload Method Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  uploadMethod === 'upload'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-dark-700'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Télécharger des fichiers
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-dark-700'
                }`}
              >
                <ImageIcon className="h-4 w-4 inline mr-2" />
                URL des images
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload Method: File Upload */}
              {uploadMethod === 'upload' && (
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
                      id="productImages"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="productImages" className="cursor-pointer block">
                      <Upload className={`h-12 w-12 mx-auto mb-3 transition-colors ${
                        isDragging ? 'text-primary-500' : 'text-gray-500'
                      }`} />
                      <p className="text-gray-900 dark:text-white mb-1 font-medium">
                        {isDragging ? 'Déposez vos images ici' : 'Glissez-déposez des images ou cliquez pour parcourir'}
                      </p>
                      <p className="text-sm text-gray-500">JPG, PNG, GIF, WEBP (max 50MB par fichier)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-600 mt-2">Vous pouvez sélectionner plusieurs images à la fois</p>
                    </label>
                  </div>

                  {uploading && (
                    <div className="p-6 bg-primary-500/10 border border-primary-500/30 rounded-lg text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-2" />
                      <p className="text-primary-500 font-medium">Téléchargement en cours...</p>
                    </div>
                  )}
                </>
              )}

              {/* Upload Method: URL */}
              {uploadMethod === 'url' && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                    className="flex-1 bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                    placeholder="https://exemple.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Images Preview */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {images.length} image{images.length > 1 ? 's' : ''} • La première image sera l'image principale
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-dark-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image)}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded font-medium">
                            Principale
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Meta titre</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
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
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none border border-gray-200 dark:border-transparent"
                  placeholder="Description pour les moteurs de recherche"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Publication</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Publier le produit</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Produit en vedette</span>
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Catégories *</h2>
            <p className="text-gray-500 text-xs mb-3">
              Sélectionnez une ou plusieurs catégories pour ce produit
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((category) => {
                const isSelected = categoryId === category.id || categoryIds.includes(category.id)
                const isPrimary = categoryId === category.id
                return (
                  <label
                    key={category.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'bg-gray-100 dark:bg-dark-800/50 border border-transparent hover:bg-gray-200 dark:hover:bg-dark-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // If no primary category, set this as primary
                          if (!categoryId) {
                            setCategoryId(category.id)
                          } else {
                            // Add to additional categories
                            setCategoryIds([...categoryIds, category.id])
                          }
                        } else {
                          // If unchecking the primary category
                          if (categoryId === category.id) {
                            // Move first additional category to primary if exists
                            if (categoryIds.length > 0) {
                              setCategoryId(categoryIds[0])
                              setCategoryIds(categoryIds.slice(1))
                            } else {
                              setCategoryId('')
                            }
                          } else {
                            // Remove from additional categories
                            setCategoryIds(categoryIds.filter(id => id !== category.id))
                          }
                        }
                      }}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 flex-1">{category.name}</span>
                    {isPrimary && (
                      <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded">
                        Principale
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
            {!categoryId && (
              <p className="text-red-400 text-xs mt-2">
                Veuillez sélectionner au moins une catégorie
              </p>
            )}
          </div>

          {/* Tax Class */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Classe fiscale</h2>
            <select
              value={taxClassId}
              onChange={(e) => setTaxClassId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
            >
              <option value="">Aucune</option>
              {taxClasses.map((taxClass) => (
                <option key={taxClass.id} value={taxClass.id}>
                  {taxClass.name} ({taxClass.rate}%)
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                  }
                  className="flex-1 bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="Ajouter un tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Livraison</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Poids (kg)</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="1.5"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Dimensions (L×l×h cm)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  placeholder="30×20×10"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
