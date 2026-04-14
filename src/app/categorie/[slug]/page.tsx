'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
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

interface CategoryChild {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  children?: CategoryChild[]
  parent?: { id: string; name: string; slug: string; image: string | null } | null
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sidebar data
  const [sidebarCategories, setSidebarCategories] = useState<CategoryChild[]>([])
  const [parentCategory, setParentCategory] = useState<{ name: string; slug: string } | null>(null)

  useEffect(() => {
    async function fetchCategoryAndProducts() {
      try {
        setLoading(true)
        setError(null)

        // Fetch category details with children
        const categoryResponse = await fetch(`/api/categories?slug=${slug}&includeChildren=true`)
        const categoryData = await categoryResponse.json()

        if (!categoryData.success || !categoryData.data.categories?.[0]) {
          setError('Catégorie non trouvée')
          return
        }

        const cat = categoryData.data.categories[0] as Category

        setCategory(cat)

        // Determine sidebar content
        if (cat.children && cat.children.length > 0 && !cat.parent) {
          // This is a root category — show its children in the sidebar
          setSidebarCategories(cat.children)
          setParentCategory({ name: cat.name, slug: cat.slug })
        } else if (cat.parent) {
          // This is a subcategory — fetch parent to get all siblings
          setParentCategory({ name: cat.parent.name, slug: cat.parent.slug })
          const parentResponse = await fetch(`/api/categories?slug=${cat.parent.slug}&includeChildren=true`)
          const parentData = await parentResponse.json()
          if (parentData.success && parentData.data.categories?.[0]?.children) {
            setSidebarCategories(parentData.data.categories[0].children)
          }
        } else {
          setSidebarCategories([])
          setParentCategory(null)
        }

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

  const isRootCategory = category && !category.parent

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Catégorie non trouvée'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              La catégorie que vous recherchez n&apos;existe pas.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1">
        {/* Category Header with Breadcrumb */}
        <div className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-transparent">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4 flex-wrap">
              <Link href="/" className="hover:text-primary-400 transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                Accueil
              </Link>
              {parentCategory && !isRootCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <Link
                    href={`/categorie/${parentCategory.slug}`}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {parentCategory.name}
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
        </div>

        {/* Mobile Subcategory Pills */}
        {sidebarCategories.length > 0 && (
          <div className="lg:hidden border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900">
            <div className="container mx-auto px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <Link
                  href={`/categorie/${parentCategory?.slug}`}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isRootCategory
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  Tout
                </Link>
                {sidebarCategories.map(subcat => (
                  <Link
                    key={subcat.id}
                    href={`/categorie/${subcat.slug}`}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      subcat.slug === slug
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {subcat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content with Sidebar */}
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            {sidebarCategories.length > 0 && (
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-20 bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                  {/* Sidebar Header */}
                  {parentCategory && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                      <Link
                        href={`/categorie/${parentCategory.slug}`}
                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors"
                      >
                        {parentCategory.name}
                      </Link>
                    </div>
                  )}

                  {/* Subcategory List */}
                  <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
                    {/* "All" link */}
                    <Link
                      href={`/categorie/${parentCategory?.slug}`}
                      className={`block px-4 py-2.5 text-sm transition-colors border-l-2 ${
                        isRootCategory
                          ? 'border-primary-500 bg-primary-500/10 text-primary-500 font-medium'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      Toutes les catégories
                    </Link>

                    {sidebarCategories.map(subcat => (
                      <Link
                        key={subcat.id}
                        href={`/categorie/${subcat.slug}`}
                        className={`block px-4 py-2.5 text-sm transition-colors border-l-2 ${
                          subcat.slug === slug
                            ? 'border-primary-500 bg-primary-500/10 text-primary-500 font-medium'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-800'
                        }`}
                      >
                        {subcat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            {/* Product Grid */}
            <div className="flex-1 min-w-0">
              {products.length > 0 ? (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${
                  sidebarCategories.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
