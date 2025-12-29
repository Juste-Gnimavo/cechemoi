'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  Store,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/store/theme'

export function StaffHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/admin/products', label: 'Produits', icon: Package },
    { href: '/admin/customers', label: 'Clients', icon: Users },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 shadow-sm">
      <div className="overflow-visible">
        {/* Top Bar - Green gradient for Staff */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-700 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              {/* Logo with outline */}
              <Link href="/admin" className="flex items-center">
                <Image
                  src="/logo/web/logo-cechemoi-transparent-dark-mode.png"
                  alt="CÈCHÉMOI"
                  width={180}
                  height={70}
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

              {/* Staff Badge & Actions */}
              <div className="flex items-center space-x-3">
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

                {/* Staff Badge */}
                <div className="hidden md:flex items-center space-x-2 bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                  <Briefcase className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">Staff</span>
                </div>

                {/* User Name */}
                {session?.user?.name && (
                  <span className="hidden sm:inline text-sm text-white/90">
                    {session.user.name.split(' ')[0]}
                  </span>
                )}

                {/* Back to Store */}
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Boutique</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })}
                  className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>

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
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                          active
                            ? 'bg-green-500 text-white font-medium shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
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
                            ? 'bg-green-500 text-white font-medium'
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
