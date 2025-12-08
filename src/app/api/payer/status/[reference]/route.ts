/**
 * API Route: Check payment status (PUBLIC - for /payer test page)
 * GET /api/payer/status/[reference]
 *
 * No authentication required - directly calls PaiementPro API
 */

import { NextRequest, NextResponse } from 'next/server';

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

    // Call PaiementPro status API directly
    const response = await fetch(`${STATUS_API_URL}/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const status = await response.json();

    console.log('[Payer Status API] Result:', {
      reference: status.reference,
      success: status.success,
      channel: status.channel,
      amount: status.amount,
    });

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[Payer Status API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
