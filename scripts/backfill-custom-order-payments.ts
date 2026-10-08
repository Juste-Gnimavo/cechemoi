/**
 * Recopie vers la commande sur mesure les paiements saisis depuis sa facture
 * (anomalie SM-081026-0001 : facture réglée à 100 000 FCFA, commande à 0 FCFA).
 *
 * Avant le correctif, POST /api/admin/invoices/[id]/payments n'écrivait que
 * l'InvoicePayment : la commande liée n'en savait rien.
 *
 * Usage :
 *   # 1. Rapport seul (aucune écriture) :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-custom-order-payments.ts
 *
 *   # 2. Application des réparations :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-custom-order-payments.ts --apply
 *
 * Idempotent : un InvoicePayment déjà relié à un CustomOrderPayment est ignoré.
 * Les totaux financiers ne bougent pas : les agrégats comptaient déjà ces
 * paiements comme « orphelins » et les dédupliquent via invoicePaymentId.
 */
import { prisma } from '../src/lib/prisma'
import { mirrorInvoicePaymentToCustomOrder } from '../src/lib/custom-order-invoice-sync'

async function main() {
  const apply = process.argv.includes('--apply')

  const [candidates, synced] = await Promise.all([
    prisma.invoicePayment.findMany({
      where: { invoice: { customOrderId: { not: null } } },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        invoice: {
          select: {
            invoiceNumber: true,
            customOrder: { select: { orderNumber: true } },
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    }),
    prisma.customOrderPayment.findMany({
      where: { invoicePaymentId: { not: null } },
      select: { invoicePaymentId: true },
    }),
  ])

  const syncedIds = new Set(synced.map((s) => s.invoicePaymentId))
  const orphans = candidates.filter((ip) => !syncedIds.has(ip.id))

  console.log(`${orphans.length} paiement(s) de facture absents de leur commande`)
  for (const ip of orphans) {
    console.log(
      `  ${ip.invoice.customOrder?.orderNumber} ← ${ip.invoice.invoiceNumber} : ` +
        `${ip.amount} FCFA du ${ip.paidAt.toISOString().slice(0, 10)}`
    )
    if (apply) await mirrorInvoicePaymentToCustomOrder(ip.id)
  }

  console.log(apply ? 'Réparations appliquées.' : 'Rapport seul — relancer avec --apply pour réparer.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
