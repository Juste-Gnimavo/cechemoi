import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/customers/sources - Get customer acquisition source stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all' // day, week, month, year, all

    // Calculate date filter
    let dateFilter: Date | undefined
    const now = new Date()
    if (period === 'day') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (period === 'year') {
      dateFilter = new Date(now.getFullYear(), 0, 1)
    }

    const dateWhere = dateFilter ? { gte: dateFilter } : undefined

    // Get source distribution
    const sourceStats = await prisma.user.groupBy({
      by: ['howDidYouHearAboutUs'],
      where: {
        role: 'CUSTOMER',
        ...(dateWhere ? { createdAt: dateWhere } : {}),
      },
      _count: true,
      orderBy: {
        _count: {
          howDidYouHearAboutUs: 'desc',
        },
      },
    })

    // Get total customers for the period
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        ...(dateWhere ? { createdAt: dateWhere } : {}),
      },
    })

    // Get monthly trend data (last 12 months)
    const monthlyData: { month: string; sources: Record<string, number>; total: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const monthStats = await prisma.user.groupBy({
        by: ['howDidYouHearAboutUs'],
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _count: true,
      })

      const monthTotal = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      const sourcesMap: Record<string, number> = {}
      monthStats.forEach(s => {
        const source = s.howDidYouHearAboutUs || 'Non specifie'
        sourcesMap[source] = s._count
      })

      monthlyData.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        sources: sourcesMap,
        total: monthTotal,
      })
    }

    // Get weekly trend data (last 8 weeks)
    const weeklyData: { week: string; sources: Record<string, number>; total: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)

      const weekStats = await prisma.user.groupBy({
        by: ['howDidYouHearAboutUs'],
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        _count: true,
      })

      const weekTotal = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      })

      const sourcesMap: Record<string, number> = {}
      weekStats.forEach(s => {
        const source = s.howDidYouHearAboutUs || 'Non specifie'
        sourcesMap[source] = s._count
      })

      weeklyData.push({
        week: `Sem. ${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`,
        sources: sourcesMap,
        total: weekTotal,
      })
    }

    // Format source stats with percentages
    const formattedStats = sourceStats.map(s => ({
      source: s.howDidYouHearAboutUs || 'Non specifie',
      count: s._count,
      percentage: totalCustomers > 0 ? Math.round((s._count / totalCustomers) * 100) : 0,
    }))

    // Define source colors for charts
    const sourceColors: Record<string, string> = {
      'Instagram': '#E4405F',
      'Facebook': '#1877F2',
      'TikTok': '#000000',
      'Google': '#4285F4',
      'Bouche à oreille': '#10B981',
      'Publicité': '#F59E0B',
      'Événement': '#8B5CF6',
      'Autre': '#6B7280',
      'Non specifie': '#9CA3AF',
    }

    return NextResponse.json({
      success: true,
      stats: formattedStats,
      totalCustomers,
      monthlyData,
      weeklyData,
      sourceColors,
      period,
    })
  } catch (error) {
    console.error('Error fetching customer sources:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
