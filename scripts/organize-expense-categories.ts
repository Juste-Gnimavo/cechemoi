/**
 * Rangement des catégories de dépenses : renommages (fautes de casse,
 * accents), rattachements hiérarchiques et ordre d'affichage logique.
 *
 * Usage :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/organize-expense-categories.ts
 *
 * Idempotent : chaque opération est faite par nom ; une catégorie absente
 * (déjà renommée, supprimée) est signalée et sautée. Relançable sans risque.
 *
 * Ordre proposé (sortOrder par dizaines pour intercaler plus tard) :
 *   Charges fixes    → Loyer (10), Électricité (20), Eau (30)
 *   Communication    → Communication (40) [Wifi facture, Crédit d'appel],
 *                      Canal+/TV (50)
 *   Personnel        → Salaires (60) [couturiers, assistante, fille de ménage]
 *   Production       → ACHATS PAGNES ET TISSUS (70) [5 sous-catégories],
 *                      Matériels de confection (80)
 *   Logistique       → Transport (90) [achat matériel], Livraison (100)
 *                      [CAMARA, yango]
 *   Entretien/bureau → Hygiène/Nettoyage (110), Fournitures bureau (120)
 *   En attente de décision propriétaire → Perleuses (130-140),
 *                      CHEZ BRODY'S (150)
 *   Divers           → Autres (990)
 *
 * NON traité volontairement (décision métier de la propriétaire) :
 *   - Perleuse Rosette / Perleuse Marie chantale → Salaires ou Prestataires ?
 *   - CHEZ BRODY'S → achat de tissus ? à rattacher à ACHATS PAGNES ET TISSUS ?
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// [ancien nom, nouveau nom]
const RENAMES: [string, string][] = [
  ['Electricite (CIE)', 'Électricité (CIE)'],
  ['Hygiene/Nettoyage', 'Hygiène/Nettoyage'],
  ['Materiels de confection', 'Matériels de confection'],
  ['TRANSPORT', 'Transport'],
  ['LVRAISON', 'Livraison'],
]

// [sous-catégorie, catégorie principale] — noms APRÈS renommage
const REPARENT: [string, string][] = [
  ['Wifi facture', 'Communication'],
  ["Crédit d'appel,souscription", 'Communication'],
]

// nom → sortOrder — noms APRÈS renommage
const SORT_ORDERS: Record<string, number> = {
  Loyer: 10,
  'Électricité (CIE)': 20,
  'Eau (SODECI)': 30,
  Communication: 40,
  'Wifi facture': 41,
  "Crédit d'appel,souscription": 42,
  'Canal+/TV': 50,
  Salaires: 60,
  'Salaires des couturiers': 61,
  'Salaire Assistant(e)': 62,
  'Salaire fille de ménage': 63,
  'ACHATS PAGNES ET TISSUS': 70,
  'ACHAT DE PAGNES TRADITIONNELS IVOIRIENS': 71,
  'ACHAT DE TISSUS CHEZ MOUSSA ÉLÉGANCE': 72,
  'ACHAT DE TISSUS CHEZ CESAR': 73,
  'ACHAT DE TISSUS CHEZ AMADOU LE MALO': 74,
  'ACHAT DE TISSUS': 75,
  'Matériels de confection': 80,
  Transport: 90,
  'Transport pour achat matériel': 91,
  Livraison: 100,
  'Livraison par CAMARA': 101,
  'Livraison par yango': 102,
  'Hygiène/Nettoyage': 110,
  'Fournitures bureau': 120,
  'Perleuse Rosette': 130,
  'Perleuse Marie chantale': 140,
  "CHEZ BRODY'S": 150,
  Autres: 990,
}

async function main() {
  // 1. Renommages
  for (const [from, to] of RENAMES) {
    const source = await prisma.expenseCategory.findUnique({ where: { name: from } })
    if (!source) {
      console.log(`— Renommage « ${from} » : introuvable (déjà fait ?), sauté`)
      continue
    }
    const clash = await prisma.expenseCategory.findUnique({ where: { name: to } })
    if (clash) {
      console.warn(
        `⚠ Renommage « ${from} » → « ${to} » : la cible existe déjà. ` +
          `Fusionner d'abord avec scripts/merge-expense-category.ts`
      )
      continue
    }
    await prisma.expenseCategory.update({ where: { name: from }, data: { name: to } })
    console.log(`✓ Renommé « ${from} » → « ${to} »`)
  }

  // 2. Rattachements
  for (const [childName, parentName] of REPARENT) {
    const [child, parent] = await Promise.all([
      prisma.expenseCategory.findUnique({
        where: { name: childName },
        include: { _count: { select: { children: true } } },
      }),
      prisma.expenseCategory.findUnique({ where: { name: parentName } }),
    ])
    if (!child || !parent) {
      console.warn(`⚠ Rattachement « ${childName} » → « ${parentName} » : catégorie introuvable, sauté`)
      continue
    }
    if (child._count.children > 0) {
      console.warn(`⚠ « ${childName} » a des sous-catégories, rattachement impossible (1 niveau max)`)
      continue
    }
    if (parent.parentId) {
      console.warn(`⚠ « ${parentName} » est une sous-catégorie, ne peut pas être parent`)
      continue
    }
    if (child.parentId === parent.id) {
      console.log(`— « ${childName} » déjà sous « ${parentName} »`)
      continue
    }
    await prisma.expenseCategory.update({
      where: { id: child.id },
      data: { parentId: parent.id },
    })
    console.log(`✓ « ${childName} » rattaché à « ${parentName} »`)
  }

  // 3. Ordre d'affichage
  for (const [name, sortOrder] of Object.entries(SORT_ORDERS)) {
    const result = await prisma.expenseCategory.updateMany({
      where: { name },
      data: { sortOrder },
    })
    if (result.count === 0) {
      console.warn(`⚠ Ordre « ${name} » : catégorie introuvable, sautée`)
    }
  }
  console.log('✓ Ordres d\'affichage appliqués')

  // 4. Catégories hors plan (à ranger manuellement ou à signaler)
  const known = new Set(Object.keys(SORT_ORDERS))
  const all = await prisma.expenseCategory.findMany({ select: { name: true } })
  const unknown = all.map((c) => c.name).filter((n) => !known.has(n))
  if (unknown.length > 0) {
    console.log(`\nCatégories hors du plan de rangement (inchangées) :`)
    for (const n of unknown) console.log(`  - ${n}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
