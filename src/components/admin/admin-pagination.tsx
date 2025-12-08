'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  itemName?: string
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100],
  itemName = 'items',
}: AdminPaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Info text */}
      <div className="flex items-center gap-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Affichage de <span className="font-medium text-gray-900 dark:text-white">{startItem}</span> à{' '}
          <span className="font-medium text-gray-900 dark:text-white">{endItem}</span> sur{' '}
          <span className="font-medium text-gray-900 dark:text-white">{totalItems.toLocaleString()}</span> {itemName}
        </p>

        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-primary-500 text-white'
                : page === '...'
                ? 'bg-transparent text-gray-500 cursor-default'
                : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
