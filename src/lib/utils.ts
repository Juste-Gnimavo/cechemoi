import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price with currency
 * @param price - Price in XOF (base currency)
 * @param currency - Target currency ('XOF' or 'EUR')
 * @param exchangeRate - EUR to XOF rate (default: 680)
 */
export function formatPrice(
  price: number,
  currency: string = 'XOF',
  exchangeRate: number = 680
): string {
  let displayPrice = price
  let fractionDigits = 0

  // Convert if EUR
  if (currency === 'EUR') {
    displayPrice = Math.round((price / exchangeRate) * 100) / 100
    fractionDigits = 2
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(displayPrice)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function generateOrderNumber(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const random = Math.random().toString(36).substring(2, 7)
  return `${day}${month}${year}-${random}`.toUpperCase()
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Build product URL with category hierarchy for better SEO
 * Format: /produit/[mainCategory]/[subCategory]/[productSlug]
 * If no subcategory, format: /produit/[mainCategory]/[productSlug]
 * Fallback: /produit/[productSlug]
 */
/**
 * Get the base URL for the application
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise defaults to production URL
 * This ensures notifications and links work correctly in production
 */
export function getBaseUrl(): string {
  // In browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // On server, use env var or production default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://cave-express.ci'
}

export function buildProductUrl(
  productSlug: string,
  mainCategorySlug?: string | null,
  subCategorySlug?: string | null
): string {
  // If we have category information, use SEO-friendly format
  if (mainCategorySlug) {
    if (subCategorySlug) {
      return `/produit/${mainCategorySlug}/${subCategorySlug}/${productSlug}`
    }
    return `/produit/${mainCategorySlug}/${productSlug}`
  }

  // Fallback if no category info
  return `/produit/${productSlug}`
}
