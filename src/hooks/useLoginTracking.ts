'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

export function useLoginTracking() {
  const { data: session, status } = useSession()
  const hasTracked = useRef(false)

  useEffect(() => {
    // Only track once per session and when authenticated
    if (status === 'authenticated' && session?.user && !hasTracked.current) {
      hasTracked.current = true

      // Track login info (IP, browser) - fire and forget
      fetch('/api/auth/track-login', {
        method: 'POST',
      }).catch(err => {
        console.error('Error tracking login:', err)
      })
    }
  }, [status, session])
}
