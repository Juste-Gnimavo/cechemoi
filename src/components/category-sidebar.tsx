'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, LayoutGrid } from 'lucide-react'

interface CategoryChild {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
  _count?: { products: number }
}

interface CategoryData {
  id: string
  name: string
  slug: string
  children?: CategoryChild[]
  parent?: { id: string; name: string; slug: string } | null
}

export function CategorySidebar() {
  const pathname = usePathname()
  const slug = pathname.split('/categorie/')[1] || ''

  const [allCategories, setAllCategories] = useState<CategoryData[]>([])
  const [sidebarCategories, setSidebarCategories] = useState<CategoryChild[]>([])
  const [parentCategory, setParentCategory] = useState<{ name: string; slug: string } | null>(null)
  const [isRootCategory, setIsRootCategory] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch all root categories once
  useEffect(() => {
    async function fetchAllCategories() {
      try {
        const res = await fetch('/api/categories?includeChildren=true&published=true')
        const data = await res.json()
        if (data.success) {
          setAllCategories(data.data.categories || [])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllCategories()
  }, [])

  // Update sidebar based on current slug
  useEffect(() => {
    if (!slug || allCategories.length === 0) return

    // Check if slug is a root category
    const rootCat = allCategories.find(c => c.slug === slug)
    if (rootCat) {
      setIsRootCategory(true)
      setParentCategory({ name: rootCat.name, slug: rootCat.slug })
      setSidebarCategories(rootCat.children || [])
      return
    }

    // Check if slug is a subcategory
    for (const root of allCategories) {
      const child = root.children?.find(c => c.slug === slug)
      if (child) {
        setIsRootCategory(false)
        setParentCategory({ name: root.name, slug: root.slug })
        setSidebarCategories(root.children || [])
        return
      }
    }

    // Fallback — show all root categories
    setIsRootCategory(false)
    setParentCategory(null)
    setSidebarCategories([])
  }, [slug, allCategories])

  if (loading) {
    return (
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
            <div className="h-4 w-32 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
          </div>
          <div className="p-2 space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-9 bg-gray-100 dark:bg-dark-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </aside>
    )
  }

  // If no sidebar data and no parent, show all root categories
  if (sidebarCategories.length === 0 && !parentCategory) {
    return (
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Catégories
              </span>
            </div>
          </div>
          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
            {allCategories.map(cat => (
              <Link
                key={cat.id}
                href={`/categorie/${cat.slug}`}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors border-l-2 ${
                  cat.slug === slug
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500 font-medium'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-800'
                }`}
              >
                <span>{cat.name}</span>
                {cat.children && cat.children.length > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-20 bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
        {/* Sidebar Header */}
        {parentCategory && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
            <Link
              href={`/categorie/${parentCategory.slug}`}
              className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4 text-primary-500" />
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
  )
}

// Mobile version — horizontal pills
export function CategorySidebarMobile() {
  const pathname = usePathname()
  const slug = pathname.split('/categorie/')[1] || ''

  const [allCategories, setAllCategories] = useState<CategoryData[]>([])
  const [sidebarCategories, setSidebarCategories] = useState<CategoryChild[]>([])
  const [parentCategory, setParentCategory] = useState<{ name: string; slug: string } | null>(null)
  const [isRootCategory, setIsRootCategory] = useState(false)

  useEffect(() => {
    async function fetchAllCategories() {
      try {
        const res = await fetch('/api/categories?includeChildren=true&published=true')
        const data = await res.json()
        if (data.success) {
          setAllCategories(data.data.categories || [])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchAllCategories()
  }, [])

  useEffect(() => {
    if (!slug || allCategories.length === 0) return

    const rootCat = allCategories.find(c => c.slug === slug)
    if (rootCat) {
      setIsRootCategory(true)
      setParentCategory({ name: rootCat.name, slug: rootCat.slug })
      setSidebarCategories(rootCat.children || [])
      return
    }

    for (const root of allCategories) {
      const child = root.children?.find(c => c.slug === slug)
      if (child) {
        setIsRootCategory(false)
        setParentCategory({ name: root.name, slug: root.slug })
        setSidebarCategories(root.children || [])
        return
      }
    }

    setIsRootCategory(false)
    setParentCategory(null)
    setSidebarCategories([])
  }, [slug, allCategories])

  if (sidebarCategories.length === 0) return null

  return (
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
  )
}
