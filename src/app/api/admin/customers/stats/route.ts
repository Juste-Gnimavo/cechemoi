import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/customers/stats - Get customer statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get all customers (not admins)
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
      },
      include: {
        orders: {
          select: {
            total: true,
            createdAt: true,
          },
        },
      },
    })

    const totalCustomers = customers.length

    // Calculate date thresholds
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Count new customers (registered in last 30 days)
    const newCustomers = customers.filter(
      (c) => new Date(c.createdAt) > thirtyDaysAgo
    ).length

    // Calculate segments
    let vipCount = 0
    let highValueCount = 0
    let inactiveCount = 0
    let totalLifetimeValue = 0

    customers.forEach((customer) => {
      const lifetimeValue = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = customer.orders.length
      const lastOrder = customer.orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

      totalLifetimeValue += lifetimeValue

      // VIP (5+ orders or LTV > 100k)
      if (totalOrders >= 5 || lifetimeValue >= 100000) {
        vipCount++
      }

      // High value (LTV > 50k)
      if (lifetimeValue >= 50000) {
        highValueCount++
      }

      // Inactive (no orders in 90 days or never ordered)
      if (!lastOrder || new Date(lastOrder.createdAt) < ninetyDaysAgo) {
        inactiveCount++
      }
    })

    // Calculate average customer value
    const averageCustomerValue =
      totalCustomers > 0 ? totalLifetimeValue / totalCustomers : 0

    // Get customers with most orders
    const topCustomers = customers
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalOrders: c.orders.length,
        lifetimeValue: c.orders.reduce((sum, order) => sum + order.total, 0),
      }))
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10)

    // Calculate customer growth (last 6 months)
    const monthlyGrowth = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const newInMonth = customers.filter((c) => {
        const createdAt = new Date(c.createdAt)
        return createdAt >= monthStart && createdAt <= monthEnd
      }).length

      monthlyGrowth.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        count: newInMonth,
      })
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        newCustomers,
        vipCount,
        highValueCount,
        inactiveCount,
        totalLifetimeValue,
        averageCustomerValue,
      },
      topCustomers,
      monthlyGrowth,
    })
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
