import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { generateInvoiceNumber } from '@/lib/invoice-generator'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/orders - Create a new order from admin
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      userId,
      addressId,
      items,
      shippingMethodId,
      paymentMethod,
      notes,
      discount = 0,
      couponId = null,
      couponCode = null,
      shippingCost: clientShippingCost = 0,
      sendSMS = false,
      sendWhatsApp = false,
      orderDate, // Manual date for offline orders
    } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'Client requis' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Au moins un produit requis' }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Mode de paiement requis' }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Handle shipping address
    let shippingAddressId = addressId

    // If no address provided, create a default one
    if (!shippingAddressId) {
      const defaultAddress = await prisma.address.create({
        data: {
          userId,
          fullName: user.name || 'Client',
          phone: user.phone || '',
          addressLine1: 'À définir',
          city: 'Abidjan',
          country: "Côte d'Ivoire",
          description: 'Adresse à confirmer avec le client',
        },
      })
      shippingAddressId = defaultAddress.id
    } else {
      // Verify address exists
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      })
      if (!address) {
        return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 })
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

    // Get shipping cost from shipping method if provided
    let shippingCost = clientShippingCost
    if (shippingMethodId) {
      const shippingMethodRecord = await prisma.shippingMethod.findUnique({
        where: { id: shippingMethodId },
      })
      if (shippingMethodRecord && shippingMethodRecord.costType !== 'variable') {
        shippingCost = shippingMethodRecord.cost || 0
      }
    }

    const total = subtotal - discount + shippingCost

    // Parse manual order date if provided (for offline orders)
    const orderCreatedAt = orderDate ? new Date(orderDate) : new Date()

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
        paymentMethod,
        subtotal,
        discount,
        shippingCost,
        total,
        couponId: couponId || null,
        couponCode: couponCode || null,
        shippingMethodId: shippingMethodId || null,
        shippingAddressId,
        notes: notes || null,
        createdAt: orderCreatedAt,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        shippingMethod: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    // Track coupon usage if a coupon was applied
    if (couponId) {
      try {
        // Create coupon usage record
        await prisma.couponUsage.create({
          data: {
            couponId,
            userId,
            orderId: order.id,
            discountAmount: discount, // The discount amount applied
            orderTotal: total, // The final order total
          },
        })

        // Increment coupon usage count
        await prisma.coupon.update({
          where: { id: couponId },
          data: {
            usageCount: { increment: 1 },
          },
        })
      } catch (couponError) {
        console.error('Error tracking coupon usage:', couponError)
        // Don't fail the order creation if coupon tracking fails
      }
    }

    // Create invoice for this order
    let createdInvoice = null
    try {
      const invoiceNumber = await generateInvoiceNumber()
      const address = order.shippingAddress

      const customerAddressParts = [
        address?.quartier,
        address?.cite,
        address?.rue,
        address?.city || 'Abidjan',
      ].filter(Boolean)
      const customerAddress = address?.description
        ? `${customerAddressParts.join(', ')} - ${address.description}`
        : customerAddressParts.join(', ')

      createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerName: order.user?.name || 'Client',
          customerEmail: order.user?.email || null,
          customerPhone: order.user?.phone || null,
          customerAddress,
          status: 'SENT',
          subtotal,
          tax: 0,
          shippingCost,
          discount,
          total,
          notes: notes ? `${notes}` : '',
          createdById: (session.user as any).id,
          issueDate: orderCreatedAt, // Use the same date as order for offline orders
          items: {
            create: order.items.map((item: any) => ({
              description: item.product?.name || 'Produit',
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.total,
              productId: item.productId,
            })),
          },
        },
      })
    } catch (invoiceError) {
      console.error('Invoice creation error:', invoiceError)
    }

    // Send notifications if requested
    if (sendSMS || sendWhatsApp) {
      // Build invoice URL for notifications
      const baseUrl = process.env.NEXTAUTH_URL || 'https://cave-express.ci'
      const invoiceUrl = createdInvoice
        ? `${baseUrl}/api/invoices/${createdInvoice.id}/pdf`
        : `${baseUrl}/account/orders/${order.id}`

      Promise.all([
        notificationService.sendOrderPlaced(order.id, invoiceUrl),
        notificationService.sendInvoiceCreated(order.id, invoiceUrl),
        notificationService.sendInvoicePdfCreated(order.id, invoiceUrl),
      ]).catch((error) => {
        console.error('Error sending order notifications:', error)
      })

      // Send admin notification
      notificationService.sendNewOrderAdmin(order.id).catch((error) => {
        console.error('Error sending admin notification:', error)
      })

      // Schedule payment reminders for non-prepaid orders
      if (paymentMethod === 'CASH_ON_DELIVERY') {
        notificationService.schedulePaymentReminders(order.id).catch((error) => {
          console.error('Error scheduling payment reminders:', error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      order,
      invoice: createdInvoice,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders - Get all orders with filtering, search, and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    // Search by order number or customer name/phone
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
      ]
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    // Filter by payment status
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where })

    // Get stats for the page header
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(Date.now() - (now.getDay() * 24 * 60 * 60 * 1000))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      yearOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfYear } } }),
    ])

    const stats = {
      total: totalOrders,
      pending: pendingOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      today: todayOrders,
      week: weekOrders,
      month: monthOrders,
      year: yearOrders,
    }

    // Fetch orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      orders,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}
