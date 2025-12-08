import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Fetch all dashboard data in parallel
    const [user, ordersCount, wishlistCount, addressCount, loyaltyPoints, recentOrders, paidOrders] =
      await Promise.all([
        // User profile
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsappNumber: true,
            image: true,
            role: true,
            city: true,
            country: true,
            countryCode: true,
            lastLoginAt: true,
            lastLoginIp: true,
            lastLoginBrowser: true,
            createdAt: true,
          },
        }),

        // Orders count
        prisma.order.count({
          where: { userId },
        }),

        // Wishlist count
        prisma.wishlistItem.count({
          where: { userId },
        }),

        // Addresses count
        prisma.address.count({
          where: { userId },
        }),

        // Loyalty points
        prisma.loyaltyPoints.findUnique({
          where: { userId },
          select: {
            points: true,
            tier: true,
            totalEarned: true,
            totalSpent: true,
          },
        }),

        // Recent orders (last 3)
        prisma.order.findMany({
          where: { userId },
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
              },
            },
          },
        }),

        // Paid orders total (for spending calculation)
        prisma.order.findMany({
          where: { userId, paymentStatus: 'COMPLETED' },
          select: { total: true },
        }),
      ])

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Calculate total spent from orders
    const orderSpending = paidOrders.reduce((sum, order) => sum + order.total, 0)

    // Fetch PAID standalone invoices for this user (matched by phone)
    const paidStandaloneInvoices = user.phone ? await prisma.invoice.findMany({
      where: {
        orderId: null, // Standalone invoices only
        status: 'PAID',
        customerPhone: user.phone,
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paidDate: true,
      },
      orderBy: { paidDate: 'desc' },
      take: 5,
    }) : []

    const invoiceSpending = paidStandaloneInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalSpent = orderSpending + invoiceSpending

    return NextResponse.json({
      user,
      stats: {
        orders: ordersCount,
        wishlist: wishlistCount,
        addresses: addressCount,
        loyaltyPoints: loyaltyPoints?.points || 0,
        loyaltyTier: loyaltyPoints?.tier || 'bronze',
        totalSpent,
        spentFromOrders: orderSpending,
        spentFromInvoices: invoiceSpending,
        standaloneInvoiceCount: paidStandaloneInvoices.length,
      },
      recentOrders,
      recentStandaloneInvoices: paidStandaloneInvoices,
    })
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement du tableau de bord' },
      { status: 500 }
    )
  }
}
