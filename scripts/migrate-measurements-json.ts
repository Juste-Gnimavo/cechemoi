/**
 * Migration script to convert JSON measurement data to individual columns
 *
 * Run with: npx tsx scripts/migrate-measurements-json.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping of old JSON keys to new column names
const SLEEVE_MAPPING: Record<string, string> = {
  manchesCourtes: 'longueurManchesCourtes',
  courtes: 'longueurManchesCourtes',
  avantCoudes: 'longueurManchesAvantCoudes',
  niveau34: 'longueurManchesNiveau34',
  manchesLongues: 'longueurManchesLongues',
  longues: 'longueurManchesLongues',
}

const DRESS_MAPPING: Record<string, string> = {
  avantGenoux: 'longueurRobesAvantGenoux',
  niveauGenoux: 'longueurRobesNiveauGenoux',
  apresGenoux: 'longueurRobesApresGenoux',
  miMollets: 'longueurRobesMiMollets',
  chevilles: 'longueurRobesChevilles',
  tresLongue: 'longueurRobesTresLongue',
}

const SKIRT_MAPPING: Record<string, string> = {
  avantGenoux: 'longueurJupeAvantGenoux',
  niveauGenoux: 'longueurJupeNiveauGenoux',
  apresGenoux: 'longueurJupeApresGenoux',
  miMollets: 'longueurJupeMiMollets',
  chevilles: 'longueurJupeChevilles',
  tresLongue: 'longueurJupeTresLongue',
}

function tryParseJson(value: string | null): Record<string, string> | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed
    }
  } catch {
    // Not JSON, return null
  }
  return null
}

async function migrateData() {
  console.log('Starting measurement data migration...')

  const measurements = await prisma.customerMeasurement.findMany({
    select: {
      id: true,
      longueurManches: true,
      longueurRobes: true,
      longueurJupe: true,
    }
  })

  console.log(`Found ${measurements.length} measurement records`)

  let migratedCount = 0

  for (const m of measurements) {
    const updates: Record<string, string | null> = {}

    // Migrate sleeve lengths
    const sleeveJson = tryParseJson(m.longueurManches)
    if (sleeveJson) {
      for (const [jsonKey, value] of Object.entries(sleeveJson)) {
        const newColumn = SLEEVE_MAPPING[jsonKey]
        if (newColumn && value) {
          updates[newColumn] = String(value)
        }
      }
    }

    // Migrate dress lengths
    const dressJson = tryParseJson(m.longueurRobes)
    if (dressJson) {
      for (const [jsonKey, value] of Object.entries(dressJson)) {
        const newColumn = DRESS_MAPPING[jsonKey]
        if (newColumn && value) {
          updates[newColumn] = String(value)
        }
      }
    }

    // Migrate skirt lengths
    const skirtJson = tryParseJson(m.longueurJupe)
    if (skirtJson) {
      for (const [jsonKey, value] of Object.entries(skirtJson)) {
        const newColumn = SKIRT_MAPPING[jsonKey]
        if (newColumn && value) {
          updates[newColumn] = String(value)
        }
      }
    }

    // Update if we have any migrations to do
    if (Object.keys(updates).length > 0) {
      await prisma.customerMeasurement.update({
        where: { id: m.id },
        data: updates as any,
      })
      console.log(`Migrated record ${m.id}:`, updates)
      migratedCount++
    }
  }

  console.log(`\nMigration complete! ${migratedCount} records migrated.`)
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
