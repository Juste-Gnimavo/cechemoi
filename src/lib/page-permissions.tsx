import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { hasPermission, type Permission } from '@/lib/role-permissions'
import type { UserRole } from '@prisma/client'

/**
 * Garde de page pour les sections réservées à la direction.
 *
 * Les routes API sont la vraie frontière de sécurité ; ce garde évite
 * simplement d'afficher au Personnel des écrans vides ou en erreur sur des
 * pages auxquelles il n'a pas droit.
 */
export async function requirePagePermission(permission: Permission) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: UserRole } | undefined)?.role

  if (!role) {
    redirect('/auth/signin')
  }

  if (!hasPermission(role, permission)) {
    redirect('/admin')
  }
}
