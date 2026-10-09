import type { UserRole } from '@prisma/client'
import { ROLE_PERMISSIONS, hasPermission, type Permission } from '@/lib/role-permissions'

// =====================================================================
// Droit requis pour afficher un écran /admin ou /owner.
//
// Les routes API restent la vraie frontière de sécurité ; cette table évite
// qu'un rôle restreint (gestionnaire boutique, couturier) ouvre par l'URL un
// écran dont toutes les données lui seraient refusées, et sert de filtre
// commun à la barre de navigation, à la palette de recherche et aux layouts.
//
// Chaque droit reprend celui de la route API de lecture de l'écran. Le
// préfixe le plus long l'emporte. Un chemin /admin ou /owner absent de la
// table est REFUSÉ aux rôles à liste explicite : une nouvelle section doit
// être déclarée ici pour leur devenir visible.
// =====================================================================

const ROUTE_PERMISSIONS: Record<string, Permission> = {
  // Accueil
  '/admin': 'dashboard',
  '/admin/account': 'account',

  // Boutique en ligne
  '/admin/orders': 'orders',
  '/admin/orders/new': 'orders.create',
  '/admin/products': 'products',
  '/admin/products/new': 'products.manage',
  '/admin/categories': 'categories',
  '/admin/categories/new': 'categories.manage',
  '/admin/inventory': 'inventory',
  '/admin/inventory/adjust': 'inventory.adjust',
  '/admin/coupons': 'coupons',
  '/admin/coupons/new': 'coupons.manage',
  '/admin/media': 'media',
  '/admin/reviews': 'reviews.moderate',
  '/admin/storefront': 'storefront',

  // Clients et rendez-vous (les étiquettes sont celles des fiches clients)
  '/admin/customers': 'customers',
  '/admin/tags': 'customers',
  '/admin/appointments': 'appointments',
  '/admin/appointments/availability': 'appointments.availability',

  // Atelier (la liste des couturiers se lit avec `production`)
  '/admin/custom-orders': 'custom-orders',
  '/admin/production': 'production',
  '/admin/tailors': 'production',
  '/admin/materials': 'materials',

  // Facturation et argent
  '/admin/invoices': 'invoices',
  '/admin/receipts': 'receipts',
  '/admin/expenses': 'finance.expenses.create',
  '/admin/sales': 'sales',
  '/admin/transactions': 'finance.revenue',
  '/admin/reports': 'reports.financial',
  '/admin/analytics': 'analytics',
  '/admin/staff-performance': 'analytics',

  // Communication
  '/admin/campaigns': 'campaigns',
  '/admin/notifications': 'notifications',
  '/admin/blog': 'blog',
  '/admin/marketing': 'marketing',

  // Administration
  '/admin/team': 'team.view',
  '/admin/settings': 'settings',
  '/admin/shipping': 'shipping',
  '/admin/tax': 'tax',

  // Hubs propriétaire (mêmes droits que les tuiles de l'accueil)
  '/owner/clients': 'customers',
  '/owner/commandes': 'custom-orders',
  '/owner/boutique': 'orders',
  '/owner/stock': 'materials',
  '/owner/caisse': 'finance.expenses.create',
  '/owner/rapports': 'reports.financial',
  '/owner/personnel': 'team',
  '/owner/messages': 'campaigns',
}

const PREFIXES = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length)

/**
 * Droit requis pour un chemin (query string ignorée), `null` si le chemin
 * est hors /admin et /owner ou s'il s'agit de l'accueil tuiles /owner, ouvert
 * à tout compte d'équipe. `undefined` = chemin /admin ou /owner non déclaré.
 */
export function getRoutePermission(path: string): Permission | null | undefined {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/'
  if (clean === '/owner') return null
  if (!clean.startsWith('/admin') && !clean.startsWith('/owner')) return null
  if (clean === '/admin') return ROUTE_PERMISSIONS['/admin']
  const prefix = PREFIXES.find(
    (p) => p !== '/admin' && (clean === p || clean.startsWith(`${p}/`))
  )
  return prefix ? ROUTE_PERMISSIONS[prefix] : undefined
}

export function canAccessPath(role: UserRole | undefined, path: string): boolean {
  if (!role || role === 'CUSTOMER') return false
  if (ROLE_PERMISSIONS[role] === '*') return true
  const permission = getRoutePermission(path)
  if (permission === null) return true
  if (permission === undefined) return false
  return hasPermission(role, permission)
}
