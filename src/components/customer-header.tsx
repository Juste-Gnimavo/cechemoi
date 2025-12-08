'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  ShoppingCart,
  User,
  Home,
  Package,
  MapPin,
  Heart,
  CreditCard,
  FileText,
  Gift,
  Bell,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react'
import { useCart } from '@/store/cart'
import { useTheme } from '@/store/theme'
import { useState } from 'react'

export function CustomerHeader() {
  const { data: session, status } = useSession()
  const { getItemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const itemCount = getItemCount()

  const menuItems = [
    { href: '/account', label: 'Tableau de bord', icon: Home },
    { href: '/account/orders', label: 'Mes Commandes', icon: Package },
    { href: '/account/invoices', label: 'Mes Factures', icon: FileText },
    { href: '/account/profile', label: 'Mon Profil', icon: User },
    { href: '/account/addresses', label: 'Adresses', icon: MapPin },
    { href: '/account/wishlist', label: 'Ma Wishlist', icon: Heart },
    { href: '/account/payments', label: 'Paiements', icon: CreditCard },
    { href: '/account/loyalty', label: 'Points Fidélité', icon: Gift },
    { href: '/account/notifications', label: 'Notifications', icon: Bell },
    { href: '/account/reviews', label: 'Mes Avis', icon: Star },
    { href: '/account/settings', label: 'Paramètres', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/account') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-800">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-800">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/home-page-horizontal-logo-cechemoi-white.png"
              alt="CÈCHÉMOI"
              width={180}
              height={40}
              style={{ height: '40px', width: 'auto' }}
              className="dark:brightness-100 brightness-0"
              priority
            />
          </Link>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <User className="h-5 w-5 animate-pulse" />
              </div>
            ) : session ? (
              <>
                {/* User Name */}
                <div className="hidden md:flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <User className="h-5 w-5" />
                  <span className="text-sm">
                    {session.user?.name ? session.user.name.split(' ')[0] : 'Mon Compte'}
                  </span>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>

                {/* Back to Store */}
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Boutique</span>
                </Link>

                {/* Cart */}
                <Link href="/cart" className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : null}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block py-3 bg-gray-50 dark:bg-transparent -mx-4 px-4">
          <ul className="flex items-center space-x-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-dark-800">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
              <li className="pt-3 border-t border-gray-200 dark:border-dark-800">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-dark-800 rounded-lg transition-colors w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Déconnexion</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
