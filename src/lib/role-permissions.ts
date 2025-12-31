import { UserRole } from '@prisma/client'

export type Permission =
  | 'dashboard'
  | 'customers' | 'customers.create' | 'customers.contact'
  | 'appointments' | 'appointments.manage' | 'appointments.availability'
  | 'custom-orders' | 'production' | 'materials'
  | 'invoices' | 'invoices.create' | 'receipts' | 'sales'
  | 'orders' | 'orders.create'
  | 'products' | 'categories' | 'inventory' | 'coupons' | 'media'
  | 'campaigns' | 'notifications' | 'blog'
  | 'team' | 'settings'
  | 'marketing' | 'analytics'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[] | '*'> = {
  CUSTOMER: [],
  ADMIN: '*', // Tous les accès
  MANAGER: '*', // Tous les accès
  STAFF: [
    'dashboard',
    'customers', 'customers.create', 'customers.contact',
    'appointments', 'appointments.manage', 'appointments.availability',
    'custom-orders', 'production', 'materials',
    'invoices', 'invoices.create', 'receipts', 'sales',
    'orders', 'orders.create',
    'products', 'categories', 'inventory',
    'campaigns', 'notifications',
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
