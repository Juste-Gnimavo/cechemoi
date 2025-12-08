/**
 * PaiementPro Utility Functions for CÈCHÉMOI
 */

import crypto from 'crypto';

/**
 * Generate a unique reference number for transactions
 * Format: PREFIX-TIMESTAMP-RANDOM
 */
export function generateReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate hashcode for security
 * PaiementPro uses HMAC-SHA256 for request signing
 */
export function generateHashcode(
  data: Record<string, any>,
  secret: string
): string {
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map((key) => `${key}=${data[key]}`).join('&');
  return crypto.createHmac('sha256', secret).update(concatenated).digest('hex');
}

/**
 * Verify hashcode from notification webhook
 */
export function verifyHashcode(
  notification: Record<string, any>,
  receivedHash: string,
  secret: string
): boolean {
  const { hashcode, ...data } = notification;
  const calculatedHash = generateHashcode(data, secret);
  return calculatedHash === receivedHash;
}

/**
 * Format phone number for PaiementPro
 * Expects international format without + (e.g., 2250709757296)
 * Ivory Coast numbers: 10 digits starting with 0, international = 225 + full number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If number starts with 0 and is 10 digits (Ivory Coast local format), add country code
  // Keep the leading 0: 0709757296 → 2250709757296
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '225' + cleaned; // Don't remove the 0!
  }

  return cleaned;
}

/**
 * Format amount to minor units (no decimal places for XOF)
 * XOF (West African CFA Franc) has no subdivisions
 */
export function formatAmount(amount: number): number {
  // For XOF, just round to nearest whole number
  return Math.round(amount);
}

/**
 * Parse amount from API response
 */
export function parseAmount(amount: number): number {
  return amount;
}

/**
 * Get channel display name
 */
export function getChannelDisplayName(channel: string): string {
  const channelNames: Record<string, string> = {
    OMCIV2: 'Orange Money CI',
    MOMOCI: 'MTN Mobile Money CI',
    FLOOZ: 'Moov Money CI',
    WAVECI: 'Wave CI',
    OMBF: 'Orange Money BF',
    OMML: 'Orange Money Mali',
    MOMOBJ: 'MTN Mobile Money Benin',
    FLOOZBJ: 'Moov Money Benin',
    AIRTELNG: 'Airtel Niger',
    OMSN: 'Orange Money Senegal',
    WAVESN: 'Wave Senegal',
    OMGN: 'Orange Guinee Bissau',
    OMCM: 'Orange Money Cameroun',
    MOMOCM: 'MTN Mobile Money Cameroun',
    MOOTG: 'Flooz Togo',
    TOGOCEL: 'Togo Cel',
    CARD: 'Visa/Mastercard',
    PAYPAL: 'PayPal',
  };

  return channelNames[channel] || channel;
}

/**
 * Map PaiementPro channel codes to our internal payment method
 */
export function mapChannelToPaymentMethod(channel?: string): string {
  if (!channel) return 'PAIEMENTPRO';

  const channelMap: Record<string, string> = {
    OMCIV2: 'ORANGE_MONEY',
    MOMOCI: 'MTN_MOBILE_MONEY',
    FLOOZ: 'MTN_MOBILE_MONEY', // Moov
    WAVECI: 'WAVE',
    WAVESN: 'WAVE',
    CARD: 'STRIPE', // Credit cards
  };

  return channelMap[channel] || 'PAIEMENTPRO';
}
