'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { countries, type Country, defaultCountry } from '@/lib/countries'

interface CountrySelectorProps {
  value: Country
  onChange: (country: Country) => void
  className?: string
}

export function CountrySelector({ value, onChange, className = '' }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.dialCode.includes(search) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (country: Country) => {
    onChange(country)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-3 bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="text-xl">{value.flag}</span>
        <span className="text-sm font-medium">{value.dialCode}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-lg shadow-2xl border border-gray-200 dark:border-dark-700 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-dark-700">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                autoFocus
              />
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto flex-1">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-left ${
                    value.code === country.code ? 'bg-gray-100 dark:bg-dark-700' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 dark:text-white text-sm font-medium truncate">
                      {country.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{country.code}</div>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm font-mono">
                    {country.dialCode}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
