import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reports/saved - Get all saved reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const reports = await prisma.savedReport.findMany({
      include: {
        schedules: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      reports,
    })
  } catch (error) {
    console.error('Error fetching saved reports:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    )
  }
}

// POST /api/admin/reports/saved - Create a saved report
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      reportType,
      dateRange,
      startDate,
      endDate,
      filters,
      columns,
      groupBy,
      sortBy,
      sortOrder,
    } = body

    // Validate required fields
    if (!name || !reportType || !columns || columns.length === 0) {
      return NextResponse.json(
        { error: 'Nom, type de rapport et colonnes requis' },
        { status: 400 }
      )
    }

    const report = await prisma.savedReport.create({
      data: {
        name,
        description: description || null,
        reportType,
        dateRange: dateRange || 'month',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        filters: filters || null,
        columns,
        groupBy: groupBy || null,
        sortBy: sortBy || null,
        sortOrder: sortOrder || 'desc',
        createdBy: (session.user as any).id,
      },
      include: {
        schedules: true,
      },
    })

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Error creating saved report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du rapport' },
      { status: 500 }
    )
  }
}
