/**
 * PaiementPro Client for CAVE EXPRESS
 * Uses JSON API (like the official JS SDK)
 */

import {
  PaymentInitParams,
  PaymentStatus,
} from './types';
import {
  generateReference,
  formatPhoneNumber,
  formatAmount,
} from './utils';

// JSON API endpoint (from official JS SDK paiementpro.v1.0.1.js)
const INIT_API_URL = 'https://www.paiementpro.net/webservice/onlinepayment/js/initialize/initialize.php';
const STATUS_API_URL = 'https://api.paiementpro.net/status';

export class PaiementProClient {
  private merchantId: string;
  private credentialId: string;
  private currencyCode: string;
  private notificationURL: string;
  private returnURL: string;

  constructor(config: {
    merchantId: string;
    credentialId: string;
    currencyCode?: string;
    notificationURL: string;
    returnURL: string;
  }) {
    this.merchantId = config.merchantId;
    this.credentialId = config.credentialId;
    this.currencyCode = config.currencyCode || '952'; // XOF/CFA by default
    this.notificationURL = config.notificationURL;
    this.returnURL = config.returnURL;
  }

  /**
   * Initialize a payment transaction using JSON API (like official JS SDK)
   */
  async initializePayment(params: PaymentInitParams): Promise<{
    success: boolean;
    sessionId?: string;
    paymentUrl?: string;
    reference: string;
    error?: string;
  }> {
    const reference = params.referenceNumber || generateReference('CAVE');

    try {
      // Build request body EXACTLY like the official JS SDK
      const requestBody = {
        merchantId: this.merchantId,
        amount: formatAmount(params.amount),
        description: params.description || 'Paiement en ligne',
        channel: params.channel || '',
        countryCurrencyCode: this.currencyCode,
        referenceNumber: reference,
        customerEmail: params.customerEmail,
        customerFirstName: params.customerFirstName,
        customerLastname: params.customerLastName, // lowercase 'n' - from JS SDK
        customerPhoneNumber: formatPhoneNumber(params.customerPhoneNumber),
        notificationURL: this.notificationURL,
        returnURL: this.returnURL,
        returnContext: params.returnContext
          ? Object.entries(params.returnContext).map(([k, v]) => `${k}=${v}`).join('&')
          : '',
      };

      console.log('[PaiementPro] Initializing payment via JSON API:', requestBody);

      // Use JSON API like official JS SDK
      const response = await fetch(INIT_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('[PaiementPro] JSON API Response:', data);

      if (data.success && data.url) {
        return {
          success: true,
          paymentUrl: data.url,
          reference,
        };
      }

      return {
        success: false,
        reference,
        error: data.message || data.error || 'Initialization failed',
      };
    } catch (error: any) {
      console.error('[PaiementPro] Initialization error:', error);

      return {
        success: false,
        reference,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(reference: string): Promise<{
    success: boolean;
    status?: PaymentStatus;
    error?: string;
  }> {
    try {
      console.log('[PaiementPro] Checking status for:', reference);

      const response = await fetch(`${STATUS_API_URL}/${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status: PaymentStatus = await response.json();

      console.log('[PaiementPro] Status check result:', {
        reference: status.reference,
        success: status.success,
        channel: status.channel,
      });

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error('[PaiementPro] Status check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payment URL for direct redirect
   */
  getPaymentUrl(sessionId: string): string {
    return `https://www.paiementpro.net/webservice/onlinepayment/processing_v2.php?sessionid=${sessionId}`;
  }

  /**
   * Get channel selection URL (if no channel specified)
   */
  getChannelSelectionUrl(): string {
    return 'https://www.paiementpro.net/webservice/onlinepayment/v2/paychannel.php';
  }
}

// Export singleton instance
let clientInstance: PaiementProClient | null = null;

export function getPaiementProClient(): PaiementProClient {
  if (!clientInstance) {
    if (!process.env.PAIEMENTPRO_MERCHANT_ID) {
      throw new Error('PAIEMENTPRO_MERCHANT_ID is not configured');
    }
    if (!process.env.PAIEMENTPRO_CREDENTIAL_ID) {
      throw new Error('PAIEMENTPRO_CREDENTIAL_ID is not configured');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cave-express.ci';

    clientInstance = new PaiementProClient({
      merchantId: process.env.PAIEMENTPRO_MERCHANT_ID,
      credentialId: process.env.PAIEMENTPRO_CREDENTIAL_ID,
      currencyCode: process.env.PAIEMENTPRO_CURRENCY_CODE || '952',
      notificationURL:
        process.env.PAIEMENTPRO_NOTIFICATION_URL ||
        `${baseUrl}/api/payments/paiementpro/webhook`,
      returnURL:
        process.env.PAIEMENTPRO_RETURN_URL || `${baseUrl}/payment/success`,
    });
  }

  return clientInstance;
}
