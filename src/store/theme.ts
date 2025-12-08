'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        set({ theme })
        // Update document class
        if (typeof window !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark')
          document.documentElement.classList.add(theme)
        }
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },
    }),
    {
      name: 'cave-express-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state && typeof window !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark')
          document.documentElement.classList.add(state.theme)
        }
      },
    }
  )
)
