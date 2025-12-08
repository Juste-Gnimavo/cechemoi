/**
 * PaiementPro Webhook Handler
 * POST /api/payments/paiementpro/webhook
 *
 * Receives payment notifications from PaiementPro
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentNotification } from '@/lib/paiementpro/types';
import { verifyHashcode } from '@/lib/paiementpro/utils';
import { notificationService } from '@/lib/notification-service';


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body: PaymentNotification = await request.json();

    console.log('[Webhook] Payment notification received:', {
      reference: body.referenceNumber,
      responsecode: body.responsecode,
      amount: body.amount,
      transactiondt: body.transactiondt,
    });

    // Verify hashcode if secret is configured
    if (process.env.PAIEMENTPRO_SECRET && body.hashcode) {
      const isValid = verifyHashcode(
        body,
        body.hashcode,
        process.env.PAIEMENTPRO_SECRET
      );

      if (!isValid) {
        console.error('[Webhook] Invalid hashcode in payment notification');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    // Find payment by reference - first check regular payments, then standalone
    const payment = await prisma.payment.findUnique({
      where: { reference: body.referenceNumber },
      include: {
        order: {
          include: {
            user: true,
            shippingAddress: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    // If not found in regular payments, check standalone payments
    if (!payment) {
      const standalonePayment = await prisma.standalonePayment.findUnique({
        where: { reference: body.referenceNumber },
      });

      if (standalonePayment) {
        // Handle standalone payment
        const isSuccess = body.responsecode === 0;
        const newStatus = isSuccess ? 'COMPLETED' : 'FAILED';

        console.log('[Webhook] Processing standalone payment:', {
          reference: standalonePayment.reference,
          currentStatus: standalonePayment.status,
          newStatus,
        });

        // Update standalone payment status
        // Cast to any to access additional webhook fields not in PaymentNotification type
        const webhookData = body as any;
        await prisma.standalonePayment.update({
          where: { id: standalonePayment.id },
          data: {
            status: newStatus,
            paidAt: isSuccess ? new Date() : null,
            webhookReceived: true,
            webhookReceivedAt: new Date(),
            providerResponse: webhookData,
            paymentId: webhookData.payid || null,
            channel: webhookData.channel || standalonePayment.channel,
            errorMessage: isSuccess ? null : (webhookData.responsemsg || 'Payment failed'),
          },
        });

        // Send notification for standalone payment
        const { sendStandalonePaymentNotification } = await import('@/lib/notifications/standalone-payment');
        sendStandalonePaymentNotification(standalonePayment.id, isSuccess).catch((error) => {
          console.error('[Webhook] Failed to send standalone payment notification:', error);
        });

        console.log(`[Webhook] Standalone payment ${isSuccess ? 'successful' : 'failed'}`);

        return NextResponse.json({
          success: true,
          message: 'Standalone payment notification processed',
          paymentStatus: newStatus,
        });
      }

      // Check for invoice-only payments (reference starts with INV_)
      if (body.referenceNumber.startsWith('INV_')) {
        const invoicePayment = await prisma.invoicePayment.findFirst({
          where: { reference: body.referenceNumber },
          include: {
            invoice: {
              include: {
                order: true,
              },
            },
          },
        });

        if (invoicePayment) {
          const isSuccess = body.responsecode === 0;
          const webhookData = body as any;

          console.log('[Webhook] Processing invoice payment:', {
            invoiceId: invoicePayment.invoiceId,
            invoiceNumber: invoicePayment.invoice.invoiceNumber,
            isSuccess,
          });

          if (isSuccess) {
            // Update invoice status to PAID
            await prisma.invoice.update({
              where: { id: invoicePayment.invoiceId },
              data: {
                status: 'PAID',
                paidDate: new Date(),
                amountPaid: invoicePayment.invoice.total,
              },
            });

            // Update invoice payment record
            await prisma.invoicePayment.update({
              where: { id: invoicePayment.id },
              data: {
                providerRef: webhookData.payid || body.referenceNumber,
                paidAt: new Date(),
                notes: `Paiement confirmé via webhook - Canal: ${webhookData.channel || 'N/A'}`,
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

              console.log('[Webhook] Linked order updated to COMPLETED:', invoicePayment.invoice.orderId);
            }

            console.log('[Webhook] Invoice payment successful, invoice marked as PAID');
          } else {
            // Payment failed - just log, don't change invoice status
            console.log('[Webhook] Invoice payment failed:', body.referenceNumber);
          }

          return NextResponse.json({
            success: true,
            message: 'Invoice payment notification processed',
            paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED',
          });
        }
      }

      console.error('[Webhook] Payment not found:', body.referenceNumber);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Determine payment success
    const isSuccess = body.responsecode === 0;
    const newStatus = isSuccess ? 'COMPLETED' : 'FAILED';

    console.log('[Webhook] Processing payment:', {
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      currentStatus: payment.status,
      newStatus,
    });

    // Parse returnContext if provided
    let returnContext;
    if (body.returnContext) {
      try {
        returnContext = JSON.parse(body.returnContext);
      } catch (e) {
        console.warn('[Webhook] Failed to parse returnContext:', e);
      }
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        transactionDate: new Date(body.transactiondt),
        webhookReceived: true,
        webhookReceivedAt: new Date(),
        providerResponse: body as any,
      },
    });

    // Update order status
    if (isSuccess) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'PROCESSING', // Move order to processing
        },
      });

      // Update invoice status to PAID
      const invoice = await prisma.invoice.findFirst({
        where: { orderId: payment.orderId },
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID', paidDate: new Date() },
        });
      }

      // Build invoice URL for notification
      const baseUrl = process.env.NEXTAUTH_URL || 'https://cave-express.ci';
      const invoiceUrl = invoice
        ? `${baseUrl}/api/invoices/${invoice.id}/pdf`
        : `${baseUrl}/account/orders/${payment.order.id}`;

      // Send payment confirmation notifications (don't await to avoid blocking)
      Promise.all([
        notificationService.sendPaymentReceived(payment.order.id, invoiceUrl),
        notificationService.sendPaymentReceivedAdmin(payment.order.id),
        // Send INVOICE_PAID notification with invoice link
        notificationService.sendInvoicePaid(payment.order.id, invoiceUrl),
        // Send Invoice PDF attachment via WhatsApp
        notificationService.sendInvoicePdfPaid(payment.order.id, invoiceUrl),
        // Cancel scheduled payment reminders since payment is done
        notificationService.cancelPaymentReminders(payment.order.id),
      ]).catch((notifError) => {
        console.error('[Webhook] Failed to send payment confirmation:', notifError);
      });

      console.log('[Webhook] Payment successful, order moved to PROCESSING');
    } else {
      // Payment failed - update order and restore stock
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      // Restore stock for failed payment
      for (const item of payment.order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'return',
            quantity: item.quantity,
            previousStock: item.product.stock,
            newStock: item.product.stock + item.quantity,
            reference: payment.order.orderNumber,
            reason: 'Payment failed - stock restored',
            notes: `Payment reference: ${payment.reference}`,
            performedBy: 'system',
            performedByName: 'System (Payment Failure)',
          },
        });
      }

      // Send payment failed notification (don't await to avoid blocking)
      notificationService.sendPaymentFailed(payment.order.id).catch((notifError) => {
        console.error('[Webhook] Failed to send payment failed notification:', notifError);
      })

      console.log('[Webhook] Payment failed, order marked as FAILED and stock restored');
    }

    return NextResponse.json({
      success: true,
      message: 'Notification processed',
      paymentStatus: newStatus,
    });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
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
