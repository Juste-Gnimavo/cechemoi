'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { AdminHeader } from '@/components/admin-header'
import { AdminBottomBar } from '@/components/admin-bottom-bar'
import { OwnerHeader } from '@/components/owner/owner-header'
import { useLoginTracking } from '@/hooks/useLoginTracking'
import { AccessDenied } from '@/components/admin/access-denied'
import { getRoleHome } from '@/lib/role-permissions'
import { canAccessPath } from '@/lib/route-permissions'

// shell 'owner' = accès via crm.cechemoi.com : header minimal, pas de
// barre d'actions rapides. shell 'full' = admin classique inchangé.
export function AdminLayoutClient({
  shell,
  children,
}: {
  shell: 'owner' | 'full'
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname() || '/admin'
  const role = (session?.user as { role?: UserRole } | undefined)?.role
  const roleHome = getRoleHome(role)
  // Sur gestion.cechemoi.com, /customers est réécrit vers /admin/customers :
  // on raisonne toujours sur le chemin /admin réel.
  const adminPath = pathname.startsWith('/admin')
    ? pathname
    : `/admin${pathname === '/' ? '' : pathname}`

  // Track login info (IP, browser)
  useLoginTracking()

  // Un rôle qui a son propre accueil (gestionnaire boutique) n'a pas de
  // tableau de bord : /admin le renvoie directement chez lui.
  useEffect(() => {
    if (roleHome && adminPath === '/admin') router.replace(roleHome)
  }, [roleHome, adminPath, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Chargement...</div>
      </div>
    )
  }

  if (!session || (session.user as any)?.role === 'CUSTOMER') {
    router.push('/auth/admin')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {shell === 'owner' ? <OwnerHeader /> : <AdminHeader />}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {roleHome && adminPath === '/admin' ? null : canAccessPath(role, adminPath) ? (
          children
        ) : (
          <AccessDenied homeHref={roleHome ?? (shell === 'owner' ? '/' : '/admin')} />
        )}
      </main>
      {shell === 'full' && <AdminBottomBar />}
    </div>
  )
}
