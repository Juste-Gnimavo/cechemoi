'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { OwnerHeader } from '@/components/owner/owner-header'
import { useLoginTracking } from '@/hooks/useLoginTracking'
import { AccessDenied } from '@/components/admin/access-denied'
import { getRoleHome } from '@/lib/role-permissions'
import { canAccessPath } from '@/lib/route-permissions'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname() || '/owner'
  const role = (session?.user as { role?: UserRole } | undefined)?.role
  const roleHome = getRoleHome(role)
  // Sur gestion.cechemoi.com, / est réécrit vers /owner.
  const ownerPath = pathname === '/' ? '/owner' : pathname
  const isOwnerHome = ownerPath === '/owner'

  useLoginTracking()

  // Le gestionnaire boutique accède directement à son hub (décision CEO) :
  // l'accueil tuiles le renvoie vers /owner/boutique, qui n'y renvoie jamais.
  useEffect(() => {
    if (roleHome && isOwnerHome) router.replace(roleHome)
  }, [roleHome, isOwnerHome, router])

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
      <OwnerHeader />
      <main className="container mx-auto px-4 py-8">
        {roleHome && isOwnerHome ? null : canAccessPath(role, ownerPath) ? (
          children
        ) : (
          <AccessDenied homeHref={roleHome ?? '/'} />
        )}
      </main>
    </div>
  )
}
