/**
 * Birthday Notifications API
 *
 * GET /api/admin/notifications/birthdays?tab=upcoming|history&year=2026&page=1
 * DELETE /api/admin/notifications/birthdays?logId=xxx - Delete a log entry (for re-triggering)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'upcoming'
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    // Stats: customers with dateOfBirth, sent this year, failed this year
    const [totalWithBirthday, sentThisYear, failedThisYear] = await Promise.all([
      prisma.user.count({
        where: { role: 'CUSTOMER', dateOfBirth: { not: null } },
      }),
      prisma.birthdayGreetingLog.count({
        where: { year, status: 'sent' },
      }),
      prisma.birthdayGreetingLog.count({
        where: { year, status: 'failed' },
      }),
    ])

    if (tab === 'upcoming') {
      // Get customers with upcoming birthdays (next 30 days)
      const now = new Date()
      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          dateOfBirth: { not: null },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          dateOfBirth: true,
          image: true,
        },
      })

      // Calculate upcoming birthdays
      const upcoming = customers
        .map((customer) => {
          const dob = customer.dateOfBirth!
          const birthMonth = dob.getUTCMonth()
          const birthDay = dob.getUTCDate()

          // Create this year's birthday date
          let birthdayThisYear = new Date(Date.UTC(now.getUTCFullYear(), birthMonth, birthDay))

          // If birthday already passed this year, calculate for next year
          if (birthdayThisYear < now) {
            birthdayThisYear = new Date(Date.UTC(now.getUTCFullYear() + 1, birthMonth, birthDay))
          }

          const diffTime = birthdayThisYear.getTime() - now.getTime()
          const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          // Calculate age
          const birthYear = dob.getUTCFullYear()
          const age = birthdayThisYear.getUTCFullYear() - birthYear

          return {
            ...customer,
            daysUntil,
            nextBirthday: birthdayThisYear.toISOString(),
            age,
          }
        })
        .filter((c) => c.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)

      // Check which ones already received a greeting this year
      const currentYear = now.getUTCFullYear()
      const userIds = upcoming.map((c) => c.id)
      const existingLogs = await prisma.birthdayGreetingLog.findMany({
        where: {
          userId: { in: userIds },
          year: currentYear,
        },
        select: { userId: true, status: true },
      })

      const logMap = new Map(existingLogs.map((l) => [l.userId, l.status]))

      const upcomingWithStatus = upcoming.map((c) => ({
        ...c,
        greetingStatus: logMap.get(c.id) || null,
      }))

      return NextResponse.json({
        success: true,
        tab: 'upcoming',
        data: upcomingWithStatus,
        stats: {
          totalWithBirthday,
          sentThisYear,
          failedThisYear,
        },
      })
    }

    // History tab
    const [logs, totalLogs] = await Promise.all([
      prisma.birthdayGreetingLog.findMany({
        where: { year },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.birthdayGreetingLog.count({ where: { year } }),
    ])

    // Enrich logs with user names
    const userIds = logs.map((l) => l.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, phone: true, dateOfBirth: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    const enrichedLogs = logs.map((log) => ({
      ...log,
      user: userMap.get(log.userId) || null,
    }))

    return NextResponse.json({
      success: true,
      tab: 'history',
      data: enrichedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
      },
      stats: {
        totalWithBirthday,
        sentThisYear,
        failedThisYear,
      },
    })
  } catch (error) {
    console.error('Error fetching birthday data:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des données' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a log entry to allow re-triggering
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const logId = searchParams.get('logId')

    if (!logId) {
      return NextResponse.json({ error: 'logId requis' }, { status: 400 })
    }

    await prisma.birthdayGreetingLog.delete({
      where: { id: logId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting birthday log:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
