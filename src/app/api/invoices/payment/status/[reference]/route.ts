/**
 * Invoice Payment Status API
 * GET /api/invoices/payment/status/[reference]
 *
 * Check payment status and update invoice if successful
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STATUS_API_URL = 'https://api.paiementpro.net/status';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Find the invoice payment by reference
    const invoicePayment = await prisma.invoicePayment.findFirst({
      where: { reference },
      include: {
        invoice: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!invoicePayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if invoice is already paid
    if (invoicePayment.invoice.status === 'PAID') {
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        invoice: {
          id: invoicePayment.invoice.id,
          invoiceNumber: invoicePayment.invoice.invoiceNumber,
          status: invoicePayment.invoice.status,
          total: invoicePayment.invoice.total,
        },
        order: invoicePayment.invoice.order
          ? {
              id: invoicePayment.invoice.order.id,
              orderNumber: invoicePayment.invoice.order.orderNumber,
            }
          : null,
        payment: {
          reference: invoicePayment.reference,
          amount: invoicePayment.amount,
          paidAt: invoicePayment.paidAt,
        },
      });
    }

    // Call PaiementPro status API
    const response = await fetch(`${STATUS_API_URL}/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Payment still pending or not found in PaiementPro
      return NextResponse.json({
        success: true,
        status: 'PENDING',
        invoice: {
          id: invoicePayment.invoice.id,
          invoiceNumber: invoicePayment.invoice.invoiceNumber,
          status: invoicePayment.invoice.status,
          total: invoicePayment.invoice.total,
        },
        order: invoicePayment.invoice.order
          ? {
              id: invoicePayment.invoice.order.id,
              orderNumber: invoicePayment.invoice.order.orderNumber,
            }
          : null,
        payment: {
          reference: invoicePayment.reference,
          amount: invoicePayment.amount,
        },
      });
    }

    const paiementProStatus = await response.json();

    console.log('[Invoice Payment Status] PaiementPro response:', {
      reference: paiementProStatus.reference,
      success: paiementProStatus.success,
      channel: paiementProStatus.channel,
    });

    // Determine payment status
    const isSuccess = paiementProStatus.success === true;
    const isFailed = paiementProStatus.success === false;

    if (isSuccess) {
      // Update invoice status to PAID
      await prisma.invoice.update({
        where: { id: invoicePayment.invoice.id },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          amountPaid: invoicePayment.invoice.total,
        },
      });

      // Update invoice payment with provider details
      await prisma.invoicePayment.update({
        where: { id: invoicePayment.id },
        data: {
          providerRef: paiementProStatus.transactionId || reference,
          paidAt: new Date(),
          notes: `Paiement confirmé - Canal: ${paiementProStatus.channel || 'N/A'}`,
        },
      });

      // If invoice has linked order, update order payment status
      if (invoicePayment.invoice.orderId) {
        await prisma.order.update({
          where: { id: invoicePayment.invoice.orderId },
          data: {
            paymentStatus: 'COMPLETED',
            status: 'PROCESSING',
          },
        });

        console.log('[Invoice Payment Status] Order updated to COMPLETED:', invoicePayment.invoice.orderId);
      }

      console.log('[Invoice Payment Status] Invoice marked as PAID:', invoicePayment.invoice.id);

      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        invoice: {
          id: invoicePayment.invoice.id,
          invoiceNumber: invoicePayment.invoice.invoiceNumber,
          status: 'PAID',
          total: invoicePayment.invoice.total,
        },
        order: invoicePayment.invoice.order
          ? {
              id: invoicePayment.invoice.order.id,
              orderNumber: invoicePayment.invoice.order.orderNumber,
            }
          : null,
        payment: {
          reference: invoicePayment.reference,
          amount: invoicePayment.amount,
          channel: paiementProStatus.channel,
          paidAt: new Date().toISOString(),
        },
      });
    }

    if (isFailed) {
      return NextResponse.json({
        success: true,
        status: 'FAILED',
        invoice: {
          id: invoicePayment.invoice.id,
          invoiceNumber: invoicePayment.invoice.invoiceNumber,
          status: invoicePayment.invoice.status,
          total: invoicePayment.invoice.total,
        },
        order: invoicePayment.invoice.order
          ? {
              id: invoicePayment.invoice.order.id,
              orderNumber: invoicePayment.invoice.order.orderNumber,
            }
          : null,
        payment: {
          reference: invoicePayment.reference,
          amount: invoicePayment.amount,
        },
      });
    }

    // Still pending
    return NextResponse.json({
      success: true,
      status: 'PENDING',
      invoice: {
        id: invoicePayment.invoice.id,
        invoiceNumber: invoicePayment.invoice.invoiceNumber,
        status: invoicePayment.invoice.status,
        total: invoicePayment.invoice.total,
      },
      order: invoicePayment.invoice.order
        ? {
            id: invoicePayment.invoice.order.id,
            orderNumber: invoicePayment.invoice.order.orderNumber,
          }
        : null,
      payment: {
        reference: invoicePayment.reference,
        amount: invoicePayment.amount,
      },
    });
  } catch (error) {
    console.error('[Invoice Payment Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
