import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth-phone'
import { hasPermission, type Permission } from '@/lib/role-permissions'

export interface AdminSessionUser {
  id: string
  role: UserRole
  name?: string | null
  email?: string | null
}

/**
 * Garde d'accès pour les routes API d'administration.
 *
 * Source de vérité unique : `ROLE_PERMISSIONS` (`src/lib/role-permissions.ts`).
 * À utiliser à la place des tableaux de rôles codés en dur, afin que la matrice
 * de droits affichée dans l'interface corresponde réellement à ce que le
 * serveur autorise.
 *
 * Retourne soit l'utilisateur authentifié, soit la réponse d'erreur à renvoyer.
 */
export async function requirePermission(
  permission: Permission
): Promise<{ user: AdminSessionUser } | { error: NextResponse }> {
  const session = await getServerSession(authOptions)
  const user = session?.user as AdminSessionUser | undefined

  if (!user?.role) {
    return {
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  if (!hasPermission(user.role, permission)) {
    return {
      error: NextResponse.json(
        { error: "Vous n'avez pas les droits nécessaires pour cette action" },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Variante synchrone, à utiliser dans les routes qui ont déjà récupéré la session
 * et qui s'en servent plus loin (createdById, journalisation…).
 *
 * Retourne la réponse d'erreur à renvoyer, ou `null` si l'accès est autorisé.
 */
export function denyUnlessPermitted(
  session: { user?: unknown } | null,
  permission: Permission
): NextResponse | null {
  const user = session?.user as AdminSessionUser | undefined

  if (!user?.role) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!hasPermission(user.role, permission)) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits nécessaires pour cette action" },
      { status: 403 }
    )
  }

  return null
}

/** Raccourci de lecture, sans production de réponse. */
export function sessionCan(
  session: { user?: unknown } | null,
  permission: Permission
): boolean {
  const user = session?.user as AdminSessionUser | undefined
  return Boolean(user?.role) && hasPermission(user!.role, permission)
}

/** Réponse standard lorsqu'aucune session admin n'est présente. */
export function unauthenticated(): NextResponse {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
}
