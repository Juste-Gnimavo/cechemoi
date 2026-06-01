import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { computeCashReceipts } from '@/lib/finance/aggregations'

export const dynamic = 'force-dynamic'

// GET /api/admin/analytics/revenue-summary
//
// Renvoie les encaissements sur 3 fenêtres temporelles canoniques :
//   - allTime : depuis le début (lifetime)
//   - year    : année civile courante
//   - last30  : 30 derniers jours glissants
//
// Tout passe par computeCashReceipts pour garantir la même règle de
// dé-duplication que les autres endpoints financiers.
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR']
    if (!session || !allowedRoles.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()

    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    const startOfYear = new Date(now.getFullYear(), 0, 1)
    startOfYear.setHours(0, 0, 0, 0)

    const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    start30.setHours(0, 0, 0, 0)

    // Borne "lifetime" : assez ancienne pour couvrir toutes les données.
    // L'instance n'existe pas avant 2020 — on prend large.
    const startAllTime = new Date('2000-01-01T00:00:00.000Z')

    const [allTime, year, last30] = await Promise.all([
      computeCashReceipts({ start: startAllTime, end: endOfToday }),
      computeCashReceipts({ start: startOfYear, end: endOfToday }),
      computeCashReceipts({ start: start30, end: endOfToday }),
    ])

    return NextResponse.json({
      success: true,
      summary: {
        allTime: { total: allTime.total, breakdown: allTime.breakdown },
        year: {
          total: year.total,
          breakdown: year.breakdown,
          year: now.getFullYear(),
        },
        last30: { total: last30.total, breakdown: last30.breakdown },
      },
    })
  } catch (error) {
    console.error('Error fetching revenue summary:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du résumé' },
      { status: 500 }
    )
  }
}
