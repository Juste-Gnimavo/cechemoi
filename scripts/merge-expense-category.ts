/**
 * Fusionne une catégorie de dépenses dans une autre, puis supprime la source.
 *
 * Usage :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/merge-expense-category.ts "<nom source>" "<nom cible>"
 *
 * Exemple (doublon de casse constaté en prod) :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/merge-expense-category.ts "LIVRAISON PAR CAMARA" "Livraison par CAMARA"
 *
 * Effets, dans une transaction :
 *   1. Toutes les dépenses de la source sont réaffectées à la cible.
 *   2. Les éventuelles sous-catégories de la source sont rattachées à la cible.
 *   3. La source est supprimée.
 *
 * Utilise DATABASE_URL de l'environnement — vérifier qu'il pointe sur la
 * bonne base avant de lancer.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [sourceName, targetName] = process.argv.slice(2)

  if (!sourceName || !targetName) {
    console.error('Usage: merge-expense-category.ts "<nom source>" "<nom cible>"')
    process.exit(1)
  }
  if (sourceName === targetName) {
    console.error('La source et la cible sont identiques.')
    process.exit(1)
  }

  const [source, target] = await Promise.all([
    prisma.expenseCategory.findUnique({
      where: { name: sourceName },
      include: { _count: { select: { expenses: true, children: true } } },
    }),
    prisma.expenseCategory.findUnique({ where: { name: targetName } }),
  ])

  if (!source) {
    console.error(`Catégorie source introuvable : « ${sourceName} »`)
    process.exit(1)
  }
  if (!target) {
    console.error(`Catégorie cible introuvable : « ${targetName} »`)
    process.exit(1)
  }
  if (source.id === target.parentId) {
    console.error('La cible est une sous-catégorie de la source : fusion inversée interdite.')
    process.exit(1)
  }

  console.log(
    `Fusion « ${source.name} » (${source._count.expenses} dépense(s), ` +
      `${source._count.children} sous-catégorie(s)) → « ${target.name} »`
  )

  const [movedExpenses, movedChildren] = await prisma.$transaction(async (tx) => {
    const expenses = await tx.expense.updateMany({
      where: { categoryId: source.id },
      data: { categoryId: target.id },
    })
    const children = await tx.expenseCategory.updateMany({
      where: { parentId: source.id },
      data: { parentId: target.id },
    })
    await tx.expenseCategory.delete({ where: { id: source.id } })
    return [expenses.count, children.count]
  })

  console.log(
    `Terminé : ${movedExpenses} dépense(s) réaffectée(s), ` +
      `${movedChildren} sous-catégorie(s) rattachée(s), source supprimée.`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
