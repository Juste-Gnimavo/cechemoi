import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/notifications/logs - Get notification logs with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const trigger = searchParams.get('trigger')
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (trigger) where.trigger = trigger
    if (channel) where.channel = channel
    if (status) where.status = status
    if (orderId) where.orderId = orderId
    if (userId) where.userId = userId

    const [logs, total, sentCount, failedCount, pendingCount, channelStats, triggerStats] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
      prisma.notificationLog.count({ where: { ...where, status: 'sent' } }),
      prisma.notificationLog.count({ where: { ...where, status: 'failed' } }),
      prisma.notificationLog.count({ where: { ...where, status: 'pending' } }),
      prisma.notificationLog.groupBy({
        by: ['channel'],
        _count: { channel: true },
        where,
      }),
      prisma.notificationLog.groupBy({
        by: ['trigger'],
        _count: { trigger: true },
        where,
      }),
    ])

    // Transform grouped stats into Record format
    const byChannel: Record<string, number> = {}
    channelStats.forEach((stat) => {
      byChannel[stat.channel] = stat._count.channel
    })

    const byTrigger: Record<string, number> = {}
    triggerStats.forEach((stat) => {
      byTrigger[stat.trigger] = stat._count.trigger
    })

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        total,
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        byChannel,
        byTrigger,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching notification logs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des journaux' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/notifications/logs - Delete old logs
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : 30

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await prisma.notificationLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} journaux supprimés (plus de ${days} jours)`,
      deleted: result.count,
    })
  } catch (error) {
    console.error('Error deleting notification logs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des journaux' },
      { status: 500 }
    )
  }
}
