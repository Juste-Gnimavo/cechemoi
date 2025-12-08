'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Loader2, Wine, Filter, ChevronDown } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  wineType: string | null
  region: string | null
  vintage: string | null
  stock: number
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
}

// Fixed wine categories
const WINE_CATEGORIES = [
  { name: 'Tous', slug: '', color: 'from-gray-500 to-gray-700' },
  { name: 'Grands Vins', slug: 'grands-vins', color: 'from-amber-600 to-amber-800' },
  { name: 'Vin rouge', slug: 'vin-rouge', color: 'from-red-500 to-red-700' },
  { name: 'Vin blanc', slug: 'vin-blanc', color: 'from-amber-300 to-amber-500' },
  { name: 'Vin rosé', slug: 'vin-rose', color: 'from-pink-400 to-pink-600' },
  { name: 'Effervescent', slug: 'vin-effervescent', color: 'from-yellow-300 to-yellow-500' },
  { name: 'Champagne', slug: 'champagne', color: 'from-yellow-500 to-yellow-700' },
]

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

export default function VinsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchWines() {
      try {
        setLoading(true)

        // Build query parameters
        const params = new URLSearchParams()
        params.append('isWine', 'true')
        params.append('limit', '50')

        // Add category filter if selected
        if (selectedCategory) {
          params.append('categorySlug', selectedCategory)
        }

        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          let wines = data.products || []

          // Sort products client-side
          switch (sortBy) {
            case 'price-asc':
              wines = wines.sort((a: Product, b: Product) =>
                (a.salePrice || a.price) - (b.salePrice || b.price)
              )
              break
            case 'price-desc':
              wines = wines.sort((a: Product, b: Product) =>
                (b.salePrice || b.price) - (a.salePrice || a.price)
              )
              break
            case 'name-asc':
              wines = wines.sort((a: Product, b: Product) =>
                a.name.localeCompare(b.name)
              )
              break
            // 'newest' is default from API
          }

          setProducts(wines)
        }
      } catch (error) {
        console.error('Error fetching wines:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWines()
  }, [selectedCategory, sortBy])

  const currentCategory = WINE_CATEGORIES.find(c => c.slug === selectedCategory)

  return (
    <div className="min-h-screen flex flex-col bg-[#13151a]">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-dark-800 to-[#13151a] border-b border-dark-700">
          <div className="container mx-auto px-4 py-16">
            <div className="flex items-center gap-3 mb-4">
              <Wine className="w-8 h-8 text-primary-500" />
              <h1 className="text-4xl md:text-5xl font-sans font-bold text-white">
                Nos Vins
              </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              Découvrez notre sélection de vins d'exception, soigneusement choisis pour satisfaire les palais les plus exigeants.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Category Pills - Desktop */}
              <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2">
                {WINE_CATEGORIES.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === category.slug
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    {selectedCategory === category.slug && (
                      <span
                        className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-full`}
                      />
                    )}
                    <span className="relative z-10">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Category Dropdown */}
              <div className="md:hidden flex-1">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg text-white w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {currentCategory?.name || 'Tous les vins'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-dark-800 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="newest">Plus récents</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name-asc">Nom A-Z</option>
              </select>
            </div>

            {/* Mobile Category List */}
            {showFilters && (
              <div className="md:hidden mt-4 flex flex-wrap gap-2">
                {WINE_CATEGORIES.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => {
                      setSelectedCategory(category.slug)
                      setShowFilters(false)
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCategory === category.slug
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-12">
          {/* Results Count */}
          <p className="text-gray-400 mb-6">
            {products.length} {products.length === 1 ? 'vin trouvé' : 'vins trouvés'}
            {selectedCategory && ` dans "${currentCategory?.name}"`}
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-400">Chargement des vins...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.images[0] || '/placeholder.png',
                    wineType: product.wineType || undefined,
                    region: product.region || undefined,
                    vintage: product.vintage || undefined,
                    mainCategorySlug: product.mainCategorySlug,
                    subCategorySlug: product.subCategorySlug,
                    featured: product.featured,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Wine className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun vin disponible
              </h3>
              <p className="text-gray-400">
                {selectedCategory
                  ? 'Aucun vin dans cette catégorie pour le moment.'
                  : 'Revenez bientôt pour découvrir notre sélection.'}
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Voir tous les vins
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
