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
  Megaphone,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  UserPlus,
  Bell,
  Boxes,
  UserCog,
  Send,
  FileText,
  TrendingUp,
  FolderTree,
  Tag,
  Calculator,
  FileBarChart,
  ChevronDown,
  MessageSquare,
  Eye,
  Plus,
  Mail,
  Newspaper,
  BadgeInfo,
  Sun,
  Moon
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/store/theme'

// Types for menu structure
interface SubMenuItem {
  href: string
  label: string
  badge?: string
}

interface MenuItem {
  href?: string
  label: string
  icon: any
  items?: SubMenuItem[]
}

export function AdminHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { theme, toggleTheme } = useTheme()

  // Menu structure with dropdowns
  const menuItems: MenuItem[] = [
    {
      href: '/admin',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      label: 'Campagnes',
      icon: Send,
      items: [
        { href: '/admin/campaigns', label: 'Tableau de bord' },
        { href: '/admin/campaigns/sms', label: 'SMS' },
        { href: '/admin/campaigns/whatsapp', label: 'WhatsApp Business' },
        { href: '/admin/campaigns/whatsapp-cloud', label: 'WhatsApp Cloud' },
        { href: '/admin/campaigns/push', label: 'Notifications Push', badge: 'NEW' },
        { href: '/admin/campaigns/reports', label: 'Rapports' },
      ],
    },
    {
      label: 'Clients',
      icon: Users,
      items: [
        { href: '/admin/customers', label: 'Voir/Chercher des clients' },
        { href: '/admin/customers/new', label: 'Ajouter un nouveau client', badge: 'NEW' },
        { href: '/admin/customers/send-sms', label: 'Envoyez un SMS à un client' },
        { href: '/admin/customers/send-whatsapp', label: 'Envoyez un message WhatsApp' },
        { href: '/admin/reviews', label: 'Voir Avis clients' },
      ],
    },
    {
      label: 'Commandes',
      icon: ShoppingBag,
      items: [
        { href: '/admin/orders', label: 'Voir toutes les commandes' },
        { href: '/admin/orders?status=pending', label: 'Voir Commandes en attente' },
        { href: '/admin/orders?status=active', label: 'Voir Commandes actives' },
        { href: '/admin/orders?status=cancelled', label: 'Voir Commandes annulées' },
        { href: '/admin/orders/new', label: 'Créer une nouvelle commande', badge: 'NEW' },
      ],
    },
    {
      label: 'Facturation',
      icon: FileText,
      items: [
        { href: '/admin/invoices', label: 'Voir toutes les Factures' },
{ href: '/admin/invoices/new', label: 'Créer Nouvelle Facture', badge: 'NEW' },
        { href: '/admin/invoices?status=paid', label: 'Factures Payées' },
        { href: '/admin/invoices?status=draft', label: 'Factures Brouillon' },
        { href: '/admin/invoices?status=unpaid', label: 'Factures Non payées' },
        { href: '/admin/invoices?status=cancelled', label: 'Factures Annulées' },
        { href: '/admin/invoices?status=refunded', label: 'Factures Remboursées' },
        { href: '/admin/invoices/standalone-payments', label: 'Paiements autonomes', badge: 'NEW' },
        { href: '/admin/invoices/transactions', label: 'Voir toutes les transactions' },
      ],
    },
    {
      label: 'Ventes',
      icon: TrendingUp,
      items: [
        { href: '/admin/sales', label: 'Voir toutes les ventes', badge: 'NEW' },
        { href: '/admin/sales/today', label: "Ventes d'aujourd'hui" },
        { href: '/admin/sales/week', label: 'Ventes de la semaine' },
        { href: '/admin/sales/month', label: 'Vente du mois' },
        { href: '/admin/sales/year', label: "Vente de l'année" },
      ],
    },

    {
      label: 'Blog',
      icon: Newspaper,
      items: [
        { href: '/admin/blog', label: 'Tableau de bord' },
        { href: '/admin/blog/posts', label: 'Tous les articles' },
        { href: '/admin/blog/posts/new', label: 'Nouvel article', badge: 'NEW' },
        { href: '/admin/blog/categories', label: 'Catégories' },
        { href: '/admin/blog/tags', label: 'Étiquettes' },
      ],
    },
    {
      label: 'Catalogue Produits',
      icon: Package,
      items: [
        { href: '/admin/products', label: 'Tous les produits' },
        { href: '/admin/products/new', label: 'Ajouter un nouveau produit' },
        { href: '/admin/categories', label: 'Gestion des catégories' },
        { href: '/admin/categories/new', label: 'Ajouter une nouvelle catégorie' },
        { href: '/admin/tags', label: 'Gestions des étiquettes (tags)' },
        { href: '/admin/inventory', label: 'Gestion de stock Inventaire' },
        { href: '/admin/coupons', label: 'Gestion des coupons' },
                { href: '/admin/media', label: 'Gestion des images' },

      ],
    },
    {
      label: 'Notifications',
      icon: BadgeInfo,
      items: [
        { href: '/admin/notifications', label: 'Tableau de bord' },
        { href: '/admin/notifications/logs', label: 'Logs des notifications' },
        { href: '/admin/notifications/templates', label: 'Templates de notifications' },
                { href: '/admin/notifications/follow-up', label: 'Messages de Relance' },
        { href: '/admin/notifications/settings', label: 'Paramètres de notification' },
      ],
    },
    {
      label: 'Paramètres',
      icon: Settings,
      items: [
        { href: '/admin/settings', label: 'Configuration de la boutique' },
        { href: '/admin/shipping', label: 'Gestion des Livraisons' },
        { href: '/admin/coupons', label: 'Gestion des coupons' },
        { href: '/admin/team', label: 'Gestion des utilisateurs' },
      ],
    },
  ]

  const isActive = (href?: string, items?: SubMenuItem[]) => {
    if (!href && items) {
      // For dropdown menus, check if any submenu item is active
      return items.some(item => {
        const cleanPath = item.href.split('?')[0]
        return pathname?.startsWith(cleanPath)
      })
    }
    if (href === '/admin') {
      return pathname === href
    }
    if (href) {
      const cleanPath = href.split('?')[0]
      return pathname?.startsWith(cleanPath)
    }
    return false
  }

  const handleDropdownToggle = (label: string) => {
    if (openDropdown === label) {
      setOpenDropdown(null)
      setDropdownPosition(null)
    } else {
      const button = buttonRefs.current[label]
      if (button) {
        const rect = button.getBoundingClientRect()
        // Use viewport-relative coordinates for fixed positioning (no scroll offset needed)
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left
        })
      }
      setOpenDropdown(label)
    }
  }

  const handleDropdownHover = (label: string, isEntering: boolean) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (isEntering) {
      const button = buttonRefs.current[label]
      if (button) {
        const rect = button.getBoundingClientRect()
        // Use viewport-relative coordinates for fixed positioning (no scroll offset needed)
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left
        })
      }
      setOpenDropdown(label)
    } else {
      // Delay closing to allow mouse to move to dropdown
      closeTimeoutRef.current = setTimeout(() => {
        setOpenDropdown(null)
        setDropdownPosition(null)
      }, 150) // 150ms delay
    }
  }

  const keepDropdownOpen = () => {
    // Clear timeout when mouse enters dropdown
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const closeDropdown = () => {
    // Close dropdown when mouse leaves dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
      setDropdownPosition(null)
    }, 100)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-[9999] bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-800 overflow-visible">
      <div className="container mx-auto px-4 overflow-visible">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-800">
          {/* Logo */}
          <Link href="/admin" className="flex items-center">
            <Image
              src="/logo/home-page-horizontal-logo-vin-cave-express-abidjan-white.png"
              alt="Cave Express"
              width={180}
              height={40}
              style={{ height: '40px', width: 'auto' }}
              className="dark:brightness-100 brightness-0"
              priority
            />
          </Link>

          {/* Admin Badge & Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Links */}
            <Link
              href="/admin/marketing"
              className={`hidden lg:flex items-center space-x-1 text-sm transition-colors ${
                pathname?.startsWith('/admin/marketing')
                  ? 'text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Megaphone className="h-4 w-4" />
              <span>Marketing</span>
            </Link>

            <Link
              href="/admin/analytics"
              className={`hidden lg:flex items-center space-x-1 text-sm transition-colors ${
                pathname?.startsWith('/admin/analytics')
                  ? 'text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>

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


            {/* Admin Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-primary-500/20 px-3 py-1.5 rounded-full border border-primary-500/30">
              <UserCog className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-medium text-primary-400">Administrateur</span>
            </div>

            {/* User Name */}
            {session?.user?.name && (
              <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                {session.user.name.split(' ')[0]}
              </span>
            )}

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
              onClick={() => signOut({ callbackUrl: '/' })}
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
        <nav className="hidden md:block py-3 overflow-visible bg-gray-50 dark:bg-transparent -mx-4 px-4">
          <ul className="flex items-center space-x-1 overflow-x-auto" style={{ overflowY: 'visible' }}>
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href, item.items)
              const hasDropdown = item.items && item.items.length > 0

              return (
                <li
                  key={item.label + index}
                  className="relative"
                  onMouseEnter={() => hasDropdown && handleDropdownHover(item.label, true)}
                  onMouseLeave={() => hasDropdown && handleDropdownHover(item.label, false)}
                >
                  {item.href ? (
                    // Single link (no dropdown)
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-primary-500/20 text-primary-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ) : (
                    // Dropdown trigger
                    <>
                      <button
                        ref={(el) => { buttonRefs.current[item.label] = el }}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-primary-500/20 text-primary-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-800'
                        }`}
                        onClick={() => handleDropdownToggle(item.label)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Dropdown Menus (Fixed Positioned) */}
        {openDropdown && dropdownPosition && (
          <>
            {menuItems
              .filter(item => item.label === openDropdown && item.items)
              .map((item) => (
                <div
                  key={item.label}
                  className="fixed w-72 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl py-2 z-[10000]"
                  style={{
                    top: `${dropdownPosition.top + 4}px`,
                    left: `${dropdownPosition.left}px`
                  }}
                  onMouseEnter={keepDropdownOpen}
                  onMouseLeave={closeDropdown}
                >
                  {item.items!.map((subItem, subIndex) => (
                    <Link
                      key={subItem.href + subIndex}
                      href={subItem.href}
                      onClick={() => {
                        // Clear any timeouts and close immediately
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current)
                          closeTimeoutRef.current = null
                        }
                        setOpenDropdown(null)
                        setDropdownPosition(null)
                      }}
                      className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                        pathname === subItem.href.split('?')[0] || pathname === subItem.href
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{subItem.label}</span>
                      {subItem.badge && (
                        <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
          </>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-dark-800">
            <ul className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href, item.items)
                const isExpanded = openMobileSection === item.label

                return (
                  <li key={item.label + index}>
                    {item.href ? (
                      // Single link (no dropdown)
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
                    ) : (
                      // Expandable section
                      <div>
                        <button
                          onClick={() =>
                            setOpenMobileSection(isExpanded ? null : item.label)
                          }
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                            active
                              ? 'bg-primary-500/20 text-primary-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Submenu items */}
                        {isExpanded && item.items && (
                          <ul className="mt-2 ml-4 space-y-1 border-l-2 border-gray-300 dark:border-dark-700 pl-4">
                            {item.items.map((subItem, subIndex) => (
                              <li key={subItem.href + subIndex}>
                                <Link
                                  href={subItem.href}
                                  onClick={() => {
                                    setIsMenuOpen(false)
                                    setOpenMobileSection(null)
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded transition-colors text-sm ${
                                    pathname === subItem.href.split('?')[0] ||
                                    pathname === subItem.href
                                      ? 'bg-primary-500/20 text-primary-400 font-medium'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800'
                                  }`}
                                >
                                  <span>{subItem.label}</span>
                                  {subItem.badge && (
                                    <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
              <li className="pt-3 border-t border-gray-200 dark:border-dark-800">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut({ callbackUrl: '/' })
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
