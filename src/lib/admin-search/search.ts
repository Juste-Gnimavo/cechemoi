import type { UserRole } from '@prisma/client'
import { SEARCH_ENTRIES, DEFAULT_SUGGESTIONS, type AllowedRole, type SearchEntry } from './registry'
import { normalize, tokens } from './normalize'

export interface ScoredEntry extends SearchEntry {
  score: number
}

const MAX_RESULTS = 10

function canRoleAccess(entry: SearchEntry, role: UserRole): boolean {
  if (role === 'ADMIN' || role === 'MANAGER') return true
  if (role === 'CUSTOMER') return false
  return entry.allowedRoles.includes(role as AllowedRole)
}

// Pre-compute tokens / normalized fields for each entry once (module-level cache)
interface IndexedEntry {
  entry: SearchEntry
  titleTokens: string[]
  descTokens: string[]
  keywordTokens: string[]
  pathTokens: string[]
  titleNorm: string
}

const INDEX: IndexedEntry[] = SEARCH_ENTRIES.map((entry) => ({
  entry,
  titleTokens: tokens(entry.title),
  descTokens: tokens(entry.description),
  keywordTokens: entry.keywords.flatMap((k) => tokens(k)),
  pathTokens: tokens(entry.path),
  titleNorm: normalize(entry.title),
}))

function scoreOne(idx: IndexedEntry, queryTokens: string[], queryNorm: string): number {
  let score = 0
  let matchedTokens = 0

  // Whole-query exact-title match: heavy bonus
  if (idx.titleNorm === queryNorm) score += 20
  else if (idx.titleNorm.includes(queryNorm) && queryNorm.length >= 3) score += 8

  for (const qt of queryTokens) {
    let matched = false
    if (idx.titleTokens.includes(qt)) {
      score += 5
      matched = true
    } else if (idx.titleTokens.some((t) => t.startsWith(qt) && qt.length >= 3)) {
      score += 3
      matched = true
    }
    if (idx.keywordTokens.includes(qt)) {
      score += 4
      matched = true
    } else if (idx.keywordTokens.some((t) => t.startsWith(qt) && qt.length >= 4)) {
      score += 2
      matched = true
    }
    if (idx.descTokens.includes(qt)) {
      score += 2
      matched = true
    }
    if (idx.pathTokens.includes(qt)) {
      score += 1
      matched = true
    }
    if (matched) matchedTokens++
  }

  // Bonus when all query tokens matched somewhere
  if (queryTokens.length > 1 && matchedTokens === queryTokens.length) score += 5

  return matchedTokens === 0 ? 0 : score
}

export function searchAdmin(query: string, role: UserRole): ScoredEntry[] {
  const trimmed = query.trim()

  if (!trimmed) {
    // Default suggestions when input empty
    const suggestionPaths = new Set(DEFAULT_SUGGESTIONS)
    return INDEX.filter((idx) => suggestionPaths.has(idx.entry.path) && canRoleAccess(idx.entry, role))
      .map((idx) => ({ ...idx.entry, score: 0 }))
  }

  const queryNorm = normalize(trimmed)
  const queryTokens = tokens(trimmed)
  if (queryTokens.length === 0) return []

  // Stop-words (very common French words that should not narrow results on their own)
  const STOP = new Set(['de', 'la', 'le', 'les', 'des', 'du', 'un', 'une', 'a', 'au', 'aux', 'et', 'ou', 'en', 'comment', 'voir', 'pour'])
  const meaningfulTokens = queryTokens.filter((t) => !STOP.has(t))
  const effectiveTokens = meaningfulTokens.length > 0 ? meaningfulTokens : queryTokens

  const scored: ScoredEntry[] = []
  for (const idx of INDEX) {
    if (!canRoleAccess(idx.entry, role)) continue
    const score = scoreOne(idx, effectiveTokens, queryNorm)
    if (score > 0) scored.push({ ...idx.entry, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, MAX_RESULTS)
}
