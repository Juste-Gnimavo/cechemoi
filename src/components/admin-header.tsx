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
  Moon,
  CalendarDays,
  Scissors,
  UsersRound,
  Wallet
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useTheme } from '@/store/theme'
import { UserRole } from '@prisma/client'
import { getRoleBadgeLabel } from '@/lib/role-permissions'

// Types for menu structure (3 levels support)
type AllowedRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'TAILOR'

interface SubMenuItem {
  href: string
  label: string
  badge?: string
  allowedRoles?: AllowedRole[]
}

interface MenuGroup {
  label: string
  items: SubMenuItem[]
  allowedRoles?: AllowedRole[]
}

interface MenuItem {
  href?: string
  label: string
  icon: any
  items?: SubMenuItem[]   // For simple dropdowns (2 levels)
  groups?: MenuGroup[]    // For grouped dropdowns (3 levels)
  allowedRoles?: AllowedRole[]
}

// Filter menu items based on user role
function filterMenuByRole(items: MenuItem[], role: UserRole): MenuItem[] {
  if (role === 'ADMIN' || role === 'MANAGER') {
    return items // Full access
  }

  return items
    .filter(item => {
      // If no allowedRoles specified, assume admin-only
      if (!item.allowedRoles) return false
      return item.allowedRoles.includes(role as AllowedRole)
    })
    .map(item => {
      // Filter groups if present
      if (item.groups) {
        const filteredGroups = item.groups
          .filter(group => {
            if (!group.allowedRoles) return true // If no role specified, include
            return group.allowedRoles.includes(role as AllowedRole)
          })
          .map(group => ({
            ...group,
            items: group.items.filter(subItem => {
              if (!subItem.allowedRoles) return true
              return subItem.allowedRoles.includes(role as AllowedRole)
            })
          }))
          .filter(group => group.items.length > 0)

        return { ...item, groups: filteredGroups }
      }

      // Filter items if present
      if (item.items) {
        const filteredItems = item.items.filter(subItem => {
          if (!subItem.allowedRoles) return true
          return subItem.allowedRoles.includes(role as AllowedRole)
        })
        return { ...item, items: filteredItems }
      }

      return item
    })
    .filter(item => {
      // Remove items with empty groups or items
      if (item.groups && item.groups.length === 0) return false
      if (item.items && item.items.length === 0) return false
      return true
    })
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

  // Get user role from session
  const userRole = ((session?.user as any)?.role as UserRole) || 'CUSTOMER'
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER'

  // Menu structure with dropdowns - Reorganized into 6 main menus with groups
  const allMenuItems: MenuItem[] = [
    // 1. TABLEAU DE BORD - Lien direct (tous les rôles admin)
    {
      href: '/admin',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
    },

    // 2. CLIENTS - Gestion + Contact (ADMIN, MANAGER, STAFF)
    {
      label: 'Clients',
      icon: Users,
      allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
      groups: [
        {
          label: 'Gestion des clients',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/customers', label: 'Voir/Chercher des clients' },
            { href: '/admin/customers/new', label: 'Ajouter un nouveau client', badge: 'NEW' },
            { href: '/admin/customers/import', label: 'Importer / Exporter' },
            { href: '/admin/customers/sources', label: 'Sources d\'acquisition', allowedRoles: ['ADMIN'] },
          ],
        },
        {
          label: 'Contacter les clients',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/customers/send-sms', label: 'Envoyez un SMS à un client' },
            { href: '/admin/customers/send-whatsapp', label: 'Envoyez un message WhatsApp' },
          ],
        },
      ],
    },

    // 3. RENDEZ-VOUS - Standalone menu (ADMIN et MANAGER uniquement)
    {
      label: 'Rendez-vous',
      icon: CalendarDays,
      allowedRoles: ['ADMIN', 'MANAGER'],
      items: [
        { href: '/admin/appointments', label: 'Tableau de bord' },
        { href: '/admin/appointments/list', label: 'Tous les rendez-vous' },
        { href: '/admin/appointments?status=pending', label: 'En attente', badge: 'NEW' },
        { href: '/admin/appointments?status=confirmed', label: 'Confirmés' },
        { href: '/admin/appointments?status=completed', label: 'Terminés' },
        { href: '/admin/appointments/availability', label: 'Définir disponibilités', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { href: '/admin/appointments/services', label: 'Types de consultation', allowedRoles: ['ADMIN', 'MANAGER'] },
      ],
    },

    // 4. SUR-MESURE - Commandes personnalisées, production et stock atelier
    {
      label: 'Sur-Mesure',
      icon: Scissors,
      allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
      groups: [
        {
          label: 'Commandes',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
          items: [
            { href: '/admin/custom-orders', label: 'Toutes les commandes' },
            { href: '/admin/custom-orders/new', label: 'Nouvelle commande', badge: 'NEW', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
            { href: '/admin/custom-orders/audit', label: 'Audit & Statistiques', allowedRoles: ['ADMIN'] },
            { href: '/admin/production', label: 'Suivi Production' },
          ],
        },
        {
          label: 'Stock Atelier',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/materials', label: 'Matériels' },
            { href: '/admin/materials/out', label: 'Enregistrer sortie', badge: 'NEW' },
            { href: '/admin/materials/in', label: 'Enregistrer entrée' },
            { href: '/admin/materials/movements', label: 'Historique' },
            { href: '/admin/materials/reports', label: 'Rapports' },
            { href: '/admin/materials/categories', label: 'Catégories' },
          ],
        },
      ],
    },

    // 5. CAISSE - Factures + Reçus + Ventes + Dépenses (ADMIN, MANAGER, STAFF)
    {
      label: 'Caisse',
      icon: TrendingUp,
      allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
      groups: [
        {
          label: 'Factures',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/invoices', label: 'Toutes les factures' },
            { href: '/admin/invoices/new', label: 'Créer une facture', badge: 'NEW' },
            { href: '/admin/invoices?status=paid', label: 'Factures payées' },
            { href: '/admin/invoices?status=draft', label: 'Factures brouillon' },
            { href: '/admin/invoices?status=unpaid', label: 'Factures non payées' },
            { href: '/admin/invoices?status=cancelled', label: 'Factures annulées' },
            { href: '/admin/invoices?status=refunded', label: 'Factures remboursées' },
            { href: '/admin/invoices/standalone-payments', label: 'Paiements autonomes', badge: 'NEW' },
          ],
        },
        {
          label: 'Reçus',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/receipts', label: 'Tous les reçus' },
            { href: '/admin/receipts?today=true', label: "Reçus d'aujourd'hui" },
          ],
        },
        {
          label: 'Ventes',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/sales', label: 'Toutes les ventes', badge: 'NEW' },
            { href: '/admin/sales/today', label: "Ventes d'aujourd'hui" },
            { href: '/admin/sales/week', label: 'Ventes de la semaine' },
            { href: '/admin/sales/month', label: 'Ventes du mois' },
            { href: '/admin/sales/year', label: "Ventes de l'année" },
          ],
        },
        {
          label: 'Dépenses',
          allowedRoles: ['ADMIN', 'MANAGER'],
          items: [
                      { href: '/admin/expenses/categories', label: 'Catégories' },
            { href: '/admin/expenses', label: 'Toutes les dépenses' },
            { href: '/admin/expenses/new', label: 'Ajouter une dépense', badge: 'NEW' },
            { href: '/admin/transactions', label: 'Transactions' },
          ],
        },
      ],
    },

    // 6. BOUTIQUE - Commandes + Catalogue + Stock + Médias
    {
      label: 'Boutique',
      icon: Package,
      allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
      groups: [
        {
          label: 'Commandes',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/orders', label: 'Voir toutes les commandes' },
            { href: '/admin/orders?status=pending', label: 'Commandes en attente' },
            { href: '/admin/orders?status=active', label: 'Commandes actives' },
            { href: '/admin/orders?status=cancelled', label: 'Commandes annulées' },
            { href: '/admin/orders/new', label: 'Créer une commande', badge: 'NEW' },
          ],
        },
        {
          label: 'Produits',
          allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
          items: [
            { href: '/admin/products', label: 'Tous les produits' },
            { href: '/admin/products/new', label: 'Ajouter un produit' },
            { href: '/admin/categories', label: 'Gestion des catégories' },
            { href: '/admin/categories/new', label: 'Ajouter une catégorie' },
            { href: '/admin/tags', label: 'Gestion des étiquettes' },
          ],
        },
        {
          label: 'Stock et Prix',
          allowedRoles: ['ADMIN', 'MANAGER'],
          items: [
            { href: '/admin/inventory', label: 'Gestion du stock' },
            { href: '/admin/coupons', label: 'Codes promo' },
          ],
        },
        {
          label: 'Médias',
          allowedRoles: ['ADMIN', 'MANAGER'],
          items: [
            { href: '/admin/media', label: 'Galerie d\'images' },
          ],
        },
      ],
    },

    // 7. COMMUNICATION - Campagnes + Notifications + Blog
    {
      label: 'Communication',
      icon: Send,
      allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
      groups: [
        {
          label: 'Campagnes',
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
          label: 'Notifications',
          items: [
            { href: '/admin/notifications', label: 'Tableau de bord' },
            { href: '/admin/notifications/logs', label: 'Logs' },
            { href: '/admin/notifications/templates', label: 'Modèles de message' },
            { href: '/admin/notifications/follow-up', label: 'Messages de relance' },
            { href: '/admin/notifications/settings', label: 'Paramètres' },
          ],
        },
        {
          label: 'Blog',
          items: [
            { href: '/admin/blog', label: 'Tableau de bord' },
            { href: '/admin/blog/posts', label: 'Tous les articles' },
            { href: '/admin/blog/posts/new', label: 'Nouvel article', badge: 'NEW' },
            { href: '/admin/blog/categories', label: 'Catégories' },
            { href: '/admin/blog/tags', label: 'Étiquettes' },
          ],
        },
      ],
    },

    // 8. ÉQUIPE - Gestion du personnel (ADMIN, MANAGER seulement)
    {
      label: 'Équipe',
      icon: UsersRound,
      allowedRoles: ['ADMIN', 'MANAGER'],
      items: [
        { href: '/admin/team', label: 'Gestion du staff' },
        { href: '/admin/tailors', label: 'Gestion des couturiers' },
        { href: '/admin/staff-performance', label: 'Performance équipe' },
      ],
    },

    // 9. RÉGLAGES - Paramètres boutique (ADMIN, MANAGER seulement)
    {
      label: 'Réglages',
      icon: Settings,
      allowedRoles: ['ADMIN', 'MANAGER'],
      items: [
        { href: '/admin/settings', label: 'Configuration de la boutique' },
        { href: '/admin/shipping', label: 'Gestion des livraisons' },
        { href: '/admin/coupons', label: 'Gestion des coupons' },
      ],
    },
  ]

  // Filter menu based on user role
  const menuItems = useMemo(() => {
    return filterMenuByRole(allMenuItems, userRole)
  }, [userRole])

  const isActive = (href?: string, items?: SubMenuItem[], groups?: MenuGroup[]) => {
    // For grouped menus (3 levels)
    if (!href && groups) {
      return groups.some(group =>
        group.items.some(item => {
          const cleanPath = item.href.split('?')[0]
          return pathname?.startsWith(cleanPath)
        })
      )
    }
    // For simple dropdown menus (2 levels)
    if (!href && items) {
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
    <header className="sticky top-0 z-[9999] bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 overflow-visible shadow-sm">
      <div className="overflow-visible">
        {/* Top Bar - Colorful background */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              {/* Logo with white outline */}
              <Link href="/admin" className="flex items-center">
                <Image
                  src="/logo/web/logo-cechemoi-transparent-dark-mode.png"
                  alt="CÈCHÉMOI"
                  width={220}
                  height={60}
                  style={{
                    height: '60px',
                    width: 'auto',
                    filter: theme === 'dark' ? 'none' : `
                      drop-shadow(1px 0 0 white)

                    `
                  }}
                  priority
                />
              </Link>

              {/* Admin Badge & Actions */}
              <div className="flex items-center space-x-3">
                {/* Quick Links - Only for ADMIN/MANAGER */}
                {isAdminOrManager && (
                  <>
                    <Link
                      href="/admin/marketing"
                      className={`hidden lg:flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        pathname?.startsWith('/admin/marketing')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Megaphone className="h-4 w-4" />
                      <span>Marketing</span>
                    </Link>

                    <Link
                      href="/admin/analytics"
                      className={`hidden lg:flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        pathname?.startsWith('/admin/analytics')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </Link>

                    {/* Separator */}
                    <div className="hidden lg:block w-px h-6 bg-white/30" />
                  </>
                )}

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

                {/* Role Badge - Dynamic based on user role */}
                <div className="hidden md:flex items-center space-x-2 bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                  <UserCog className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">{getRoleBadgeLabel(userRole)}</span>
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
                  onClick={() => signOut({ callbackUrl: '/' })}
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
            <nav className="py-2 overflow-visible">
              <ul className="flex items-center space-x-1" style={{ overflowY: 'visible' }}>
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href, item.items, item.groups)
              const hasDropdown = (item.items && item.items.length > 0) || (item.groups && item.groups.length > 0)

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
                          ? 'bg-primary-500 text-white font-medium shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
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
                            ? 'bg-primary-500 text-white font-medium shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
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
          </div>
        </div>

        {/* Dropdown Menus (Fixed Positioned) */}
        {openDropdown && dropdownPosition && (
          <>
            {menuItems
              .filter(item => item.label === openDropdown && (item.items || item.groups))
              .map((item) => (
                <div
                  key={item.label}
                  className="fixed w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl py-2 z-[10000] max-h-[80vh] overflow-y-auto"
                  style={{
                    top: `${dropdownPosition.top + 4}px`,
                    left: `${dropdownPosition.left}px`
                  }}
                  onMouseEnter={keepDropdownOpen}
                  onMouseLeave={closeDropdown}
                >
                  {/* Render grouped items (3 levels) */}
                  {item.groups && item.groups.map((group, groupIndex) => (
                    <div key={group.label + groupIndex}>
                      {groupIndex > 0 && (
                        <div className="border-t border-gray-200 dark:border-dark-700 my-2" />
                      )}
                      <div className="px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((subItem, subIndex) => (
                        <Link
                          key={subItem.href + subIndex}
                          href={subItem.href}
                          onClick={() => {
                            if (closeTimeoutRef.current) {
                              clearTimeout(closeTimeoutRef.current)
                              closeTimeoutRef.current = null
                            }
                            setOpenDropdown(null)
                            setDropdownPosition(null)
                          }}
                          className={`flex items-center justify-between px-4 py-2 transition-colors ${
                            pathname === subItem.href.split('?')[0] || pathname === subItem.href
                              ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400'
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

                  {/* Render simple items (2 levels) */}
                  {item.items && !item.groups && item.items.map((subItem, subIndex) => (
                    <Link
                      key={subItem.href + subIndex}
                      href={subItem.href}
                      onClick={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current)
                          closeTimeoutRef.current = null
                        }
                        setOpenDropdown(null)
                        setDropdownPosition(null)
                      }}
                      className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                        pathname === subItem.href.split('?')[0] || pathname === subItem.href
                          ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400'
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
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-900">
            <div className="container mx-auto px-4">
              <ul className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  const active = isActive(item.href, item.items, item.groups)
                  const isExpanded = openMobileSection === item.label
                  const hasSubmenu = (item.items && item.items.length > 0) || (item.groups && item.groups.length > 0)

                  return (
                    <li key={item.label + index}>
                      {item.href ? (
                        // Single link (no dropdown)
                        <Link
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            active
                              ? 'bg-primary-500 text-white font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      ) : hasSubmenu ? (
                        // Expandable section
                        <div>
                          <button
                            onClick={() =>
                              setOpenMobileSection(isExpanded ? null : item.label)
                            }
                            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                              active
                                ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
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

                          {/* Grouped submenu items (3 levels) */}
                          {isExpanded && item.groups && (
                            <div className="mt-2 ml-4 border-l-2 border-primary-200 dark:border-dark-600 pl-4 space-y-4">
                              {item.groups.map((group, groupIndex) => (
                                <div key={group.label + groupIndex}>
                                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400 px-3 py-1">
                                    {group.label}
                                  </div>
                                  <ul className="space-y-1">
                                    {group.items.map((subItem, subIndex) => (
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
                                              ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 font-medium'
                                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
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
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Simple submenu items (2 levels) */}
                          {isExpanded && item.items && !item.groups && (
                            <ul className="mt-2 ml-4 space-y-1 border-l-2 border-primary-200 dark:border-dark-600 pl-4">
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
                                        ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
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
                      ) : null}
                    </li>
                  )
                })}
                <li className="pt-3 border-t border-gray-200 dark:border-dark-700">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut({ callbackUrl: '/' })
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
