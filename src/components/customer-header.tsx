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
  Moon,
  CalendarDays
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
    { href: '/account/appointments', label: 'Mes Rendez-vous', icon: CalendarDays },
    { href: '/account/invoices', label: 'Mes Factures', icon: FileText },
    { href: '/account/profile', label: 'Mon Profil', icon: User },
    { href: '/account/addresses', label: 'Adresses', icon: MapPin },
    { href: '/account/wishlist', label: 'Mes Favoris', icon: Heart },
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
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 shadow-sm">
      <div className="overflow-visible">
        {/* Top Bar - Colorful background */}
        <div className="bg-gradient-to-r from-copper-600 via-copper-500 to-copper-600 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              {/* Logo with outline */}
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo/web/logo-cechemoi-transparent-dark-mode.png"
                  alt="CÈCHÉMOI"
                  width={180}
                  height={40}
                  style={{
                    height: '55px',
                    width: 'auto',
                    filter: theme === 'dark' ? 'none' : `
                      drop-shadow(1px 0 0 white)
                      drop-shadow(-1px 0 0 white)
                      drop-shadow(0 1px 0 white)
                      drop-shadow(0 -1px 0 white)
                    `
                  }}
                  priority
                />
              </Link>

              {/* User Info & Actions */}
              <div className="flex items-center space-x-3">
                {status === 'loading' ? (
                  <div className="flex items-center space-x-2 text-white/60">
                    <User className="h-5 w-5 animate-pulse" />
                  </div>
                ) : session ? (
                  <>
                    {/* User Badge */}
                    <div className="hidden md:flex items-center space-x-2 bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                      <User className="h-4 w-4 text-white" />
                      <span className="text-sm font-medium text-white">
                        {session.user?.name ? session.user.name.split(' ')[0] : 'Mon Compte'}
                      </span>
                    </div>

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
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
                      className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Store className="h-4 w-4" />
                      <span className="hidden sm:inline">Boutique</span>
                    </Link>

                    {/* Cart */}
                    <Link
                      href="/cart"
                      className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-white text-copper-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Link>

                    {/* Logout */}
                    <button
                      onClick={() => signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      title="Déconnexion"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </>
                ) : null}

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block bg-gray-50 dark:bg-dark-800/50 border-t border-gray-100 dark:border-dark-700">
          <div className="container mx-auto px-4">
            <nav className="py-2">
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
                            ? 'bg-copper-500 text-white font-medium shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
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
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-900">
            <div className="container mx-auto px-4">
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
                            ? 'bg-copper-500 text-white font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
                <li className="pt-3 border-t border-gray-200 dark:border-dark-700">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-dark-800 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
