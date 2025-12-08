/**
 * PaiementPro Payment Initialization API
 * POST /api/payments/paiementpro/initialize
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaiementProClient } from '@/lib/paiementpro/client';
import { PaymentInitParams } from '@/lib/paiementpro/types';


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      channel,
    }: {
      orderId: string;
      channel?: string;
    } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user owns this order
    if (order.userId !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to order' },
        { status: 403 }
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Order already paid' },
        { status: 400 }
      );
    }

    // Initialize payment with PaiementPro
    const client = getPaiementProClient();

    const paymentParams: PaymentInitParams = {
      amount: order.total,
      customerEmail: order.user.email || order.shippingAddress.phone + '@placeholder.com',
      customerFirstName: order.shippingAddress.fullName.split(' ')[0],
      customerLastName: order.shippingAddress.fullName.split(' ').slice(1).join(' ') || order.shippingAddress.fullName,
      customerPhoneNumber: order.shippingAddress.phone,
      description: `Commande #${order.orderNumber} - CÈCHÉMOI`,
      customerId: order.userId,
      channel: channel as any,
      returnContext: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    };

    const result = await client.initializePayment(paymentParams);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Payment initialization failed',
        },
        { status: 400 }
      );
    }

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        provider: 'PAIEMENTPRO',
        reference: result.reference,
        sessionId: result.sessionId,
        amount: order.total,
        currency: 'XOF',
        customerEmail: paymentParams.customerEmail,
        customerFirstName: paymentParams.customerFirstName,
        customerLastName: paymentParams.customerLastName,
        customerPhone: paymentParams.customerPhoneNumber,
        channel: channel || null,
        status: 'PENDING',
        description: paymentParams.description,
        returnContext: paymentParams.returnContext as any,
      },
      update: {
        reference: result.reference,
        sessionId: result.sessionId,
        channel: channel || null,
        status: 'PENDING',
      },
    });

    // Update order with payment reference and session ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentReference: result.reference,
        paymentSessionId: result.sessionId,
        paymentMethod: 'PAIEMENTPRO',
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      payment: {
        id: payment.id,
        reference: payment.reference,
      },
    });
  } catch (error) {
    console.error('[API] Payment initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
