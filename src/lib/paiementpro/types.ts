/**
 * PaiementPro Type Definitions for CAVE EXPRESS
 * West African Payment Gateway Integration
 */

export const PAYMENT_CHANNELS = {
  // Côte d'Ivoire
  OMCIV2: 'OMCIV2',
  MOMOCI: 'MOMOCI',
  FLOOZ: 'FLOOZ',
  WAVECI: 'WAVECI',

  // Burkina Faso
  OMBF: 'OMBF',

  // Mali
  OMML: 'OMML',

  // Benin
  MOMOBJ: 'MOMOBJ',
  FLOOZBJ: 'FLOOZBJ',

  // Niger
  AIRTELNG: 'AIRTELNG',

  // Senegal
  OMSN: 'OMSN',
  WAVESN: 'WAVESN',

  // Guinee Bissau
  OMGN: 'OMGN',

  // Cameroun
  OMCM: 'OMCM',
  MOMOCM: 'MOMOCM',

  // Togo
  MOOTG: 'MOOTG',
  TOGOCEL: 'TOGOCEL',

  // International
  CARD: 'CARD',
  PAYPAL: 'PAYPAL',
} as const;

export type PaymentChannel = keyof typeof PAYMENT_CHANNELS;

export interface PaymentInitParams {
  amount: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhoneNumber: string;
  referenceNumber?: string;
  description?: string;
  channel?: PaymentChannel;
  customerId?: string;
  returnContext?: Record<string, any>;
}

export interface PaiementProInitRequest {
  merchantId: string;
  countryCurrencyCode?: string;
  referenceNumber: string;
  amount: number;
  channel?: PaymentChannel;
  customerId?: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastname: string; // Note: lowercase 'n' as per PaiementPro API
  customerPhoneNumber: string;
  description?: string;
  notificationURL: string;
  returnURL: string;
  returnContext?: string;
  hashcode?: string;
}

export interface PaiementProInitResponse {
  Code: number;
  Description: string;
  Sessionid: string | null;
}

export interface PaymentNotification {
  merchantId: string;
  countryCurrencyCode: string;
  referenceNumber: string;
  amount: number;
  transactiondt: string;
  customerId?: string;
  returnContext?: string;
  responsecode: number;
  hashcode: string;
}

export interface PaymentStatus {
  marchant_id: string; // Note: API uses "marchant" (typo in their API)
  pay_id: string;
  reference: string;
  amount: number;
  channel: string;
  token: string;
  date: string;
  success: boolean;
}

export interface PaymentResult {
  success: boolean;
  reference: string;
  amount: number;
  channel?: string;
  transactionDate?: string;
  paymentId?: string;
}
