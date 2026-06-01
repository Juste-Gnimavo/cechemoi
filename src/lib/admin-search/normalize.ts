/**
 * Lowercase + strip diacritics. Lets a CEO typing "depense" match "Dépense".
 */
export function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Normalize and split on non-alphanumeric. Apostrophes, slashes, query separators all become delimiters.
 */
export function tokens(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0)
}
