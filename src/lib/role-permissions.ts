import { UserRole } from '@prisma/client'

export type Permission =
  | 'dashboard'
  // Clients
  | 'customers' | 'customers.create' | 'customers.contact' | 'customers.export' | 'customers.delete'
  // Rendez-vous
  | 'appointments' | 'appointments.manage' | 'appointments.availability'
  // Atelier
  | 'custom-orders' | 'custom-orders.delete' | 'production'
  | 'materials' | 'materials.manage' | 'materials.delete'
  // Facturation
  | 'invoices' | 'invoices.create' | 'invoices.edit' | 'invoices.payments' | 'invoices.delete'
  | 'receipts'
  // Commandes boutique
  | 'orders' | 'orders.create' | 'orders.refund'
  // Catalogue
  | 'products' | 'products.manage' | 'categories' | 'categories.manage'
  | 'inventory' | 'inventory.adjust'
  | 'coupons' | 'coupons.manage'
  | 'media' | 'media.delete' | 'reviews.moderate' | 'reviews.delete'
  // Vitrine : bandeau de l'accueil du site
  | 'storefront' | 'storefront.manage' | 'storefront.delete'
  // Communication
  | 'campaigns' | 'campaigns.manage' | 'campaigns.send'
  | 'notifications' | 'notifications.manage' | 'notifications.send'
  | 'blog' | 'blog.manage'
  // Argent — réservé à la direction (cf. règle CEO : le Personnel ne doit jamais
  // voir la trésorerie ni la masse salariale)
  | 'sales' | 'finance.revenue' | 'reports.financial' | 'analytics'
  // `finance.expenses` = vue complète des dépenses (tous auteurs, totaux, rapports).
  // `finance.expenses.create` = saisir une dépense et relire SES PROPRES saisies,
  // sans aucun cumul — le Personnel doit pouvoir enregistrer les achats du jour
  // sans connaître la charge globale ni les salaires.
  | 'finance.expenses' | 'finance.expenses.create'
  // Administration
  | 'team.view' | 'team' | 'settings' | 'tailors' | 'tax' | 'shipping' | 'marketing'

/**
 * Matrice de droits — source de vérité unique.
 *
 * Les routes API d'administration l'interrogent via `denyUnlessPermitted`
 * (`src/lib/api-permissions.ts`) ; les pages sensibles via
 * `requirePagePermission` (`src/lib/page-permissions.tsx`). Ne jamais
 * réintroduire de tableau de rôles codé en dur dans une route : l'écart entre
 * ce que l'interface montre et ce que le serveur autorise est exactement le
 * bug qui empêchait le Personnel de créer des factures.
 *
 * Limite connue : ADMIN et MANAGER ont tous deux '*', la matrice ne permet donc
 * pas de les distinguer. Les quelques routes réservées à l'administrateur seul
 * (création et modification de comptes d'équipe, suppression d'un tag produit,
 * sources d'acquisition client) conservent volontairement un test
 * `role !== 'ADMIN'` explicite.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[] | '*'> = {
  CUSTOMER: [],
  ADMIN: '*', // Tous les accès
  MANAGER: '*', // Tous les accès
  // Personnel : opérationnel complet, aucune visibilité sur l'argent en caisse,
  // aucune suppression définitive (analogie banque : on désactive, on ne supprime pas).
  STAFF: [
    'dashboard',
    'customers', 'customers.create', 'customers.contact', 'customers.export',
    'appointments', 'appointments.manage', 'appointments.availability',
    'custom-orders', 'production',
    'materials', 'materials.manage',
    'invoices', 'invoices.create', 'invoices.edit', 'invoices.payments', 'receipts',
    'orders', 'orders.create',
    'products', 'products.manage',
    'categories', 'categories.manage',
    'inventory', 'inventory.adjust',
    'campaigns', 'campaigns.manage', 'campaigns.send',
    'notifications', 'notifications.manage', 'notifications.send',
    'finance.expenses.create',
    'coupons', 'media', 'reviews.moderate', 'blog',
    'storefront', 'storefront.manage',
    'team.view',
  ],
  TAILOR: [
    'dashboard',
    'appointments',
    'custom-orders', 'production',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  if (perms === '*') return true
  return perms.includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function getRoleBadgeLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    CUSTOMER: 'Client',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    TAILOR: 'Couturier',
  }
  return labels[role] || role
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    CUSTOMER: 'bg-gray-500/15 text-gray-500',
    ADMIN: 'bg-red-500/15 text-red-500',
    MANAGER: 'bg-blue-500/15 text-blue-500',
    STAFF: 'bg-green-500/15 text-green-500',
    TAILOR: 'bg-purple-500/15 text-purple-500',
  }
  return colors[role] || 'bg-gray-500/15 text-gray-500'
}

// Check if user can access admin panel at all
export function canAccessAdmin(role: UserRole): boolean {
  return role !== 'CUSTOMER'
}
