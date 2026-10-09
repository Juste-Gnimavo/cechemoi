import { UserRole } from '@prisma/client'

export type Permission =
  | 'dashboard'
  // Son propre compte : profil, mot de passe, double authentification.
  // Distinct de `dashboard`, qui ouvre le tableau de bord et ses cumuls.
  | 'account'
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
  | 'products' | 'products.manage' | 'products.delete'
  | 'categories' | 'categories.manage' | 'categories.delete'
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
    'dashboard', 'account',
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
    'dashboard', 'account',
    'appointments',
    'custom-orders', 'production',
  ],
  // Gestionnaire boutique en ligne (décisions CEO du 09/10/2026) : le hub
  // /owner/boutique et ses sous-écrans, rien d'autre. Ni tableau de bord
  // (cumuls d'argent), ni clientes (la vente au comptoir passe par une
  // recherche dédiée gardée par `orders.create`), ni atelier, caisse,
  // rapports, équipe ou messages. Aucune suppression définitive.
  ECOMMERCE: [
    'account',
    'orders', 'orders.create',
    // Suppressions du catalogue autorisées (CEO, 09/10/2026) : les routes
    // refusent déjà un produit commandé ou une catégorie non vide.
    'products', 'products.manage', 'products.delete',
    'categories', 'categories.manage', 'categories.delete',
    'inventory', 'inventory.adjust',
    'coupons', 'coupons.manage',
    'media', 'media.delete', 'reviews.moderate', 'reviews.delete',
    'storefront', 'storefront.manage', 'storefront.delete',
  ],
}

/**
 * Rôles d'équipe à identifiants email + mot de passe, gérés depuis
 * /admin/team. Les couturiers (TAILOR) ont leur propre écran et leur propre
 * connexion ; les clientes n'en font jamais partie. Utiliser cette constante
 * partout où l'on filtrait sur `['ADMIN', 'MANAGER', 'STAFF']` en dur : un
 * rôle oublié dans l'une de ces listes, c'est une connexion impossible.
 */
export type TeamRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'ECOMMERCE'
export const TEAM_ROLES: TeamRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'ECOMMERCE']

export function isTeamRole(role: string | null | undefined): role is TeamRole {
  return !!role && (TEAM_ROLES as string[]).includes(role)
}

/** Rôles proposés dans le sélecteur de /admin/team, dans l'ordre d'affichage. */
export const TEAM_ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: 'STAFF', label: 'Personnel' },
  { value: 'ECOMMERCE', label: 'Gestionnaire boutique en ligne' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Administrateur' },
]

/**
 * Accueil propre à un rôle, lorsqu'il n'est pas l'accueil tuiles (/owner).
 * Le gestionnaire boutique arrive directement sur son hub (décision CEO).
 */
export function getRoleHome(role: UserRole | undefined): string | null {
  return role === 'ECOMMERCE' ? '/owner/boutique' : null
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
    ECOMMERCE: 'Gestionnaire boutique en ligne',
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
    ECOMMERCE: 'bg-amber-500/15 text-amber-600',
  }
  return colors[role] || 'bg-gray-500/15 text-gray-500'
}

// Check if user can access admin panel at all
export function canAccessAdmin(role: UserRole): boolean {
  return role !== 'CUSTOMER'
}
