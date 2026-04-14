'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { User, Heart, Menu, X, Search, LogOut, Package, Settings, LayoutDashboard, Sun, Moon, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
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

function MegaMenuNavItem({ category }: { category: RootCategory }) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleEnter = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }, [])

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const columns = chunkArray(category.children, 3)

  return (
    <div className="static" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href={`/categorie/${category.slug}`}
        className={`text-gray-300 hover:text-primary-400 transition-colors text-sm font-medium flex items-center gap-1 ${isOpen ? 'text-primary-400' : ''}`}
      >
        {category.name}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Link>

      {/* Mega Dropdown — full width, anchored to header container */}
      <div
        className={`absolute left-0 right-0 top-full mt-0 bg-dark-800 border-t border-dark-700 shadow-2xl z-50 transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-4 py-6">
          {/* Category title */}
          <Link
            href={`/categorie/${category.slug}`}
            className="inline-block text-primary-400 font-semibold text-sm mb-4 hover:text-primary-300 transition-colors"
          >
            Tout voir {category.name}
          </Link>

          {/* 3 Columns of subcategories */}
          <div className="grid grid-cols-3 gap-8">
            {columns.map((col, colIndex) => (
              <div key={colIndex}>
                {col.map((subcat) => (
                  <Link
                    key={subcat.id}
                    href={`/categorie/${subcat.slug}`}
                    className="block text-gray-400 hover:text-white text-sm py-1.5 transition-colors"
                  >
                    {subcat.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<RootCategory[]>([])
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { currency, toggleCurrency, fetchExchangeRate } = useCurrency()
  const { theme, toggleTheme } = useTheme()

  // Fetch categories for mega menu
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

  // Fetch exchange rate on mount
  useEffect(() => {
    fetchExchangeRate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="relative z-50 bg-[#1a1d24] border-b border-dark-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18">
          {/* Logo - Horizontal */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/web/logo-cechemoi-transparent-dark-mode.png"
              alt="CÈCHÉMOI"
              width={200}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            <Link
              href="/"
              className="text-gray-300 hover:text-primary-400 transition-colors text-sm font-medium"
            >
              Accueil
            </Link>
            {categories.map(cat => (
              <MegaMenuNavItem key={cat.id} category={cat} />
            ))}
            <Link
              href="/showroom"
              className="text-gray-300 hover:text-primary-400 transition-colors text-sm font-medium"
            >
              Showroom
            </Link>
            <Link
              href="/sur-mesure"
              className="px-4 py-1.5 bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 rounded-full transition-colors text-sm font-medium"
            >
              Sur-Mesure ✨
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* User Section */}
            {session ? (
              <>
                {/* User Name with Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="text-gray-300 hover:text-primary-400 transition-colors flex items-center gap-2"
                    title="Mon compte"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
                      {session.user?.name || 'Mon Compte'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-dark-700">
                        <p className="text-sm font-medium text-white truncate">
                          {session.user?.name || 'Mon Compte'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {(session.user as any)?.phone || session.user?.email || ''}
                        </p>
                        {['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role) && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400 rounded">
                            {(session.user as any)?.role}
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        {/* Admin Dashboard - Only for admin roles */}
                        {['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role) && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-primary-400 hover:bg-dark-700 hover:text-primary-300 transition-colors font-medium"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Administration
                          </Link>
                        )}
                        {/* Customer Dashboard */}
                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Tableau de bord
                        </Link>
                        <Link
                          href="/account/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Mon profil
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Mes commandes
                        </Link>
                        <Link
                          href="/account/appointments"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                        >
                          <CalendarDays className="w-4 h-4" />
                          Mes rendez-vous
                        </Link>
                        <Link
                          href="/account/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Paramètres
                        </Link>
                      </div>
                      <div className="border-t border-dark-700 py-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tableau de bord - Quick access link */}
                <Link
                  href={['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role) ? '/admin' : '/account'}
                  className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Tableau de bord</span>
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login-phone"
                className="text-gray-300 hover:text-primary-400 transition-colors flex items-center gap-2"
                title="Connexion"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">Login</span>
              </Link>
            )}

            {/* Rendez-vous CTA Button */}
            <Link
              href="/consultation"
              className="hidden md:flex items-center justify-center p-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
              title="Prendre rendez-vous"
            >
              <CalendarDays className="w-5 h-5" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-theme-bg-tertiary dark:bg-dark-700 hover:bg-theme-border-primary dark:hover:bg-dark-600 text-theme-text-secondary dark:text-gray-300 hover:text-theme-accent-primary dark:hover:text-white transition-colors"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Currency Toggle */}
            <button
              onClick={toggleCurrency}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-theme-bg-tertiary dark:bg-dark-700 hover:bg-theme-border-primary dark:hover:bg-dark-600 text-theme-text-secondary dark:text-gray-300 hover:text-theme-text-primary dark:hover:text-white rounded-md transition-colors"
              title={currency === 'XOF' ? 'Afficher en Euros' : 'Afficher en CFA'}
            >
              <span className={currency === 'XOF' ? 'text-copper-500' : 'text-theme-text-muted dark:text-gray-500'}>CFA</span>
              <span className="text-theme-text-muted dark:text-gray-500">/</span>
              <span className={currency === 'EUR' ? 'text-copper-500' : 'text-theme-text-muted dark:text-gray-500'}>EUR</span>
            </button>

            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-gray-300 hover:text-primary-400 transition-colors"
              title="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Icon */}
            <Link
              href="/account/wishlist"
              className="relative text-gray-300 hover:text-primary-400 transition-colors"
              title="Favoris"
            >
              <Heart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                0
              </span>
            </Link>

            {/* Cart Icon with Mini Cart Dropdown */}
            <MiniCart />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-gray-300 hover:text-primary-400"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-dark-700">
            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                className="text-gray-300 hover:text-primary-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>

              {/* Mobile Category Accordions */}
              {categories.map(cat => (
                <div key={cat.id}>
                  <button
                    onClick={() => setExpandedMobileCategory(expandedMobileCategory === cat.id ? null : cat.id)}
                    className="flex items-center justify-between w-full text-gray-300 hover:text-primary-400 transition-colors py-2"
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

              <Link
                href="/showroom"
                className="text-gray-300 hover:text-primary-400 transition-colors py-2 block"
                onClick={() => setIsMenuOpen(false)}
              >
                Showroom
              </Link>
              <Link
                href="/sur-mesure"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 border border-primary-500/30 text-primary-400 rounded-lg transition-colors font-medium mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sur-Mesure ✨
              </Link>
              <Link
                href="/consultation"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg transition-colors font-medium mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <CalendarDays className="w-4 h-4" />
                Prendre Rendez-vous
              </Link>
              {session && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="text-gray-300 hover:text-primary-400 transition-colors py-2 text-left"
                >
                  Déconnexion
                </button>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  )
}
