'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { AddToCartModal } from '@/components/add-to-cart-modal'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <ThemeProvider>
        {children}
        <AddToCartModal />
      </ThemeProvider>
    </SessionProvider>
  )
}
