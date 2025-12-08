/**
 * PaiementPro Payment Status Check API
 * GET /api/payments/paiementpro/status/[reference]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaiementProClient } from '@/lib/paiementpro/client';


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { reference } = params;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify user owns this payment
    if (payment.order.userId !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to payment' },
        { status: 403 }
      );
    }

    // If payment is already completed or failed, return from database
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        payment: {
          reference: payment.reference,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          channel: payment.channel,
          transactionDate: payment.transactionDate,
          paymentId: payment.paymentId,
          order: {
            id: payment.order.id,
            orderNumber: payment.order.orderNumber,
            status: payment.order.status,
            paymentStatus: payment.order.paymentStatus,
          },
        },
      });
    }

    // Check status with PaiementPro API
    const client = getPaiementProClient();
    const result = await client.checkPaymentStatus(reference);

    if (!result.success) {
      // Return database status if API call fails
      return NextResponse.json({
        success: true,
        payment: {
          reference: payment.reference,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          channel: payment.channel,
          order: {
            id: payment.order.id,
            orderNumber: payment.order.orderNumber,
            status: payment.order.status,
            paymentStatus: payment.order.paymentStatus,
          },
        },
        apiError: result.error,
      });
    }

    // Update payment status if changed
    const apiStatus = result.status!.success ? 'COMPLETED' : 'FAILED';

    if (result.status && payment.status !== apiStatus as any) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: apiStatus,
          transactionDate: new Date(result.status.date),
          paymentId: result.status.pay_id,
          channel: result.status.channel,
          providerResponse: result.status as any,
        },
      });

      // Update order status if payment completed
      if (apiStatus === 'COMPLETED') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'COMPLETED',
            status: 'PROCESSING',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        reference: payment.reference,
        status: apiStatus,
        amount: payment.amount,
        currency: payment.currency,
        channel: result.status?.channel || payment.channel,
        transactionDate: result.status?.date || payment.transactionDate,
        paymentId: result.status?.pay_id || payment.paymentId,
        order: {
          id: payment.order.id,
          orderNumber: payment.order.orderNumber,
          status: apiStatus === 'COMPLETED' ? 'PROCESSING' : payment.order.status,
          paymentStatus: apiStatus,
        },
      },
      providerStatus: result.status,
    });
  } catch (error) {
    console.error('[API] Status check error:', error);
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
