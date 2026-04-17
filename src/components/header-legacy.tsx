'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { User, Heart, Menu, X, Search, LogOut, Package, Settings, LayoutDashboard, Sun, Moon, CalendarDays, ChevronDown, ChevronRight, Sparkles, Store } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SearchModal } from '@/components/search-modal'
import { MiniCart } from '@/components/mini-cart'
import { useCurrency } from '@/store/currency'
import { useTheme } from '@/store/theme'

interface CategoryChild {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
}

interface RootCategory {
  id: string
  name: string
  slug: string
  children: CategoryChild[]
}

function chunkArray<T>(arr: T[], columns: number): T[][] {
  const size = Math.ceil(arr.length / columns)
  return Array.from({ length: columns }, (_, i) => arr.slice(i * size, (i + 1) * size))
}

// ─── "Toutes les catégories" Flyout Menu (Amazon-style) ──────────────────────
function AllCategoriesFlyout({
  isOpen,
  onClose,
  categories,
}: {
  isOpen: boolean
  onClose: () => void
  categories: RootCategory[]
}) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Reset hovered category when closing
  useEffect(() => {
    if (!isOpen) setHoveredCategory(null)
  }, [isOpen])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const handleCategoryEnter = useCallback((catId: string) => {
    clearTimeout(timeoutRef.current)
    setHoveredCategory(catId)
  }, [])

  const handleCategoryLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setHoveredCategory(null), 200)
  }, [])

  const hoveredCat = categories.find(c => c.id === hoveredCategory)

  if (!isOpen) return null

  return (
    <div ref={menuRef} className="absolute left-0 top-0 z-[100] flex shadow-2xl">
      {/* Left panel — main categories */}
      <div className="w-64 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-bl-lg overflow-hidden">
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/categorie/${cat.slug}`}
            onClick={onClose}
            onMouseEnter={() => handleCategoryEnter(cat.id)}
            onMouseLeave={handleCategoryLeave}
            className={`flex items-center justify-between px-5 py-3 text-sm transition-colors ${
              hoveredCategory === cat.id
                ? 'bg-gray-100 dark:bg-dark-800 text-primary-500 font-medium'
                : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-800'
            }`}
          >
            <span>{cat.name}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}

        {/* Quick Links */}
        <div className="border-t border-gray-200 dark:border-dark-700">
          <Link
            href="/catalogue"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Store className="w-4 h-4" />
            Catalogue complet
          </Link>
          <Link
            href="/sur-mesure"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Sur-Mesure
          </Link>
          <Link
            href="/consultation"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors font-medium"
          >
            <CalendarDays className="w-4 h-4" />
            Rendez-vous
          </Link>
          <Link
            href="/showroom"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors font-medium"
          >
            <Package className="w-4 h-4" />
            Showroom
          </Link>
        </div>
      </div>

      {/* Right panel — subcategories (appears on hover) */}
      {hoveredCat && hoveredCat.children.length > 0 && (
        <div
          className="w-[600px] bg-white dark:bg-dark-900 border border-l-0 border-gray-200 dark:border-dark-700 rounded-br-lg p-6 max-h-[70vh] overflow-y-auto"
          onMouseEnter={() => {
            clearTimeout(timeoutRef.current)
          }}
          onMouseLeave={handleCategoryLeave}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-gray-900 dark:text-white font-bold text-base">{hoveredCat.name}</h3>
            <Link
              href={`/categorie/${hoveredCat.slug}`}
              onClick={onClose}
              className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
            >
              Tout voir →
            </Link>
          </div>

          {/* Subcategories grid */}
          <div className="grid grid-cols-3 gap-2">
            {hoveredCat.children.map(subcat => (
              <Link
                key={subcat.id}
                href={`/categorie/${subcat.slug}`}
                onClick={onClose}
                className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors capitalize-first"
              >
                {subcat.name.charAt(0).toUpperCase() + subcat.name.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline Search Bar (Amazon-style, always visible) ────────────────────────
function InlineSearchBar() {
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/catalogue?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <>
      {/* Desktop: inline search bar */}
      <form onSubmit={handleSubmit} className="hidden lg:flex flex-1 max-w-2xl mx-6">
        <div className="flex w-full rounded-lg overflow-hidden ring-2 ring-primary-500/60 hover:ring-primary-400 focus-within:ring-primary-400 transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, une catégorie..."
            className="flex-1 px-4 py-2.5 bg-white text-gray-900 text-sm outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="px-4 bg-primary-500 hover:bg-primary-600 text-white transition-colors flex items-center justify-center"
            title="Rechercher"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Mobile: search icon → opens search modal */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="lg:hidden text-gray-300 hover:text-primary-400 transition-colors"
        title="Rechercher"
      >
        <Search className="w-5 h-5" />
      </button>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

// ─── Main Header Export ──────────────────────────────────────────────────────
export function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<RootCategory[]>([])
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { currency, toggleCurrency, fetchExchangeRate } = useCurrency()
  const { theme, toggleTheme } = useTheme()

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories?includeChildren=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories.filter((c: RootCategory) => c.children?.length > 0))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch exchange rate
  useEffect(() => {
    fetchExchangeRate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navigation bar links
  const navLinks = [
    { href: '/categorie/tenue-femme', label: 'Tenues Femmes' },
    { href: '/categorie/tenue-homme', label: 'Tenues Hommes' },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/categorie/blouson-dame', label: 'Blouson Dame' },
    { href: '/categorie/chemisier-femme', label: 'Chemisier Dame' },
    { href: '/categorie/tunique', label: 'Tunique Homme' },
    { href: '/categorie/veste-femme', label: 'Veste Femme' },
    { href: '/sur-mesure', label: 'Sur-Mesure', highlight: true },
    { href: '/consultation', label: 'Rendez-vous', highlight: true },
    { href: '/showroom', label: 'Showroom', highlight: true },
  ]

  return (
    <>
      <header className="relative z-50 bg-[#1a1d24]">
        {/* ═══════════════════ ROW 1: Logo + Search + Account/Cart ═══════════════════ */}
        <div className="border-b border-dark-700/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 h-16">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logo/web/logo-cechemoi-transparent-dark-mode.png"
                  alt="CÈCHÉMOI"
                  width={180}
                  height={54}
                  className="h-14 w-auto"
                  priority
                />
              </Link>

              {/* Location / Store address — Amazon-style */}
              <Link
                href="/showroom"
                className="hidden lg:flex flex-col items-start text-gray-300 hover:text-white transition-colors flex-shrink-0 leading-tight"
              >
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  📍 Notre boutique
                </span>
                <span className="text-sm font-semibold">Abidjan, Côte d&apos;Ivoire</span>
              </Link>

              {/* Search Bar (desktop — always visible) */}
              <InlineSearchBar />

              {/* Right Side: Account + Icons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* User Section */}
                {session ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="text-gray-300 hover:text-white transition-colors flex flex-col items-start leading-tight"
                      title="Mon compte"
                    >
                      <span className="text-[10px] text-gray-400">Bonjour, {session.user?.name?.split(' ')[0] || 'Client'}</span>
                      <span className="text-sm font-semibold flex items-center gap-0.5">
                        Compte & listes
                        <ChevronDown className="w-3 h-3" />
                      </span>
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {session.user?.name || 'Mon Compte'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {(session.user as any)?.phone || session.user?.email || ''}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Tableau de bord
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            Mes commandes
                          </Link>
                          <Link
                            href="/account/appointments"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                          >
                            <CalendarDays className="w-4 h-4" />
                            Mes rendez-vous
                          </Link>
                          <Link
                            href="/account/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Paramètres
                          </Link>
                        </div>
                        <div className="border-t border-gray-200 dark:border-dark-700 py-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              signOut({ callbackUrl: '/' })
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login-phone"
                    className="text-gray-300 hover:text-white transition-colors flex flex-col items-start leading-tight"
                  >
                    <span className="text-[10px] text-gray-400">Bonjour</span>
                    <span className="text-sm font-semibold">Identifiez-vous</span>
                  </Link>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="hidden md:flex p-2 text-gray-400 hover:text-white transition-colors"
                  title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Wishlist with label */}
                <Link
                  href="/account/wishlist"
                  className="relative text-gray-300 hover:text-white transition-colors hidden md:flex items-end gap-0.5"
                  title="Favoris"
                >
                  <div className="relative">
                    <Heart className="w-6 h-6" />
                    <span className="absolute -top-1.5 -right-1.5 bg-primary-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      0
                    </span>
                  </div>
                  <span className="text-xs font-semibold pb-0.5">Favoris</span>
                </Link>

                {/* Cart */}
                <MiniCart />

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden text-gray-300 hover:text-white"
                  aria-label="Menu"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════ ROW 2: Navigation Bar ═══════════════════ */}
        <div className="relative bg-[#232f3e] dark:bg-[#232830]">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-10 gap-0.5 overflow-x-auto scrollbar-hide">
              {/* "Toutes les catégories" button */}
              <button
                onClick={() => setIsCategorySidebarOpen(!isCategorySidebarOpen)}
                className={`flex items-center gap-1.5 px-3 h-10 text-white font-semibold text-sm hover:outline hover:outline-1 hover:outline-white/40 rounded-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  isCategorySidebarOpen ? 'outline outline-1 outline-white/40' : ''
                }`}
              >
                <Menu className="w-4 h-4" />
                Toutes les catégories
              </button>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-600 flex-shrink-0 mx-1" />

              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 h-full flex items-center rounded-sm transition-all text-sm whitespace-nowrap flex-shrink-0 ${
                    link.highlight
                      ? 'text-primary-400 font-semibold hover:bg-primary-500/15'
                      : 'text-gray-200 hover:outline hover:outline-1 hover:outline-white/40'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Flyout Menu — positioned outside overflow container */}
          <div className="container mx-auto px-4">
            <AllCategoriesFlyout
              isOpen={isCategorySidebarOpen}
              onClose={() => setIsCategorySidebarOpen(false)}
              categories={categories}
            />
          </div>
        </div>

        {/* ═══════════════════ MOBILE MENU ═══════════════════ */}
        {isMenuOpen && (
          <nav className="lg:hidden bg-[#1a1d24] border-t border-dark-700">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-1">
              {/* Search bar for mobile */}
              <div className="mb-3">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    // Small delay to let menu close before opening search
                    setTimeout(() => {
                      const searchBtn = document.querySelector('[data-mobile-search]') as HTMLButtonElement
                      searchBtn?.click()
                    }, 100)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-gray-400 text-sm"
                >
                  <Search className="w-4 h-4" />
                  Rechercher un produit...
                </button>
              </div>

              {/* Quick nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-primary-400 transition-colors py-2 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider */}
              <div className="border-t border-dark-700 my-2" />

              {/* Category Accordions */}
              <p className="text-xs text-gray-500 uppercase tracking-wider py-1">Toutes les catégories</p>
              {categories.map(cat => (
                <div key={cat.id}>
                  <button
                    onClick={() => setExpandedMobileCategory(expandedMobileCategory === cat.id ? null : cat.id)}
                    className="flex items-center justify-between w-full text-gray-300 hover:text-primary-400 transition-colors py-2 text-sm"
                  >
                    <span>{cat.name}</span>
                    {expandedMobileCategory === cat.id ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedMobileCategory === cat.id && (
                    <div className="pl-4 pb-2 space-y-1">
                      <Link
                        href={`/categorie/${cat.slug}`}
                        className="block text-primary-400 text-sm py-1.5 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Tout voir
                      </Link>
                      {cat.children.map(subcat => (
                        <Link
                          key={subcat.id}
                          href={`/categorie/${subcat.slug}`}
                          className="block text-gray-400 hover:text-white text-sm py-1.5 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subcat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-dark-700 my-2" />

              {/* Mobile utility links */}
              <div className="flex items-center gap-4 py-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                </button>
              </div>

              {/* Wishlist mobile */}
              <Link
                href="/account/wishlist"
                className="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="w-4 h-4" />
                Favoris
              </Link>

              {session && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors py-2 text-sm text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

    </>
  )
}
