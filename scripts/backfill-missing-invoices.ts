/**
 * Recense et répare les commandes sur mesure sans facture (problème 07).
 *
 * Usage :
 *   # 1. Rapport seul (aucune écriture) :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-missing-invoices.ts
 *
 *   # 2. Génération des factures manquantes :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-missing-invoices.ts --apply
 *
 * Les acomptes déjà enregistrés sur la commande sont synchronisés sur la
 * facture créée. Les commandes annulées sont ignorées. Idempotent : une
 * commande qui a déjà une facture est laissée telle quelle.
 */
import { prisma } from '../src/lib/prisma'
import {
  createInvoiceFromCustomOrder,
  syncPaymentToInvoice,
} from '../src/lib/custom-order-invoice-sync'

async function main() {
  const apply = process.argv.includes('--apply')

  const orphans = await prisma.customOrder.findMany({
    where: {
      invoice: null,
      status: { not: 'CANCELLED' },
    },
    include: {
      customer: { select: { name: true } },
      payments: { select: { id: true } },
    },
    orderBy: { orderDate: 'asc' },
  })

  if (orphans.length === 0) {
    console.log('Aucune commande sans facture. Rien à faire.')
    return
  }

  console.log(`${orphans.length} commande(s) sans facture :\n`)
  for (const o of orphans) {
    console.log(
      `  ${o.orderNumber} — ${o.customer?.name || '—'} — ` +
        `${o.orderDate.toLocaleDateString('fr-FR')} — ${o.totalCost} CFA — ` +
        `${o.payments.length} paiement(s)`
    )
  }

  if (!apply) {
    console.log('\nMode rapport. Relancer avec --apply pour générer les factures.')
    return
  }

  console.log('\nGénération des factures…')
  let ok = 0
  let ko = 0
  for (const o of orphans) {
    try {
      await createInvoiceFromCustomOrder(o.id)
      // Synchroniser les acomptes existants sur la facture créée
      for (const p of o.payments) {
        try {
          await syncPaymentToInvoice(p.id, o.id)
        } catch (e) {
          console.warn(`  ⚠ ${o.orderNumber} : paiement ${p.id} non synchronisé (${(e as Error).message})`)
        }
      }
      ok++
      console.log(`  ✓ ${o.orderNumber}`)
    } catch (e) {
      ko++
      console.error(`  ✗ ${o.orderNumber} : ${(e as Error).message}`)
    }
  }
  console.log(`\nTerminé : ${ok} facture(s) créée(s), ${ko} échec(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
