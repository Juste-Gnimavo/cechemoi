import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurrencyCode = 'XOF' | 'EUR'

interface CurrencyState {
  currency: CurrencyCode
  exchangeRate: number // 1 EUR = X XOF
  isLoading: boolean
  setCurrency: (currency: CurrencyCode) => void
  toggleCurrency: () => void
  fetchExchangeRate: () => Promise<void>
  convertPrice: (priceInXof: number) => number
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'XOF',
      exchangeRate: 680, // Default rate
      isLoading: false,

      setCurrency: (currency) => {
        set({ currency })
      },

      toggleCurrency: () => {
        set((state) => ({
          currency: state.currency === 'XOF' ? 'EUR' : 'XOF',
        }))
      },

      fetchExchangeRate: async () => {
        try {
          set({ isLoading: true })
          const response = await fetch('/api/exchange-rate')
          const data = await response.json()
          if (data.success && data.data?.eurToXofRate) {
            set({ exchangeRate: data.data.eurToXofRate })
          }
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error)
          // Keep default rate on error
        } finally {
          set({ isLoading: false })
        }
      },

      convertPrice: (priceInXof: number) => {
        const { currency, exchangeRate } = get()
        if (currency === 'EUR') {
          // Convert XOF to EUR, round to 2 decimals
          return Math.round((priceInXof / exchangeRate) * 100) / 100
        }
        return priceInXof
      },
    }),
    {
      name: 'cechemoi-currency',
      partialize: (state) => ({
        currency: state.currency,
        exchangeRate: state.exchangeRate,
      }),
    }
  )
)

// Helper to get currency symbol
export function getCurrencySymbol(currency: CurrencyCode): string {
  return currency === 'EUR' ? '€' : 'CFA'
}
