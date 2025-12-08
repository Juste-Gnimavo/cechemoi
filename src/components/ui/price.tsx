'use client'

import { useCurrency } from '@/store/currency'
import { formatPrice } from '@/lib/utils'
import { useEffect } from 'react'

interface PriceProps {
  amount: number // Price in XOF
  className?: string
  showOriginal?: boolean // Show original XOF price when displaying EUR
}

/**
 * Price component that automatically converts based on user's currency preference
 * Usage: <Price amount={7800} />
 */
export function Price({ amount, className, showOriginal }: PriceProps) {
  const { currency, exchangeRate, fetchExchangeRate } = useCurrency()

  // Fetch exchange rate on mount (only once)
  useEffect(() => {
    fetchExchangeRate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formattedPrice = formatPrice(amount, currency, exchangeRate)

  if (showOriginal && currency === 'EUR') {
    return (
      <span className={className}>
        {formattedPrice}
        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
          ({formatPrice(amount, 'XOF')})
        </span>
      </span>
    )
  }

  return <span className={className}>{formattedPrice}</span>
}

/**
 * Hook to get formatted price with current currency settings
 * Usage: const price = useFormattedPrice(7800)
 */
export function useFormattedPrice(amount: number): string {
  const { currency, exchangeRate } = useCurrency()
  return formatPrice(amount, currency, exchangeRate)
}
