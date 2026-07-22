'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin-header'
import { AdminBottomBar } from '@/components/admin-bottom-bar'
import { OwnerHeader } from '@/components/owner/owner-header'
import { useLoginTracking } from '@/hooks/useLoginTracking'

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

  // Track login info (IP, browser)
  useLoginTracking()

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
        {children}
      </main>
      {shell === 'full' && <AdminBottomBar />}
    </div>
  )
}
