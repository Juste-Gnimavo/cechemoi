import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/notifications/stats - Get notification statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7' // Default 7 days
    const days = parseInt(period)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get overall stats
    const [
      totalSent,
      totalFailed,
      totalPending,
      smsCount,
      whatsappCount,
      whatsappCloudCount,
      emailCount,
    ] = await Promise.all([
      prisma.notificationLog.count({
        where: {
          status: 'sent',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notificationLog.count({
        where: {
          status: 'failed',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notificationLog.count({
        where: {
          status: 'pending',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notificationLog.count({
        where: {
          channel: 'SMS',
          status: 'sent',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notificationLog.count({
        where: {
          channel: 'WHATSAPP',
          status: 'sent',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notificationLog.count({
        where: {
          channel: 'WHATSAPP_CLOUD',
          status: 'sent',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notificationLog.count({
        where: {
          channel: 'EMAIL',
          status: 'sent',
          createdAt: { gte: startDate },
        },
      }),
    ])

    // Get trigger breakdown
    const triggerBreakdown = await prisma.notificationLog.groupBy({
      by: ['trigger'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        trigger: true,
      },
      orderBy: {
        _count: {
          trigger: 'desc',
        },
      },
    })

    // Get daily stats for chart
    const dailyStats = await prisma.$queryRaw<any[]>`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM NotificationLog
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `

    const stats = {
      overview: {
        totalSent,
        totalFailed,
        totalPending,
        successRate: totalSent + totalFailed > 0
          ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2)
          : 0,
      },
      channels: {
        sms: smsCount,
        whatsapp: whatsappCount,
        whatsappCloud: whatsappCloudCount,
        email: emailCount,
      },
      triggers: triggerBreakdown.map((item) => ({
        trigger: item.trigger,
        count: item._count.trigger,
      })),
      daily: dailyStats.map((day) => ({
        date: day.date,
        total: Number(day.total),
        sent: Number(day.sent),
        failed: Number(day.failed),
      })),
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
