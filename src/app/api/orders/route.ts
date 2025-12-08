import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'
import { generateOrderNumber } from '@/lib/utils'
import { notificationService } from '@/lib/notification-service'
import { generateInvoiceNumber } from '@/lib/invoice-generator'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      items,
      address,
      paymentMethod,
      shippingMethodId,
      subtotal: clientSubtotal,
      shippingCost: clientShippingCost,
      discount: clientDiscount,
      couponId,
      couponCode,
    } = body

    // Calculate totals (verify client values)
    const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const subtotal = clientSubtotal || calculatedSubtotal

    // Get shipping cost from shipping method if provided, otherwise use client value
    let shippingCost = 0
    if (shippingMethodId) {
      const shippingMethod = await prisma.shippingMethod.findUnique({
        where: { id: shippingMethodId },
      })
      // Use method cost if not variable, otherwise use client value (0 for variable means pay on delivery)
      // 'variable' costType means shipping is determined by delivery service (e.g., Yango)
      if (shippingMethod && shippingMethod.costType !== 'variable') {
        shippingCost = shippingMethod.cost || 0
      } else {
        shippingCost = clientShippingCost || 0
      }
    } else {
      shippingCost = clientShippingCost || 0
    }

    // Handle discount from coupon
    const discount = clientDiscount || 0
    const total = subtotal - discount + shippingCost

    // Build addressLine1 from the new format fields for backward compatibility
    const addressParts = [
      address.quartier,
      address.cite,
      address.rue,
    ].filter(Boolean)
    const addressLine1 = addressParts.length > 0
      ? addressParts.join(', ')
      : address.city || 'Abidjan'

    // Get user info for the address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    })

    // Create address with both new African format and legacy fields
    const shippingAddress = await prisma.address.create({
      data: {
        userId: userId,
        fullName: address.fullName || user?.name || 'Client',
        phone: address.phone || user?.phone || '',
        // African/Ivorian format
        quartier: address.quartier || null,
        cite: address.cite || null,
        rue: address.rue || null,
        city: address.city || 'Abidjan',
        description: address.description || null,
        // Geolocation
        latitude: address.latitude || null,
        longitude: address.longitude || null,
        geoAccuracy: address.geoAccuracy || null,
        geoSource: address.latitude ? 'browser' : null,
        // Required legacy fields for backward compatibility
        addressLine1: addressLine1,
        addressLine2: address.description || null,
        country: "Côte d'Ivoire",
      },
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
        subtotal,
        discount,
        shippingCost,
        total,
        couponId: couponId || null,
        couponCode: couponCode || null,
        shippingMethodId: shippingMethodId || null,
        shippingAddressId: shippingAddress.id,
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

    // Record coupon usage if a coupon was applied
    if (couponId && discount > 0) {
      try {
        // Increment coupon usage count
        await prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        })

        // Record user coupon usage
        await prisma.couponUsage.create({
          data: {
            couponId,
            userId: userId,
            orderId: order.id,
            discountAmount: discount,
            orderTotal: total,
          },
        })
      } catch (couponError) {
        console.error('Coupon usage tracking error:', couponError)
        // Don't fail the order if coupon tracking fails
      }
    }

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

    // Create invoice for this order
    let createdInvoice = null
    try {
      const invoiceNumber = await generateInvoiceNumber()

      // Build customer address string
      const customerAddressParts = [
        address.quartier,
        address.cite,
        address.rue,
        address.city || 'Abidjan',
      ].filter(Boolean)
      const customerAddress = address.description
        ? `${customerAddressParts.join(', ')} - ${address.description}`
        : customerAddressParts.join(', ')

      createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerName: order.user?.name || address.fullName || 'Client',
          customerEmail: order.user?.email || null,
          customerPhone: address.phone || order.user?.phone || null,
          customerAddress,
          status: 'SENT', // Automatically set as sent since it's from an order
          subtotal,
          tax: 0,
          shippingCost,
          discount,
          total,
          notes: couponCode ? `Code promo appliqué: ${couponCode}` : null,
          createdById: userId,
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
      // Log invoice creation error but don't fail the order
      console.error('Invoice creation error:', invoiceError)
    }

    // Build invoice URL for notifications
    const baseUrl = process.env.NEXTAUTH_URL || 'https://cave-express.ci'
    const invoiceUrl = createdInvoice
      ? `${baseUrl}/api/invoices/${createdInvoice.id}/pdf`
      : `${baseUrl}/account/orders/${order.id}`

    // Send notifications (don't await to avoid blocking response)
    Promise.all([
      // 1. Order placed notification (SMS + WhatsApp)
      notificationService.sendOrderPlaced(order.id),
      // 2. Admin notification
      notificationService.sendNewOrderAdmin(order.id),
      // 3. Invoice created notification with link (separate from order notification)
      notificationService.sendInvoiceCreated(order.id, invoiceUrl),
      // 4. Invoice PDF attachment (sends PDF file via WhatsApp)
      notificationService.sendInvoicePdfCreated(order.id, invoiceUrl),
      // 5. Schedule payment reminders for unpaid orders
      notificationService.schedulePaymentReminders(order.id),
    ]).catch((error) => {
      console.error('Error sending order notifications:', error)
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}
