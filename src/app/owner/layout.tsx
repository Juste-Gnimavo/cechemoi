'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { OwnerHeader } from '@/components/owner/owner-header'
import { useLoginTracking } from '@/hooks/useLoginTracking'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useLoginTracking()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Chargement...</div>
      </div>
    )
  }

  if (!session || (session.user as any)?.role === 'CUSTOMER') {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <OwnerHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
