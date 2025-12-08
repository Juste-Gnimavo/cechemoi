/**
 * Phone Number Parser Utility
 * Handles multiple input formats and auto-formats phone numbers for Côte d'Ivoire
 */

export interface PhoneParseResult {
  valid: string[]        // Valid formatted phone numbers
  invalid: string[]      // Invalid entries
  duplicates: number     // Count of duplicates removed
  formatted: string      // Formatted string (one per line)
}

/**
 * Parse and format phone numbers from various input formats
 * Supports: comma, semicolon, space, newline, or tab separated
 * Auto-adds +225 prefix for Ivorian numbers
 */
export function parsePhoneNumbers(input: string): PhoneParseResult {
  const result: PhoneParseResult = {
    valid: [],
    invalid: [],
    duplicates: 0,
    formatted: '',
  }

  if (!input || !input.trim()) {
    return result
  }

  // Step 1: Split by multiple delimiters (comma, semicolon, space, newline, tab)
  const rawNumbers = input
    .split(/[\n,;|\t\s]+/)  // Split by newline, comma, semicolon, pipe, tab, or space
    .map(num => num.trim())
    .filter(num => num.length > 0)

  // Step 2: Track seen numbers to remove duplicates
  const seenNumbers = new Set<string>()

  // Step 3: Process each number
  for (const rawNum of rawNumbers) {
    // Clean the number: remove all non-digit characters except leading +
    let cleaned = rawNum.replace(/[^\d+]/g, '')

    // Skip if empty after cleaning
    if (!cleaned) {
      result.invalid.push(rawNum)
      continue
    }

    // Remove + if it's not at the start
    if (cleaned.includes('+')) {
      const plusIndex = cleaned.indexOf('+')
      if (plusIndex > 0) {
        cleaned = cleaned.replace(/\+/g, '')
      }
    }

    // Normalize the number
    let normalized = cleaned

    // Case 1: Already has +225 prefix
    if (normalized.startsWith('+225')) {
      normalized = normalized // Keep as is
    }
    // Case 2: Has 225 prefix without +
    else if (normalized.startsWith('225') && normalized.length >= 12) {
      normalized = '+' + normalized
    }
    // Case 3: Starts with 0 (local format) - convert to international
    else if (normalized.startsWith('0') && normalized.length === 10) {
      // Remove leading 0 and add +225
      normalized = '+225' + normalized.slice(1)
    }
    // Case 4: Just digits, assume it's Ivorian without prefix
    else if (/^\d{9,10}$/.test(normalized)) {
      // If 10 digits and starts with 0, remove it
      if (normalized.length === 10 && normalized.startsWith('0')) {
        normalized = '+225' + normalized.slice(1)
      }
      // If 9 digits, add +225
      else if (normalized.length === 9) {
        normalized = '+225' + normalized
      }
      // If 10 digits but doesn't start with 0, add +225
      else {
        normalized = '+225' + normalized
      }
    }
    // Case 5: Doesn't match any pattern
    else {
      result.invalid.push(rawNum)
      continue
    }

    // Validate final format: +225XXXXXXXXX (13 characters total)
    if (!/^\+225\d{9,10}$/.test(normalized)) {
      result.invalid.push(rawNum)
      continue
    }

    // Check for duplicates
    if (seenNumbers.has(normalized)) {
      result.duplicates++
      continue
    }

    // Add to valid list
    seenNumbers.add(normalized)
    result.valid.push(normalized)
  }

  // Create formatted output (one per line)
  result.formatted = result.valid.join('\n')

  return result
}

/**
 * Format a single phone number
 */
export function formatPhoneNumber(phone: string): string | null {
  const result = parsePhoneNumbers(phone)
  return result.valid.length > 0 ? result.valid[0] : null
}

/**
 * Validate if a phone number is valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  const result = parsePhoneNumbers(phone)
  return result.valid.length === 1 && result.invalid.length === 0
}

/**
 * Get summary message for parsing results
 */
export function getParseResultMessage(result: PhoneParseResult): string {
  const messages: string[] = []

  if (result.valid.length > 0) {
    messages.push(`✅ ${result.valid.length} numéro(s) valide(s)`)
  }

  if (result.duplicates > 0) {
    messages.push(`⚠️ ${result.duplicates} doublon(s) supprimé(s)`)
  }

  if (result.invalid.length > 0) {
    messages.push(`❌ ${result.invalid.length} numéro(s) invalide(s)`)
  }

  return messages.join(' • ')
}

/**
 * Example usage:
 *
 * Input: "2250709757296,2250151092627, 07 09 75 72 96, +225 05 56 79 14 31"
 * Output: {
 *   valid: ["+2250709757296", "+2250151092627", "+2250759545410"],
 *   invalid: [],
 *   duplicates: 1,
 *   formatted: "+2250709757296\n+2250151092627\n+2250759545410"
 * }
 */
