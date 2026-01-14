'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Scissors,
  TrendingUp,
  Plus,
  X,
  UserPlus,
  FileText,
  Wallet,
  MessageSquare,
  Send,
  Package,
  PackagePlus,
  PackageMinus,
  Boxes
} from 'lucide-react'
import { UserRole } from '@prisma/client'

type AllowedRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'TAILOR'

interface QuickAction {
  href: string
  label: string
  icon: any
  allowedRoles: AllowedRole[]
}

const quickActions: QuickAction[] = [
  {
    href: '/admin/customers/new',
    label: 'Nouveau client',
    icon: UserPlus,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    href: '/admin/custom-orders/new',
    label: 'Commande sur-mesure',
    icon: Scissors,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    href: '/admin/invoices/new',
    label: 'Nouvelle facture',
    icon: FileText,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    href: '/admin/expenses/new',
    label: 'Nouvelle dépense',
    icon: Wallet,
    allowedRoles: ['ADMIN', 'MANAGER']
  },
  {
    href: '/admin/campaigns/sms',
    label: 'Nouveau SMS',
    icon: Send,
    allowedRoles: ['ADMIN', 'MANAGER']
  },
  {
    href: '/admin/campaigns/whatsapp',
    label: 'Nouveau WhatsApp',
    icon: MessageSquare,
    allowedRoles: ['ADMIN', 'MANAGER']
  },
  {
    href: '/admin/materials/out',
    label: 'Sortie matériel',
    icon: PackageMinus,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    href: '/admin/materials/in',
    label: 'Entrée matériel',
    icon: PackagePlus,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF']
  },
  {
    href: '/admin/materials',
    label: 'Stock matériels',
    icon: Boxes,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF']
  }
]

const navItems = [
  { href: '/admin', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/admin/customers', label: 'Clients', icon: Users, exact: false },
  { href: '/admin/custom-orders', label: 'Sur-Mesure', icon: Scissors, exact: false },
  { href: '/admin/invoices', label: 'Caisse', icon: TrendingUp, exact: false }
]

export function AdminBottomBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const userRole = ((session?.user as any)?.role as UserRole) || 'CUSTOMER'

  // Filter quick actions based on role
  const filteredActions = quickActions.filter(action => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') return true
    return action.allowedRoles.includes(userRole as AllowedRole)
  })

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname?.startsWith(href)
  }

  // Don't show for customers
  if (userRole === 'CUSTOMER') return null

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[9998] md:hidden">
        {/* Bar background */}
        <div className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            {/* First two nav items */}
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-colors ${
                    active
                      ? 'text-primary-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] mt-1 font-medium">{item.label}</span>
                </Link>
              )
            })}

            {/* FAB Spacer */}
            <div className="w-16" />

            {/* Last two nav items */}
            {navItems.slice(2).map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-colors ${
                    active
                      ? 'text-primary-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] mt-1 font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* FAB Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 transition-all active:scale-95"
          aria-label="Actions rapides"
        >
          <Plus className="h-7 w-7 text-white" />
        </button>
      </nav>

      {/* Quick Actions Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-800 rounded-t-3xl pb-[env(safe-area-inset-bottom)] animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-dark-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Actions rapides
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-3 gap-3 px-4 pb-6">
              {filteredActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setIsModalOpen(false)}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary-500/10 dark:bg-primary-500/20 rounded-full flex items-center justify-center mb-1.5">
                      <Icon className="h-5 w-5 text-primary-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
