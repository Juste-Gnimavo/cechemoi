/**
 * Order Payment Status API
 * GET /api/orders/[id]/payment-status
 *
 * Mobile-compatible endpoint that supports both JWT and session auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth-helper';
import { getPaiementProClient } from '@/lib/paiementpro/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Verify user owns this order
    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé à cette commande' },
        { status: 403 }
      );
    }

    const payment = order.payment;

    // No payment found - return order status
    if (!payment) {
      return NextResponse.json({
        success: true,
        payment: null,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
        },
      });
    }

    // If payment is already completed or failed, return from database
    const paymentStatus = payment.status as string
    if (paymentStatus === 'COMPLETED' || paymentStatus === 'FAILED') {
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
        },
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
      });
    }

    // For pending payments, check status with PaiementPro API
    try {
      const client = getPaiementProClient();
      const result = await client.checkPaymentStatus(payment.reference);

      if (result.success && result.status) {
        const apiStatus = result.status.success ? 'COMPLETED' : 'FAILED';

        // Update payment status if changed
        if (paymentStatus !== apiStatus) {
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
              where: { id: order.id },
              data: {
                paymentStatus: 'COMPLETED',
                status: order.status === 'PENDING' ? 'PROCESSING' : order.status,
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
            channel: result.status.channel || payment.channel,
            transactionDate: result.status.date || payment.transactionDate,
            paymentId: result.status.pay_id || payment.paymentId,
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: apiStatus === 'COMPLETED' ? 'PROCESSING' : order.status,
            paymentStatus: apiStatus,
          },
        });
      }
    } catch (apiError) {
      console.error('[API] PaiementPro status check error:', apiError);
      // Continue with database status if API fails
    }

    // Return database status
    return NextResponse.json({
      success: true,
      payment: {
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        channel: payment.channel,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error('[API] Order payment status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}
