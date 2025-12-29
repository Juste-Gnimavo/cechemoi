import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import {
  createInvoiceFromCustomOrder,
  syncPaymentToInvoice,
} from '@/lib/custom-order-invoice-sync'

export const dynamic = 'force-dynamic'

// Generate order number format: SM-DDMMYY-0001
async function generateCustomOrderNumber(): Promise<string> {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear().toString().slice(-2)
  const datePrefix = `SM-${day}${month}${year}-`

  // Find the last order number for today
  const lastOrder = await prisma.customOrder.findFirst({
    where: {
      orderNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  })

  let nextNumber = 1
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderNumber.replace(datePrefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${datePrefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET /api/admin/custom-orders - List custom orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const tailorId = searchParams.get('tailorId')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (tailorId) {
      where.items = {
        some: {
          tailorId: tailorId,
        },
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ]
    }

    if (startDate || endDate) {
      where.orderDate = {}
      if (startDate) {
        where.orderDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate + 'T23:59:59')
      }
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.customOrder.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              whatsappNumber: true,
            },
          },
          items: {
            include: {
              tailor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payments: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          orderDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customOrder.count({ where }),
    ])

    // Calculate deposit and balance for each order
    const ordersWithCalculations = orders.map((order) => {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
      const balance = order.totalCost - totalPaid
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
      const garmentTypes = [...new Set(order.items.map((item) => item.garmentType))]

      return {
        ...order,
        deposit: totalPaid,
        balance,
        itemCount,
        garmentTypes,
      }
    })

    // Get stats
    const stats = await prisma.customOrder.groupBy({
      by: ['status'],
      _count: true,
    })

    const statusCounts = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      orders: ordersWithCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    })
  } catch (error) {
    console.error('Error fetching custom orders:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/custom-orders - Create a new custom order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await req.json()
    const {
      customerId,
      measurementId,
      items,
      pickupDate,
      customerDeadline,
      priority = 'NORMAL',
      materialCost = 0,
      deposit = 0,
      notes,
    } = body

    // Validate required fields
    if (!customerId) {
      return NextResponse.json({ error: 'Client requis' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Au moins un article requis' }, { status: 400 })
    }

    if (!pickupDate) {
      return NextResponse.json({ error: 'Date de retrait requise' }, { status: 400 })
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 })
    }

    // Verify measurement if provided
    if (measurementId) {
      const measurement = await prisma.customerMeasurement.findUnique({
        where: { id: measurementId },
      })
      if (!measurement) {
        return NextResponse.json({ error: 'Mensurations non trouvees' }, { status: 404 })
      }
    }

    // Generate order number
    const orderNumber = await generateCustomOrderNumber()

    // Calculate total cost from items
    const totalCost = items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * (item.quantity || 1),
      0
    )

    // Create the order
    const order = await prisma.customOrder.create({
      data: {
        orderNumber,
        customerId,
        measurementId,
        pickupDate: new Date(pickupDate),
        customerDeadline: customerDeadline ? new Date(customerDeadline) : null,
        priority,
        totalCost,
        materialCost,
        notes,
        createdById: (session.user as any).id,
        items: {
          create: items.map((item: any) => ({
            garmentType: item.garmentType,
            customType: item.customType,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            tailorId: item.tailorId,
            estimatedHours: item.estimatedHours,
          })),
        },
        // Create initial payment if deposit provided
        payments:
          deposit > 0
            ? {
                create: {
                  amount: deposit,
                  paymentType: 'DEPOSIT',
                  receivedById: (session.user as any).id,
                },
              }
            : undefined,
        // Create initial timeline entry
        timeline: {
          create: {
            event: 'Commande creee',
            description: `Commande sur-mesure creee par ${(session.user as any).name || 'Admin'}`,
            userId: (session.user as any).id,
            userName: (session.user as any).name,
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            tailor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: true,
        timeline: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Auto-create invoice for this custom order
    try {
      const invoiceId = await createInvoiceFromCustomOrder(
        order.id,
        (session.user as any).id
      )

      // If there was an initial deposit, sync it to invoice
      if (deposit > 0 && order.payments.length > 0) {
        const initialPayment = order.payments[0]
        await syncPaymentToInvoice(
          initialPayment.id,
          order.id,
          (session.user as any).id
        )
      }

      // Get updated order with invoice
      const updatedOrder = await prisma.customOrder.findUnique({
        where: { id: order.id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          items: {
            include: {
              tailor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payments: {
            include: {
              receipt: true,
            },
          },
          timeline: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        invoiceId,
        message: 'Commande sur-mesure creee avec succes',
      })
    } catch (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      // Return the order even if invoice creation fails
      return NextResponse.json({
        success: true,
        order,
        message: 'Commande creee (erreur facture)',
      })
    }
  } catch (error) {
    console.error('Error creating custom order:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
