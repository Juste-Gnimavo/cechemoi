'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: Category[]
}

interface CategoryTreeSelectorProps {
  categories: Category[]
  categoryId: string
  categoryIds: string[]
  setCategoryId: (id: string) => void
  setCategoryIds: (ids: string[]) => void
}

function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function CategoryTreeSelector({
  categories,
  categoryId,
  categoryIds,
  setCategoryId,
  setCategoryIds,
}: CategoryTreeSelectorProps) {
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Build tree from flat list
  const { roots, childrenMap } = useMemo(() => {
    const cMap = new Map<string, Category[]>()
    const rList: Category[] = []

    for (const cat of categories) {
      if (!cat.parentId) {
        rList.push(cat)
      } else {
        const existing = cMap.get(cat.parentId) || []
        existing.push(cat)
        cMap.set(cat.parentId, existing)
      }
    }

    // Sort alphabetically
    rList.sort((a, b) => a.name.localeCompare(b.name))
    cMap.forEach((children) => children.sort((a, b) => a.name.localeCompare(b.name)))

    return { roots: rList, childrenMap: cMap }
  }, [categories])

  // Filtering by search
  const normalizedSearch = normalizeSearch(search)

  const matchesSearch = (cat: Category): boolean => {
    if (!normalizedSearch) return true
    if (normalizeSearch(cat.name).includes(normalizedSearch)) return true
    // Check if any child matches
    const children = childrenMap.get(cat.id) || []
    return children.some((child) => normalizeSearch(child.name).includes(normalizedSearch))
  }

  const childMatchesSearch = (cat: Category): boolean => {
    if (!normalizedSearch) return false
    return normalizeSearch(cat.name).includes(normalizedSearch)
  }

  // When searching, auto-expand parents that have matching children
  const visibleExpandedIds = useMemo(() => {
    if (!normalizedSearch) return expandedIds
    const autoExpanded = new Set(expandedIds)
    for (const root of roots) {
      const children = childrenMap.get(root.id) || []
      if (children.some((child) => normalizeSearch(child.name).includes(normalizedSearch))) {
        autoExpanded.add(root.id)
      }
    }
    return autoExpanded
  }, [normalizedSearch, expandedIds, roots, childrenMap])

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedIds(next)
  }

  const handleToggle = (catId: string, isChecked: boolean) => {
    if (isChecked) {
      if (!categoryId) {
        setCategoryId(catId)
      } else {
        setCategoryIds([...categoryIds, catId])
      }
    } else {
      if (categoryId === catId) {
        if (categoryIds.length > 0) {
          setCategoryId(categoryIds[0])
          setCategoryIds(categoryIds.slice(1))
        } else {
          setCategoryId('')
        }
      } else {
        setCategoryIds(categoryIds.filter((id) => id !== catId))
      }
    }
  }

  const isSelected = (catId: string) => categoryId === catId || categoryIds.includes(catId)
  const isPrimary = (catId: string) => categoryId === catId

  const selectedCount = (categoryId ? 1 : 0) + categoryIds.length

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une categorie..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
        />
      </div>

      {/* Selected count */}
      {selectedCount > 0 && (
        <p className="text-xs text-primary-500 mb-2 font-medium">
          {selectedCount} categorie{selectedCount > 1 ? 's' : ''} selectionnee{selectedCount > 1 ? 's' : ''}
        </p>
      )}

      {/* Tree */}
      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {roots.filter(matchesSearch).map((root) => {
          const children = (childrenMap.get(root.id) || []).filter(
            (child) => !normalizedSearch || childMatchesSearch(child)
          )
          const hasChildren = children.length > 0
          const isExpanded = visibleExpandedIds.has(root.id)

          return (
            <div key={root.id}>
              {/* Parent category */}
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected(root.id)
                    ? 'bg-primary-500/20 border border-primary-500/50'
                    : 'bg-gray-50 dark:bg-dark-800/30 border border-transparent hover:bg-gray-100 dark:hover:bg-dark-700/50'
                }`}
              >
                {/* Expand/collapse toggle */}
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleExpand(root.id)
                    }}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                ) : (
                  <span className="w-5" />
                )}

                {/* Folder icon */}
                {hasChildren && isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-primary-500 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                )}

                <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected(root.id)}
                    onChange={(e) => handleToggle(root.id, e.target.checked)}
                    className="w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500 shrink-0"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                    {root.name}
                  </span>
                  {isPrimary(root.id) && (
                    <span className="text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded shrink-0">
                      Principale
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({children.length})
                    </span>
                  )}
                </label>
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-dark-700 pl-3">
                  {children.map((child) => (
                    <label
                      key={child.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected(child.id)
                          ? 'bg-primary-500/15 border border-primary-500/40'
                          : 'border border-transparent hover:bg-gray-100 dark:hover:bg-dark-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(child.id)}
                        onChange={(e) => handleToggle(child.id, e.target.checked)}
                        className="w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500 shrink-0"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {child.name}
                      </span>
                      {isPrimary(child.id) && (
                        <span className="text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded shrink-0">
                          Principale
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {roots.filter(matchesSearch).length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune categorie trouvee
          </p>
        )}
      </div>
    </div>
  )
}
