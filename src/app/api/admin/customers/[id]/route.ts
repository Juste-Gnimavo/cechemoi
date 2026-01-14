import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3-client'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/customers/[id] - Get customer details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: {
            items: {
              select: {
                quantity: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        addresses: {
          orderBy: {
            isDefault: 'desc',
          },
        },
        reviews: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        customerNotes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Fetch PAID standalone invoices for this customer (matched by phone)
    const paidStandaloneInvoices = await prisma.invoice.findMany({
      where: {
        orderId: null, // Standalone invoices only
        status: 'PAID',
        customerPhone: customer.phone,
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        createdAt: true,
        paidDate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const standaloneInvoiceTotal = paidStandaloneInvoices.reduce((sum, inv) => sum + inv.total, 0)

    // Calculate analytics
    const totalOrders = customer.orders.length
    const orderLifetimeValue = customer.orders.reduce((sum, order) => sum + order.total, 0)
    const lifetimeValue = orderLifetimeValue + standaloneInvoiceTotal
    const averageOrderValue = totalOrders > 0 ? orderLifetimeValue / totalOrders : 0

    // Count completed orders
    const completedOrders = customer.orders.filter((o) => o.status === 'DELIVERED').length

    // Get last order
    const lastOrder = customer.orders[0] || null

    // Calculate total items purchased
    const totalItemsPurchased = customer.orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Group orders by status
    const ordersByStatus = customer.orders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    // Calculate monthly spending (last 12 months)
    const now = new Date()
    const monthlySpending = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const monthOrders = customer.orders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= monthStart && orderDate <= monthEnd
      })

      const monthTotal = monthOrders.reduce((sum, order) => sum + order.total, 0)

      monthlySpending.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        amount: monthTotal,
        orders: monthOrders.length,
      })
    }

    // Determine customer segments
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    let segments: string[] = []

    if (new Date(customer.createdAt) > thirtyDaysAgo) {
      segments.push('new')
    }

    if (!lastOrder || new Date(lastOrder.createdAt) < ninetyDaysAgo) {
      segments.push('inactive')
    }

    if (totalOrders >= 5 || lifetimeValue >= 100000) {
      segments.push('vip')
    }

    if (lifetimeValue >= 50000) {
      segments.push('high-value')
    }

    const customerWithAnalytics = {
      ...customer,
      standaloneInvoices: paidStandaloneInvoices,
      analytics: {
        totalOrders,
        completedOrders,
        lifetimeValue,
        lifetimeValueFromOrders: orderLifetimeValue,
        lifetimeValueFromInvoices: standaloneInvoiceTotal,
        standaloneInvoiceCount: paidStandaloneInvoices.length,
        averageOrderValue,
        totalItemsPurchased,
        ordersByStatus,
        monthlySpending,
        segments,
        lastOrderDate: lastOrder?.createdAt || null,
      },
    }

    return NextResponse.json({ success: true, customer: customerWithAnalytics })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/customers/[id] - Update customer
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      email,
      phone,
      whatsappNumber,
      image,
      city,
      country,
      countryCode,
      inscriptionDate,
    } = body

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Check for duplicate phone if changing
    if (phone && phone !== existingCustomer.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone,
          role: 'CUSTOMER',
          id: { not: params.id },
        },
      })
      if (phoneExists) {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà utilisé par un autre client' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate email if changing
    if (email && email !== existingCustomer.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un autre utilisateur' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const customer = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone }),
        ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
        ...(image !== undefined && { image: image || null }),
        ...(city !== undefined && { city: city || null }),
        ...(country !== undefined && { country: country || null }),
        ...(countryCode !== undefined && { countryCode: countryCode || null }),
        ...(inscriptionDate !== undefined && { createdAt: inscriptionDate ? new Date(inscriptionDate) : existingCustomer.createdAt }),
      },
    })

    return NextResponse.json({ success: true, customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du client' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/customers/[id] - Delete customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: { select: { id: true } },
        measurements: { select: { id: true, pdfKey: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Prevent deletion if customer has orders
    if (customer.orders.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un client avec des commandes. Vous pouvez désactiver le compte.' },
        { status: 400 }
      )
    }

    // Delete PDFs from S3 if any
    for (const measurement of customer.measurements) {
      if (measurement.pdfKey) {
        try {
          await deleteFromS3(measurement.pdfKey)
        } catch (s3Error) {
          console.error('Failed to delete PDF from S3:', s3Error)
          // Continue anyway - S3 cleanup can be done later
        }
      }
    }

    // Delete customer (cascades to measurements, notes, etc.)
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Client supprimé avec succès' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    )
  }
}
