'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { Home, LogOut, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '@/store/theme'
import { UserRole } from '@prisma/client'
import { AdminSearch } from '@/components/admin/admin-search'

// Header minimal du shell propriétaire (crm.cechemoi.com) :
// logo, accueil, recherche, thème, déconnexion. Rien d'autre.
export function OwnerHeader() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  const userRole = ((session?.user as any)?.role as UserRole) || 'CUSTOMER'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-[9999] bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/web/logo-cechemoi-transparent-dark-mode.png"
              alt="CÈCHÉMOI"
              width={220}
              height={60}
              className="h-10 sm:h-[52px] w-auto"
              style={{
                filter: theme === 'dark' ? 'none' : 'drop-shadow(1px 0 0 white)',
              }}
              priority
            />
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-sm px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors text-sm"
              title="Rechercher"
              aria-label="Ouvrir la recherche"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Rechercher…</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {session?.user?.name && (
              <span className="hidden sm:inline text-sm text-white/90">
                {session.user.name.split(' ')[0]}
              </span>
            )}

            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <AdminSearch open={searchOpen} onClose={closeSearch} role={userRole} />
    </header>
  )
}
