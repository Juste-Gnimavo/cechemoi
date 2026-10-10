'use client'

import { useSession } from 'next-auth/react'
import type { UserRole } from '@prisma/client'
import { hasPermission, type Permission } from '@/lib/role-permissions'

/**
 * Vrai si le rôle de la session courante porte `permission`. Sert à masquer
 * un bouton que le serveur refuserait : l'API reste la seule garde, ce hook
 * n'évite que le clic suivi d'un 403.
 */
export function useCan(permission: Permission): boolean {
  const { data: session } = useSession()
  const role = (session?.user as { role?: UserRole } | undefined)?.role
  return role ? hasPermission(role, permission) : false
}

/**
 * Vrai si la session courante est un ADMIN. Uniquement pour suivre une route
 * qui teste encore `role === 'ADMIN'` en dur au lieu d'une permission.
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession()
  return (session?.user as { role?: UserRole } | undefined)?.role === 'ADMIN'
}
