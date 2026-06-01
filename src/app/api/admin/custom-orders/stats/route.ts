import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Encaissements sur-mesure dans une fenêtre temporelle :
//   somme(CustomOrderPayment.amount)
//   + somme(InvoicePayment.amount) sur factures custom-order, hors paiements
//                                  déjà synchronisés via CustomOrderPayment
//
// Le 2e bucket capture les paiements que la DG saisit parfois directement
// sur la facture sans passer par le flow CustomOrderPayment — sinon ils
// disparaissent des stats sur-mesure.
async function customCashIn(window: { gte: Date; lte?: Date } | { gte: Date }) {
  const [direct, orphanCandidates, syncedIds] = await Promise.all([
    prisma.customOrderPayment.aggregate({
      where: { paidAt: window },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoicePayment.findMany({
      where: {
        paidAt: window,
        invoice: { customOrderId: { not: null } },
      },
      select: { id: true, amount: true },
    }),
    prisma.customOrderPayment.findMany({
      where: { invoicePaymentId: { not: null } },
      select: { invoicePaymentId: true },
    }),
  ])

  const syncedSet = new Set(syncedIds.map(s => s.invoicePaymentId).filter(Boolean))
  const orphans = orphanCandidates.filter(ip => !syncedSet.has(ip.id))
  const orphanTotal = orphans.reduce((s, ip) => s + ip.amount, 0)

  return {
    count: (direct._count || 0) + orphans.length,
    total: (direct._sum.amount || 0) + orphanTotal,
  }
}

// GET /api/admin/custom-orders/stats
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    start30.setHours(0, 0, 0, 0)

    const startYear = new Date(now.getFullYear(), 0, 1)
    startYear.setHours(0, 0, 0, 0)

    const veryOld = new Date('2000-01-01T00:00:00.000Z')

    const [today, last30, year, all] = await Promise.all([
      customCashIn({ gte: todayStart, lte: todayEnd }),
      customCashIn({ gte: start30 }),
      customCashIn({ gte: startYear }),
      customCashIn({ gte: veryOld }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        today,
        last30,
        year: { ...year, label: now.getFullYear() },
        all,
      },
    })
  } catch (error) {
    console.error('Error fetching custom orders stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
