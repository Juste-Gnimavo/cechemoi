'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Plus, Settings as SettingsIcon, Eye } from 'lucide-react'
import type { UserRole } from '@prisma/client'
import { searchAdmin } from '@/lib/admin-search/search'

interface Props {
  open: boolean
  onClose: () => void
  role: UserRole
}

export function AdminSearch({ open, onClose, role }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  const results = useMemo(() => searchAdmin(query, role), [query, role])

  // Reset state + focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // Defer focus so the input is mounted
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  // Clamp activeIdx when results shrink
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(results.length - 1, 0)))
  }, [results.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (results.length === 0 ? 0 : Math.min(i + 1, results.length - 1)))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const target = results[activeIdx]
        if (target) {
          router.push(target.path)
          onClose()
        }
        return
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, results, activeIdx, router, onClose])

  // Scroll active item into view
  useEffect(() => {
    if (!open || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-result-item]')
    const el = items[activeIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx, open])

  if (!open) return null

  const handleSelect = (path: string) => {
    router.push(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label="Recherche admin">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex justify-center pt-16 px-4">
        <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-lg shadow-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          {/* Input row */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-dark-700 px-4">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une page, une action…"
              className="flex-1 px-2 py-4 bg-transparent text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                {query ? (
                  <>
                    Aucun résultat — essayez{' '}
                    <code className="px-1 bg-gray-100 dark:bg-dark-700 rounded">transactions</code>,{' '}
                    <code className="px-1 bg-gray-100 dark:bg-dark-700 rounded">facture</code>,{' '}
                    <code className="px-1 bg-gray-100 dark:bg-dark-700 rounded">dépense</code>…
                  </>
                ) : (
                  <>Tapez pour rechercher parmi toutes les pages admin</>
                )}
              </div>
            ) : (
              <ul ref={listRef}>
                {!query && (
                  <li className="px-4 pb-1 pt-1 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Suggestions
                  </li>
                )}
                {results.map((entry, i) => {
                  const Icon = entry.icon
                  const active = i === activeIdx
                  return (
                    <li
                      key={entry.path + i}
                      data-result-item
                      onClick={() => handleSelect(entry.path)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        active
                          ? 'bg-primary-50 dark:bg-dark-700'
                          : 'hover:bg-gray-50 dark:hover:bg-dark-700/50'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {entry.title}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate uppercase tracking-wider">
                            {entry.section}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {entry.description}
                        </div>
                      </div>
                      {entry.action === 'create' && (
                        <Plus className="h-4 w-4 text-green-500 flex-shrink-0" aria-label="Créer" />
                      )}
                      {entry.action === 'configure' && (
                        <SettingsIcon className="h-4 w-4 text-gray-400 flex-shrink-0" aria-label="Configurer" />
                      )}
                      {entry.action === 'view' && (
                        <Eye className="h-4 w-4 text-gray-400 flex-shrink-0" aria-label="Voir" />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer with shortcut hints */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-200 dark:border-dark-700 px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 border border-gray-300 dark:border-dark-600 rounded font-mono">↑↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 border border-gray-300 dark:border-dark-600 rounded font-mono">↵</kbd>
                ouvrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 border border-gray-300 dark:border-dark-600 rounded font-mono">esc</kbd>
                fermer
              </span>
            </span>
            <span>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
