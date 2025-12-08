import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/reports/saved/[id] - Get a single saved report
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const report = await prisma.savedReport.findUnique({
      where: { id: params.id },
      include: {
        schedules: true,
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Error fetching saved report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du rapport' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/reports/saved/[id] - Update a saved report
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if report exists
    const existingReport = await prisma.savedReport.findUnique({
      where: { id: params.id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      )
    }

    const report = await prisma.savedReport.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(reportType && { reportType }),
        ...(dateRange && { dateRange }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(filters !== undefined && { filters }),
        ...(columns && { columns }),
        ...(groupBy !== undefined && { groupBy }),
        ...(sortBy !== undefined && { sortBy }),
        ...(sortOrder && { sortOrder }),
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
    console.error('Error updating saved report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rapport' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/reports/saved/[id] - Delete a saved report
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if report exists
    const report = await prisma.savedReport.findUnique({
      where: { id: params.id },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      )
    }

    await prisma.savedReport.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Rapport supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du rapport' },
      { status: 500 }
    )
  }
}
