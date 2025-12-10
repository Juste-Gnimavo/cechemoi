/**
 * Order Creation API with Progress Tracking
 * POST /api/orders/stream
 *
 * Creates an order and returns progress data for the client to animate
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { notificationService } from '@/lib/notification-service'
import { generateInvoiceNumber } from '@/lib/invoice-generator'
import { getPaiementProClient } from '@/lib/paiementpro/client'
import { PaymentInitParams } from '@/lib/paiementpro/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Get user ID from session or JWT
  const userId = await getUserId(request)

  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Parse request body
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

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
    paymentChannel,
  } = body

  let order: any = null
  let createdInvoice: any = null
  let invoiceUrl = ''
  let paymentUrl = ''

  try {
    // ===== STEP 1: Create Order =====
    const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const subtotal = clientSubtotal || calculatedSubtotal

    let shippingCost = 0
    if (shippingMethodId) {
      const shippingMethod = await prisma.shippingMethod.findUnique({
        where: { id: shippingMethodId },
      })
      if (shippingMethod && shippingMethod.costType !== 'variable') {
        shippingCost = shippingMethod.cost || 0
      } else {
        shippingCost = clientShippingCost || 0
      }
    } else {
      shippingCost = clientShippingCost || 0
    }

    const discount = clientDiscount || 0
    const total = subtotal - discount + shippingCost

    const addressParts = [address.quartier, address.cite, address.rue].filter(Boolean)
    const addressLine1 = addressParts.length > 0 ? addressParts.join(', ') : address.city || 'Abidjan'

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    })

    const shippingAddress = await prisma.address.create({
      data: {
        userId,
        fullName: address.fullName || user?.name || 'Client',
        phone: address.phone || user?.phone || '',
        quartier: address.quartier || null,
        cite: address.cite || null,
        rue: address.rue || null,
        city: address.city || 'Abidjan',
        description: address.description || null,
        latitude: address.latitude || null,
        longitude: address.longitude || null,
        geoAccuracy: address.geoAccuracy || null,
        geoSource: address.latitude ? 'browser' : null,
        addressLine1,
        addressLine2: address.description || null,
        country: "Côte d'Ivoire",
      },
    })

    order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
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
        items: { include: { product: true } },
        shippingAddress: true,
        shippingMethod: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    // Record coupon usage
    if (couponId && discount > 0) {
      try {
        await prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        })
        await prisma.couponUsage.create({
          data: {
            couponId,
            userId,
            orderId: order.id,
            discountAmount: discount,
            orderTotal: total,
          },
        })
      } catch (couponError) {
        console.error('Coupon usage tracking error:', couponError)
      }
    }

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    // ===== STEP 2: Create Invoice =====
    try {
      const invoiceNumber = await generateInvoiceNumber()
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
          status: 'SENT',
          subtotal,
          tax: 0,
          shippingCost,
          discount,
          total,
          notes: couponCode ? `Code promo applique: ${couponCode}` : null,
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
      console.error('Invoice creation error:', invoiceError)
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://cechemoi.com'
    invoiceUrl = createdInvoice
      ? `${baseUrl}/api/invoices/${createdInvoice.id}/pdf`
      : `${baseUrl}/account/orders/${order.id}`

    // ===== STEP 3: Handle payment method =====
    if (paymentMethod === 'PAIEMENTPRO') {
      try {
        const client = getPaiementProClient()

        const paymentParams: PaymentInitParams = {
          amount: order.total,
          customerEmail: order.user.email || order.shippingAddress.phone + '@placeholder.com',
          customerFirstName: order.shippingAddress.fullName.split(' ')[0],
          customerLastName: order.shippingAddress.fullName.split(' ').slice(1).join(' ') || order.shippingAddress.fullName,
          customerPhoneNumber: order.shippingAddress.phone,
          description: `Commande #${order.orderNumber} - CÈCHÉMOI`,
          customerId: order.userId,
          channel: paymentChannel as any,
          returnContext: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
          },
        }

        const result = await client.initializePayment(paymentParams)

        if (result.success) {
          await prisma.payment.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              provider: 'PAIEMENTPRO',
              reference: result.reference,
              sessionId: result.sessionId,
              amount: order.total,
              currency: 'XOF',
              customerEmail: paymentParams.customerEmail,
              customerFirstName: paymentParams.customerFirstName,
              customerLastName: paymentParams.customerLastName,
              customerPhone: paymentParams.customerPhoneNumber,
              channel: paymentChannel || null,
              status: 'PENDING',
              description: paymentParams.description,
              returnContext: paymentParams.returnContext as any,
            },
            update: {
              reference: result.reference,
              sessionId: result.sessionId,
              channel: paymentChannel || null,
              status: 'PENDING',
            },
          })

          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentReference: result.reference,
              paymentSessionId: result.sessionId,
              paymentMethod: 'PAIEMENTPRO',
            },
          })

          paymentUrl = result.paymentUrl || ''
        }
      } catch (paymentError: any) {
        console.error('Payment initialization error:', paymentError)
      }

       // PAIEMENTPRO - Send notifications in background (same as CASH_ON_DELIVERY)
      Promise.all([
        notificationService.sendOrderPlaced(order.id, invoiceUrl),
        notificationService.sendInvoiceCreated(order.id, invoiceUrl),
        notificationService.sendInvoicePdfCreated(order.id, invoiceUrl),
      ]).catch(err => {
        console.error('Notification error:', err)
      })

      notificationService.sendNewOrderAdmin(order.id).catch(err => {
        console.error('Admin notification error:', err)
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceUrl,
        paymentUrl,
        paymentMethod: 'PAIEMENTPRO',
      })

    } else {
      // CASH_ON_DELIVERY - Send notifications in background
      // Don't await - let them run in background
      Promise.all([
        notificationService.sendOrderPlaced(order.id, invoiceUrl),
        notificationService.sendInvoiceCreated(order.id, invoiceUrl),
        notificationService.sendInvoicePdfCreated(order.id, invoiceUrl),
      ]).catch(err => {
        console.error('Notification error:', err)
      })

      // Background tasks
      notificationService.sendNewOrderAdmin(order.id).catch(err => {
        console.error('Admin notification error:', err)
      })
      notificationService.schedulePaymentReminders(order.id).catch(err => {
        console.error('Payment reminder scheduling error:', err)
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceUrl,
        paymentMethod: 'CASH_ON_DELIVERY',
      })
    }

  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Une erreur est survenue lors de la creation de la commande',
    }, { status: 500 })
  }
}
