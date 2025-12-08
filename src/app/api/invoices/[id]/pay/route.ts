/**
 * Invoice Payment API
 * POST /api/invoices/[id]/pay
 *
 * Initialize PaiementPro payment for an invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaiementProClient } from '@/lib/paiementpro/client';
import { generateReference, formatPhoneNumber } from '@/lib/paiementpro/utils';
import { PaymentChannel } from '@/lib/paiementpro/types';

export const dynamic = 'force-dynamic';

interface PayInvoiceRequest {
  channel?: PaymentChannel;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session (optional - invoices can be paid by anyone with the link)
    const session = await getServerSession(authOptions);
    const invoiceId = params.id;

    // Parse request body
    const body: PayInvoiceRequest = await request.json();

    // Get invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Verify invoice can be paid
    if (invoice.status !== 'SENT') {
      const statusMessages: Record<string, string> = {
        DRAFT: 'Cette facture est encore en brouillon',
        PAID: 'Cette facture a déjà été payée',
        OVERDUE: 'Cette facture est en retard',
        CANCELLED: 'Cette facture a été annulée',
        REFUNDED: 'Cette facture a été remboursée',
      };
      return NextResponse.json(
        { success: false, error: statusMessages[invoice.status] || 'Facture non payable' },
        { status: 400 }
      );
    }

    if (invoice.total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant de la facture doit être supérieur à 0' },
        { status: 400 }
      );
    }

    // Generate reference with INV_ prefix for webhook identification
    const reference = generateReference('INV');

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cechemoi.com';

    // Create PaiementPro client with invoice-specific return URL
    const client = new PaiementProClient({
      merchantId: process.env.PAIEMENTPRO_MERCHANT_ID!,
      credentialId: process.env.PAIEMENTPRO_CREDENTIAL_ID!,
      currencyCode: process.env.PAIEMENTPRO_CURRENCY_CODE || '952',
      notificationURL: `${baseUrl}/api/payments/paiementpro/webhook`,
      returnURL: `${baseUrl}/invoice-payment/success`,
    });

    // Format customer info
    const customerPhone = invoice.customerPhone
      ? formatPhoneNumber(invoice.customerPhone)
      : '0000000000';
    const nameParts = invoice.customerName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Generate email if not present
    const customerEmail = invoice.customerEmail || `invoice+${customerPhone}@cechemoi.com`;

    // Initialize payment
    const result = await client.initializePayment({
      amount: invoice.total,
      customerEmail,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerPhoneNumber: customerPhone,
      referenceNumber: reference,
      channel: body.channel,
      description: `Paiement Facture ${invoice.invoiceNumber}`,
      returnContext: {
        type: 'invoice_payment',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.orderId || '',
      },
    });

    if (result.success && result.paymentUrl) {
      // Create pending InvoicePayment record
      await prisma.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: invoice.total,
          paymentMethod: 'PAIEMENTPRO',
          reference,
          provider: 'PAIEMENTPRO',
          providerRef: reference,
          createdById: (session?.user as any)?.id || null,
          notes: `Paiement initié - Canal: ${body.channel || 'choix utilisateur'}`,
        },
      });

      console.log('[Invoice Pay API] Payment initialized:', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        reference,
        amount: invoice.total,
        channel: body.channel || 'user_choice',
      });

      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        reference,
      });
    }

    console.error('[Invoice Pay API] Initialization failed:', result.error);
    return NextResponse.json(
      { success: false, error: result.error || 'Échec de l\'initialisation du paiement' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Invoice Pay API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      },
      { status: 500 }
    );
  }
}
