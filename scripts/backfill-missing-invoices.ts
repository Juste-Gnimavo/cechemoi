/**
 * Recense et répare les commandes sur mesure sans facture (problème 07)
 * ainsi que les paiements désynchronisés de leur facture (anomalie SM-040326-0002).
 *
 * Usage :
 *   # 1. Rapport seul (aucune écriture) :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-missing-invoices.ts
 *
 *   # 2. Application des réparations :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-missing-invoices.ts --apply
 *
 * Trois passes :
 *   1. Commandes non annulées sans facture → création de la facture + sync des acomptes.
 *   2. Paiements dont la sync est incomplète alors que la facture existe
 *      (pas d'InvoicePayment, pas de reçu, ou reçu aux liens cassés) → resync.
 *      La sync est idempotente : reçus et InvoicePayments existants sont réutilisés.
 *   3. Factures de commandes sur mesure dont « encaissé » ne correspond pas à la
 *      somme des paiements → recalcul du montant et du statut.
 *
 * Idempotent : rejouable sans effet de bord, une commande saine n'est pas touchée.
 */
import { prisma } from '../src/lib/prisma'
import {
  createInvoiceFromCustomOrder,
  syncPaymentToInvoice,
  updateInvoiceAmountAndStatus,
} from '../src/lib/custom-order-invoice-sync'

async function passOrphanInvoices(apply: boolean) {
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

  console.log(`\n— Passe 1 : ${orphans.length} commande(s) sans facture`)
  if (orphans.length === 0) return

  for (const o of orphans) {
    console.log(
      `  ${o.orderNumber} — ${o.customer?.name || '—'} — ` +
        `${o.orderDate.toLocaleDateString('fr-FR')} — ${o.totalCost} CFA — ` +
        `${o.payments.length} paiement(s)`
    )
  }

  if (!apply) return

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
          console.warn(
            `  ⚠ ${o.orderNumber} : paiement ${p.id} non synchronisé (${(e as Error).message})`
          )
        }
      }
      ok++
      console.log(`  ✓ ${o.orderNumber}`)
    } catch (e) {
      ko++
      console.error(`  ✗ ${o.orderNumber} : ${(e as Error).message}`)
    }
  }
  console.log(`  → ${ok} facture(s) créée(s), ${ko} échec(s).`)
}

async function passDesyncedPayments(apply: boolean) {
  // Paiements de commandes non annulées AVEC facture, mais dont la chaîne
  // paiement → InvoicePayment → reçu est incomplète ou aux liens cassés.
  const desynced = await prisma.customOrderPayment.findMany({
    where: {
      customOrder: {
        status: { not: 'CANCELLED' },
        invoice: { isNot: null },
      },
      OR: [
        { invoicePaymentId: null },
        { receipt: { is: null } },
        { receipt: { is: { invoicePaymentId: null } } },
        { receipt: { is: { invoiceId: null } } },
      ],
    },
    include: {
      customOrder: { select: { id: true, orderNumber: true } },
    },
    orderBy: { paidAt: 'asc' },
  })

  console.log(`\n— Passe 2 : ${desynced.length} paiement(s) désynchronisé(s)`)
  if (desynced.length === 0) return

  for (const p of desynced) {
    console.log(
      `  ${p.customOrder.orderNumber} — ${p.amount} CFA — ` +
        `${p.paidAt.toLocaleDateString('fr-FR')} — ` +
        `${p.invoicePaymentId ? 'reçu à relier' : 'InvoicePayment manquant'}`
    )
  }

  if (!apply) return

  let ok = 0
  let ko = 0
  for (const p of desynced) {
    try {
      await syncPaymentToInvoice(p.id, p.customOrder.id)
      ok++
      console.log(`  ✓ ${p.customOrder.orderNumber} — paiement ${p.id}`)
    } catch (e) {
      ko++
      console.error(`  ✗ ${p.customOrder.orderNumber} — paiement ${p.id} : ${(e as Error).message}`)
    }
  }
  console.log(`  → ${ok} paiement(s) resynchronisé(s), ${ko} échec(s).`)
}

async function passStaleAmounts(apply: boolean) {
  // Factures de commandes sur mesure dont amountPaid ≠ somme des InvoicePayments
  const invoices = await prisma.invoice.findMany({
    where: { customOrderId: { not: null } },
    select: {
      id: true,
      invoiceNumber: true,
      amountPaid: true,
      payments: { select: { amount: true } },
    },
  })

  const stale = invoices.filter((inv) => {
    const computed = inv.payments.reduce((sum, p) => sum + p.amount, 0)
    return Math.abs(computed - inv.amountPaid) > 0.001
  })

  console.log(`\n— Passe 3 : ${stale.length} facture(s) avec « encaissé » incohérent`)
  if (stale.length === 0) return

  for (const inv of stale) {
    const computed = inv.payments.reduce((sum, p) => sum + p.amount, 0)
    console.log(`  ${inv.invoiceNumber} — encaissé ${inv.amountPaid} CFA, attendu ${computed} CFA`)
  }

  if (!apply) return

  for (const inv of stale) {
    await updateInvoiceAmountAndStatus(inv.id)
    console.log(`  ✓ ${inv.invoiceNumber}`)
  }
}

async function main() {
  const apply = process.argv.includes('--apply')

  await passOrphanInvoices(apply)
  await passDesyncedPayments(apply)
  await passStaleAmounts(apply)

  if (!apply) {
    console.log('\nMode rapport. Relancer avec --apply pour appliquer les réparations.')
  } else {
    console.log('\nTerminé.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
