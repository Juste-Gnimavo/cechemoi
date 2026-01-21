/**
 * API Route: Admin Standalone Payments
 * GET /api/admin/standalone-payments - List with filtering, search, pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const totalCount = await prisma.standalonePayment.count({ where })

    // Get payments with pagination
    const payments = await prisma.standalonePayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get stats
    const [totalPayments, pendingCount, completedCount, failedCount, totalAmountResult] = await Promise.all([
      prisma.standalonePayment.count(),
      prisma.standalonePayment.count({ where: { status: 'PENDING' } }),
      prisma.standalonePayment.count({ where: { status: 'COMPLETED' } }),
      prisma.standalonePayment.count({ where: { status: 'FAILED' } }),
      prisma.standalonePayment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ])

    const stats = {
      total: totalPayments,
      pending: pendingCount,
      completed: completedCount,
      failed: failedCount,
      totalAmount: totalAmountResult._sum.amount || 0,
    }

    return NextResponse.json({
      success: true,
      payments,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('[Admin Standalone Payments] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
