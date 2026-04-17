'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { Loader2, ChevronRight, Home } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  garmentType: string | null
  style: string | null
  collection: string | null
  stock: number
  mainCategorySlug: string | null
  subCategorySlug: string | null
  featured?: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  children?: { id: string; name: string; slug: string }[]
  parent?: { id: string; name: string; slug: string } | null
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategoryAndProducts() {
      try {
        setLoading(true)
        setError(null)

        // Fetch category details
        const categoryResponse = await fetch(`/api/categories?slug=${slug}&includeChildren=true`)
        const categoryData = await categoryResponse.json()

        if (!categoryData.success || !categoryData.data.categories?.[0]) {
          setError('Catégorie non trouvée')
          return
        }

        const cat = categoryData.data.categories[0] as Category
        setCategory(cat)

        // Fetch products
        const productsResponse = await fetch(`/api/products?categorySlug=${slug}&limit=50`)
        const productsData = await productsResponse.json()

        if (productsData.success) {
          setProducts(productsData.products || [])
        }
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Erreur lors du chargement de la catégorie')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCategoryAndProducts()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-4">
          {error || 'Catégorie non trouvée'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          La catégorie que vous recherchez n&apos;existe pas.
        </p>
      </div>
    )
  }

  const isRootCategory = !category.parent
  const hasSidebar = (category.children && category.children.length > 0) || category.parent

  return (
    <>
      {/* Category Header with Breadcrumb */}
      <div className="mb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4 flex-wrap">
          <Link href="/" className="hover:text-primary-400 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Accueil
          </Link>
          {category.parent && (
            <>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <Link
                href={`/categorie/${category.parent.slug}`}
                className="hover:text-primary-400 transition-colors"
              >
                {category.parent.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-gray-900 dark:text-white font-medium">{category.name}</span>
        </nav>

        <h1 className="text-3xl lg:text-4xl font-sans font-bold text-gray-900 dark:text-white mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl">
            {category.description}
          </p>
        )}
        <p className="text-gray-500 mt-2 text-sm">
          {products.length} {products.length === 1 ? 'produit' : 'produits'}
        </p>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${
          hasSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
        }`}>
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
                garmentType: product.garmentType || undefined,
                style: product.style || undefined,
                collection: product.collection || undefined,
                mainCategorySlug: product.mainCategorySlug,
                subCategorySlug: product.subCategorySlug,
                featured: product.featured,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Aucun produit disponible dans cette catégorie pour le moment.
          </p>
        </div>
      )}
    </>
  )
}
