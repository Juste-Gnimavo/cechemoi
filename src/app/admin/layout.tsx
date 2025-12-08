'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin-header'
import { useLoginTracking } from '@/hooks/useLoginTracking'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
