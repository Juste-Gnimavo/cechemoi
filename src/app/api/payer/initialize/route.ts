/**
 * API Route: Initialize standalone payment
 * POST /api/payer/initialize
 *
 * No authentication required - standalone payment flow
 * Records payment in database for tracking and admin visibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaiementProClient } from '@/lib/paiementpro/client';
import { generateReference, formatPhoneNumber } from '@/lib/paiementpro/utils';
import { PaymentChannel } from '@/lib/paiementpro/types';
import { prisma } from '@/lib/prisma';

interface InitializePaymentRequest {
  amount: number;
  customerName: string;
  customerPhone: string;
  channel?: PaymentChannel;
}

export async function POST(request: NextRequest) {
  try {
    const body: InitializePaymentRequest = await request.json();

    // Validation
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Montant invalide' },
        { status: 400 }
      );
    }

    if (!body.customerName || body.customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nom invalide' },
        { status: 400 }
      );
    }

    if (!body.customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(body.customerPhone);
    if (formattedPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Generate email from phone
    const email = `contact+${formattedPhone}@cave-express.ci`;

    // Parse name
    const nameParts = body.customerName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Generate unique reference with PRODUIT prefix
    const reference = generateReference('PRODUIT');

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cave-express.ci';

    // Create PaiementPro client with custom return URL for /payer
    const client = new PaiementProClient({
      merchantId: process.env.PAIEMENTPRO_MERCHANT_ID!,
      credentialId: process.env.PAIEMENTPRO_CREDENTIAL_ID!,
      currencyCode: process.env.PAIEMENTPRO_CURRENCY_CODE || '952',
      notificationURL: `${baseUrl}/api/payments/paiementpro/webhook`,
      returnURL: `${baseUrl}/payer/success`,
    });

    // Initialize payment
    const result = await client.initializePayment({
      amount: body.amount,
      customerEmail: email,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerPhoneNumber: formattedPhone,
      referenceNumber: reference,
      channel: body.channel,
      description: `Paiement test - ${body.amount} FCFA`,
      returnContext: {
        type: 'test_payment',
        amount: body.amount,
        customerName: body.customerName,
        customerPhone: formattedPhone,
      },
    });

    if (result.success && result.paymentUrl) {
      // Create StandalonePayment record in database
      await prisma.standalonePayment.create({
        data: {
          reference: result.reference || reference,
          amount: body.amount,
          customerName: body.customerName.trim(),
          customerPhone: formattedPhone,
          channel: body.channel || null,
          status: 'PENDING',
          sessionId: result.sessionId,
        },
      });

      console.log('[Payer API] Payment initialized and recorded:', {
        reference: result.reference,
        amount: body.amount,
        channel: body.channel || 'user_choice',
      });

      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        reference: result.reference,
        sessionId: result.sessionId,
      });
    }

    console.error('[Payer API] Initialization failed:', result.error);
    return NextResponse.json(
      { success: false, error: result.error || 'Échec de l\'initialisation' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Payer API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne'
      },
      { status: 500 }
    );
  }
}
