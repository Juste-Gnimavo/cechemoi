import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/staff-performance - Get staff performance stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN can view staff performance
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Get all staff members (ADMIN, MANAGER, STAFF roles)
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER', 'STAFF'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // Get customer creation counts per staff
    const customerCreations = await prisma.user.groupBy({
      by: ['createdByStaffId'],
      where: {
        role: 'CUSTOMER',
        createdByStaffId: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _count: {
        id: true,
      },
    })

    // Get measurement counts per staff
    const measurementCounts = await prisma.customerMeasurement.groupBy({
      by: ['takenByStaffId'],
      where: {
        takenByStaffId: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { measurementDate: dateFilter }),
      },
      _count: {
        id: true,
      },
    })

    // Get last activity for each staff (most recent customer created or measurement taken)
    const lastCustomerActivity = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        createdByStaffId: { not: null },
      },
      select: {
        createdByStaffId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const lastMeasurementActivity = await prisma.customerMeasurement.findMany({
      where: {
        takenByStaffId: { not: null },
      },
      select: {
        takenByStaffId: true,
        measurementDate: true,
      },
      orderBy: { measurementDate: 'desc' },
    })

    // Create a map of staff ID to last activity
    const lastActivityMap: Record<string, Date> = {}

    for (const customer of lastCustomerActivity) {
      if (customer.createdByStaffId) {
        if (!lastActivityMap[customer.createdByStaffId] ||
            customer.createdAt > lastActivityMap[customer.createdByStaffId]) {
          lastActivityMap[customer.createdByStaffId] = customer.createdAt
        }
      }
    }

    for (const measurement of lastMeasurementActivity) {
      if (measurement.takenByStaffId) {
        if (!lastActivityMap[measurement.takenByStaffId] ||
            measurement.measurementDate > lastActivityMap[measurement.takenByStaffId]) {
          lastActivityMap[measurement.takenByStaffId] = measurement.measurementDate
        }
      }
    }

    // Create maps for easy lookup
    const customerCountMap: Record<string, number> = {}
    for (const item of customerCreations) {
      if (item.createdByStaffId) {
        customerCountMap[item.createdByStaffId] = item._count.id
      }
    }

    const measurementCountMap: Record<string, number> = {}
    for (const item of measurementCounts) {
      if (item.takenByStaffId) {
        measurementCountMap[item.takenByStaffId] = item._count.id
      }
    }

    // Build staff performance data
    const staffPerformance = staffMembers.map((staff) => ({
      id: staff.id,
      name: staff.name || 'Sans nom',
      email: staff.email,
      role: staff.role,
      customersCreated: customerCountMap[staff.id] || 0,
      measurementsTaken: measurementCountMap[staff.id] || 0,
      lastActivity: lastActivityMap[staff.id] || null,
      memberSince: staff.createdAt,
    }))

    // Sort by total activity (customers created + measurements taken)
    staffPerformance.sort((a, b) => {
      const totalA = a.customersCreated + a.measurementsTaken
      const totalB = b.customersCreated + b.measurementsTaken
      return totalB - totalA
    })

    // Calculate totals
    const totals = {
      totalStaff: staffMembers.length,
      totalCustomersCreated: Object.values(customerCountMap).reduce((a, b) => a + b, 0),
      totalMeasurementsTaken: Object.values(measurementCountMap).reduce((a, b) => a + b, 0),
    }

    return NextResponse.json({
      success: true,
      staffPerformance,
      totals,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    })
  } catch (error) {
    console.error('Error fetching staff performance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des performances' },
      { status: 500 }
    )
  }
}
