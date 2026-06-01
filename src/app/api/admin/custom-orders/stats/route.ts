import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/stats
// Renvoie les encaissements sur-mesure (CustomOrderPayment) pour quatre
// fenêtres canoniques : Aujourd'hui, 30 jours, Cette année, Toute la période.
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

    const [today, last30, year, all] = await Promise.all([
      prisma.customOrderPayment.aggregate({
        where: { paidAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.customOrderPayment.aggregate({
        where: { paidAt: { gte: start30 } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.customOrderPayment.aggregate({
        where: { paidAt: { gte: startYear } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.customOrderPayment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        today: { count: today._count, total: today._sum.amount || 0 },
        last30: { count: last30._count, total: last30._sum.amount || 0 },
        year: { count: year._count, total: year._sum.amount || 0, label: now.getFullYear() },
        all: { count: all._count, total: all._sum.amount || 0 },
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
