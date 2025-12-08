'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Register page - Redirects to phone OTP registration
 * CÈCHÉMOI uses OTP-only authentication (no password required)
 */
export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/register-phone')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
      <div className="text-gray-900 dark:text-white text-lg">Redirection...</div>
    </div>
  )
}
