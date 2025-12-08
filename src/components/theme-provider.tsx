'use client'

import { useEffect, ReactNode } from 'react'
import { useTheme } from '@/store/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  return <>{children}</>
}
