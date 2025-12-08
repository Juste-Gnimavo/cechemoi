'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Truck,
  BarChart3,
  Star,
  LogOut,
  Menu,
  X,
  Store,
  Boxes,
  Shield,
  Sun,
  Moon
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/store/theme'

export function ManagerHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/admin/products', label: 'Produits', icon: Package },
    { href: '/admin/inventory', label: 'Inventaire', icon: Boxes },
    { href: '/admin/customers', label: 'Clients', icon: Users },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/shipping', label: 'Livraison', icon: Truck },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/reviews', label: 'Avis', icon: Star },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
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
          <Link href="/admin" className="flex items-center">
            <Image
              src="/logo/home-page-horizontal-logo-cechemoi-white.png"
              alt="CÈCHÉMOI"
              width={180}
              height={40}
              className="h-10 w-auto dark:brightness-100 brightness-0"
              priority
            />
          </Link>

          {/* Manager Badge & Actions */}
          <div className="flex items-center space-x-4">
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

            {/* Manager Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/30">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Manager</span>
            </div>

            {/* User Name */}
            {session?.user?.name && (
              <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                {session.user.name.split(' ')[0]}
              </span>
            )}

            {/* Tableau de bord */}
            <Link
              href="/admin"
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </Link>

                {/* Back to Store */}
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Boutique</span>
                </Link>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>

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
                        ? 'bg-blue-500/20 text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-800'
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
                          ? 'bg-primary-500/20 text-primary-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800'
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
