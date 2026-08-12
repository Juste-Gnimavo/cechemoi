import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import {
  createInvoiceFromCustomOrder,
  syncPaymentToInvoice,
} from '@/lib/custom-order-invoice-sync'

export const dynamic = 'force-dynamic'

// POST /api/admin/custom-orders/[id]/generate-invoice
// Génère (ou récupère) la facture d'une commande sur mesure. Utilisé pour
// réparer les commandes historiques sans facture (voir messages/07) —
// idempotent : si la facture existe déjà, renvoie son id.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      include: { payments: { select: { id: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const invoiceId = await createInvoiceFromCustomOrder(
      order.id,
      (session.user as any).id
    )

    // Synchroniser les paiements déjà enregistrés sur la commande
    for (const p of order.payments) {
      try {
        await syncPaymentToInvoice(p.id, order.id, (session.user as any).id)
      } catch (syncError) {
        // Paiement déjà synchronisé ou erreur non bloquante — journaliser
        console.warn('Payment sync skipped:', (syncError as Error).message)
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      message: 'Facture générée',
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération de la facture' }, { status: 500 })
  }
}
