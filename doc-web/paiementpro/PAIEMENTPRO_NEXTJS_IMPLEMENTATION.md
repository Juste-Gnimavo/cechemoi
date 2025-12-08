# PaiementPro Next.js Integration Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [API Analysis](#api-analysis)
3. [Architecture](#architecture)
4. [Implementation Guide](#implementation-guide)
5. [Complete Code Examples](#complete-code-examples)
6. [Testing & Debugging](#testing--debugging)

---

## 🎯 Overview

PaiementPro is a West African payment gateway supporting multiple payment channels across multiple countries. This guide provides a complete implementation for Next.js 14+ with App Router.

### Supported Payment Channels

```typescript
const PAYMENT_CHANNELS = {
  // Côte d'Ivoire
  OMCIV2: 'Orange CI',
  MOMOCI: 'MTN CI',
  FLOOZ: 'Moov CI',
  WAVECI: 'Wave CI',
  
  // Burkina Faso
  OMBF: 'Orange BF',
  
  // Mali
  OMML: 'Orange Mali',
  
  // Benin
  MOMOBJ: 'MTN Benin',
  FLOOZBJ: 'Moov Benin',
  
  // Niger
  AIRTELNG: 'Airtel Niger',
  
  // Senegal
  OMSN: 'Orange Senegal',
  WAVESN: 'Wave Senegal',
  
  // Guinee Bissau
  OMGN: 'Orange Guinee Bissau',
  
  // Cameroun
  OMCM: 'Orange Cameroun',
  MOMOCM: 'MTN Cameroun',
  
  // Togo
  MOOTG: 'Flooz Togo',
  TOGOCEL: 'Togo Cel',
  
  // International
  CARD: 'Visa/Mastercard (Worldwide)',
  PAYPAL: 'PayPal (Worldwide)'
} as const;
```

---

## 🔍 API Analysis

### 1. Initialization API (Server-to-Server)

**Endpoint:** SOAP Web Service  
**URL:** `https://www.paiementpro.net/webservice/OnlineServicePayment_v2.php?wsdl`  
**Method:** `initTransact`

#### Required Parameters:
```typescript
interface InitTransactParams {
  merchantId: string;              // from .env can be changed. Your merchant ID (e.g., "PP-F105")
  referenceNumber: string;         // Unique transaction reference
  amount: number;                  // Amount in minor units (e.g., 1000 = 10.00 XOF)
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhoneNumber: string;     // Format: 22507517917
  notificationURL: string;         // Webhook for payment status
  returnURL: string;               // Redirect after payment
  hashcode?: string;               // Security hash (optional but recommended)
}
```

#### Optional Parameters:
```typescript
interface OptionalParams {
  countryCurrencyCode?: string;    // Default: "952" (XOF/CFA)
  channel?: PaymentChannel;        // If not set, user selects on payment page
  customerId?: string;
  description?: string;
  returnContext?: string;          // Custom data to be returned
}
```

#### Response:
```typescript
interface InitTransactResponse {
  Code: number;        // 0 = Success, 10 = Insufficient params, 11 = Unknown merchant, -1 = Error
  Description: string;
  Sessionid: string | null;  // Use this for redirection
}
```

### 2. Payment Processing (Client-Side Redirect)

**URL:** `https://paiementpro.net/webservice/onlinepayment/processing_v2.php?sessionid={sessionId}`

If no channel specified:  
**Channel Selection URL:** `https://www.paiementpro.net/webservice/onlinepayment/v2/paychannel.php`

### 3. Notification Webhook (Server-to-Server Callback)

PaiementPro sends POST to your `notificationURL`:

```typescript
interface PaymentNotification {
  merchantId: string;
  countryCurrencyCode: string;
  referenceNumber: string;
  amount: number;
  transactiondt: string;         // Date format: "2023-01-31 13:20:51"
  customerId?: string;
  returnContext?: string;
  responsecode: number;          // 0 = Success, -1 = Failed
  hashcode: string;
}
```

### 4. Status Check API (Server-to-Server)

**Endpoint:** `https://api.paiementpro.net/status/{reference}`  
**Method:** `GET`

#### Response:
```typescript
interface StatusCheckResponse {
  marchant_id: string;           // Note: API uses "marchant" (typo in their API)
  pay_id: string;                // e.g., "CI2023013113165473"
  reference: string;
  amount: number;
  channel: string;
  token: string;
  date: string;
  success: boolean;
}
```

### 5. JavaScript SDK (Alternative Client-Side Approach)

**Script URL:** `https://www.paiementpro.net/webservice/onlinepayment/js/paiementpro.v1.0.1.js`

```typescript
// Usage
const paiementPro = new PaiementPro('MERCHANT_ID');
paiementPro.amount = 1000;
paiementPro.channel = 'CARD';
// ... set other properties
await paiementPro.getUrlPayment();
if (paiementPro.success) {
  window.location = paiementPro.url;
}
```

---

## 🏗️ Architecture

### Recommended Next.js Architecture

```
app/
├── api/
│   ├── payments/
│   │   ├── initialize/
│   │   │   └── route.ts          # Initialize payment session
│   │   ├── webhook/
│   │   │   └── route.ts          # Handle PaiementPro notifications
│   │   └── status/
│   │       └── [reference]/
│   │           └── route.ts      # Check payment status
├── payment/
│   ├── page.tsx                  # Payment initiation page
│   ├── processing/
│   │   └── page.tsx              # Payment processing page
│   ├── success/
│   │   └── page.tsx              # Success page
│   └── failed/
│       └── page.tsx              # Failed page
lib/
├── paiementpro/
│   ├── client.ts                 # PaiementPro client
│   ├── types.ts                  # TypeScript types
│   ├── utils.ts                  # Helper functions
│   └── constants.ts              # Constants and configs
```

---

## 🚀 Implementation Guide

### Step 1: Environment Variables

Create `.env.local`:

```bash
# PaiementPro Configuration
PAIEMENTPRO_MERCHANT_ID=PP-F105
PAIEMENTPRO_API_KEY=your_api_key_here
PAIEMENTPRO_SECRET=your_secret_key_here

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAIEMENTPRO_NOTIFICATION_URL=${NEXT_PUBLIC_APP_URL}/api/payments/webhook
PAIEMENTPRO_RETURN_URL=${NEXT_PUBLIC_APP_URL}/payment/success

# Currency (XOF = 952, other codes as needed)
PAIEMENTPRO_CURRENCY_CODE=952
```

### Step 2: Install Dependencies

```bash
npm install soap crypto uuid
npm install -D @types/node
```

### Step 3: Create Type Definitions

**File:** `lib/paiementpro/types.ts`

```typescript
export const PAYMENT_CHANNELS = {
  OMCIV2: 'OMCIV2',
  MOMOCI: 'MOMOCI',
  FLOOZ: 'FLOOZ',
  OMBF: 'OMBF',
  OMML: 'OMML',
  MOMOBJ: 'MOMOBJ',
  FLOOZBJ: 'FLOOZBJ',
  AIRTELNG: 'AIRTELNG',
  WAVECI: 'WAVECI',
  OMSN: 'OMSN',
  PAYPAL: 'PAYPAL',
  OMGN: 'OMGN',
  OMCM: 'OMCM',
  WAVESN: 'WAVESN',
  MOOTG: 'MOOTG',
  TOGOCEL: 'TOGOCEL',
  MOMOCM: 'MOMOCM',
  CARD: 'CARD',
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
  customerLastName: string;
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
  marchant_id: string;
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
```

### Step 4: Create Utility Functions

**File:** `lib/paiementpro/utils.ts`

```typescript
import crypto from 'crypto';

/**
 * Generate a unique reference number
 */
export function generateReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate hashcode for security
 * Note: PaiementPro documentation doesn't specify the exact hash algorithm
 * Contact PaiementPro support for the correct implementation
 */
export function generateHashcode(data: Record<string, any>, secret: string): string {
  // This is a generic implementation - adjust based on PaiementPro's specification
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
  return crypto
    .createHmac('sha256', secret)
    .update(concatenated)
    .digest('hex');
}

/**
 * Verify hashcode from notification
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
 * Expects international format without + (e.g., 22507517917)
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format amount to minor units (cents)
 * PaiementPro expects amounts in smallest currency unit
 */
export function formatAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Parse amount from minor units
 */
export function parseAmount(amount: number): number {
  return amount / 100;
}
```

### Step 5: Create PaiementPro Client

**File:** `lib/paiementpro/client.ts`

```typescript
import soap from 'soap';
import {
  PaymentInitParams,
  PaiementProInitRequest,
  PaiementProInitResponse,
  PaymentStatus,
  PaymentChannel,
} from './types';
import { generateReference, generateHashcode, formatPhoneNumber } from './utils';

const SOAP_URL = 'https://www.paiementpro.net/webservice/OnlineServicePayment_v2.php?wsdl';
const STATUS_API_URL = 'https://api.paiementpro.net/status';
const PAYMENT_URL = 'https://paiementpro.net/webservice/onlinepayment/processing_v2.php';

export class PaiementProClient {
  private merchantId: string;
  private secret: string;
  private currencyCode: string;
  private notificationURL: string;
  private returnURL: string;

  constructor(config: {
    merchantId: string;
    secret: string;
    currencyCode?: string;
    notificationURL: string;
    returnURL: string;
  }) {
    this.merchantId = config.merchantId;
    this.secret = config.secret;
    this.currencyCode = config.currencyCode || '952'; // XOF/CFA by default
    this.notificationURL = config.notificationURL;
    this.returnURL = config.returnURL;
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(params: PaymentInitParams): Promise<{
    success: boolean;
    sessionId?: string;
    paymentUrl?: string;
    reference: string;
    error?: string;
  }> {
    try {
      const reference = params.referenceNumber || generateReference();
      
      const requestData: PaiementProInitRequest = {
        merchantId: this.merchantId,
        countryCurrencyCode: this.currencyCode,
        referenceNumber: reference,
        amount: params.amount,
        customerEmail: params.customerEmail,
        customerFirstName: params.customerFirstName,
        customerLastName: params.customerLastName,
        customerPhoneNumber: formatPhoneNumber(params.customerPhoneNumber),
        notificationURL: this.notificationURL,
        returnURL: this.returnURL,
        ...(params.channel && { channel: params.channel }),
        ...(params.description && { description: params.description }),
        ...(params.customerId && { customerId: params.customerId }),
        ...(params.returnContext && { 
          returnContext: JSON.stringify(params.returnContext) 
        }),
      };

      // Generate hashcode if secret is provided
      if (this.secret) {
        requestData.hashcode = generateHashcode(requestData, this.secret);
      }

      // Create SOAP client
      const client = await soap.createClientAsync(SOAP_URL, {
        wsdl_options: {
          timeout: 30000,
        },
      });

      // Call initTransact method
      const [response] = await client.initTransactAsync(requestData);
      const result = response as PaiementProInitResponse;

      if (result.Code === 0 && result.Sessionid) {
        return {
          success: true,
          sessionId: result.Sessionid,
          paymentUrl: `${PAYMENT_URL}?sessionid=${result.Sessionid}`,
          reference,
        };
      }

      return {
        success: false,
        reference,
        error: result.Description || 'Initialization failed',
      };
    } catch (error) {
      console.error('PaiementPro initialization error:', error);
      return {
        success: false,
        reference: params.referenceNumber || '',
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

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error('PaiementPro status check error:', error);
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
    return `${PAYMENT_URL}?sessionid=${sessionId}`;
  }

  /**
   * Get channel selection URL
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

    clientInstance = new PaiementProClient({
      merchantId: process.env.PAIEMENTPRO_MERCHANT_ID,
      secret: process.env.PAIEMENTPRO_SECRET || '',
      currencyCode: process.env.PAIEMENTPRO_CURRENCY_CODE,
      notificationURL: process.env.PAIEMENTPRO_NOTIFICATION_URL || '',
      returnURL: process.env.PAIEMENTPRO_RETURN_URL || '',
    });
  }

  return clientInstance;
}
```

### Step 6: Create API Routes

**File:** `app/api/payments/initialize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPaiementProClient } from '@/lib/paiementpro/client';
import { PaymentInitParams } from '@/lib/paiementpro/types';

export async function POST(request: NextRequest) {
  try {
    const body: PaymentInitParams = await request.json();

    // Validate required fields
    const requiredFields = [
      'amount',
      'customerEmail',
      'customerFirstName',
      'customerLastName',
      'customerPhoneNumber',
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof PaymentInitParams]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Initialize payment
    const client = getPaiementProClient();
    const result = await client.initializePayment(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      paymentUrl: result.paymentUrl,
      reference: result.reference,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/payments/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PaymentNotification } from '@/lib/paiementpro/types';
import { verifyHashcode } from '@/lib/paiementpro/utils';

export async function POST(request: NextRequest) {
  try {
    const body: PaymentNotification = await request.json();

    // Verify hashcode if secret is configured
    if (process.env.PAIEMENTPRO_SECRET) {
      const isValid = verifyHashcode(
        body,
        body.hashcode,
        process.env.PAIEMENTPRO_SECRET
      );

      if (!isValid) {
        console.error('Invalid hashcode in payment notification');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    // Process the payment notification
    const isSuccess = body.responsecode === 0;

    console.log('Payment notification received:', {
      reference: body.referenceNumber,
      amount: body.amount,
      success: isSuccess,
      date: body.transactiondt,
    });

    // TODO: Update your database with payment status
    // Example:
    // await db.payment.update({
    //   where: { reference: body.referenceNumber },
    //   data: {
    //     status: isSuccess ? 'COMPLETED' : 'FAILED',
    //     transactionDate: body.transactiondt,
    //     merchantId: body.merchantId,
    //   },
    // });

    // Parse returnContext if provided
    let returnContext;
    if (body.returnContext) {
      try {
        returnContext = JSON.parse(body.returnContext);
      } catch (e) {
        console.warn('Failed to parse returnContext:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/payments/status/[reference]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPaiementProClient } from '@/lib/paiementpro/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    const client = getPaiementProClient();
    const result = await client.checkPaymentStatus(reference);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: result.status,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 7: Create Frontend Components

**File:** `app/payment/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAYMENT_CHANNELS, PaymentChannel } from '@/lib/paiementpro/types';

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    amount: '',
    customerEmail: '',
    customerFirstName: '',
    customerLastName: '',
    customerPhoneNumber: '',
    channel: '' as PaymentChannel | '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) * 100, // Convert to minor units
          channel: formData.channel || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to PaiementPro payment page
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Make a Payment</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (XOF) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="1000.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Payment Channel
          </label>
          <select
            value={formData.channel}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value as PaymentChannel })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select on payment page</option>
            <optgroup label="Côte d'Ivoire">
              <option value="OMCIV2">Orange Money CI</option>
              <option value="MOMOCI">MTN Mobile Money CI</option>
              <option value="FLOOZ">Moov Money CI</option>
              <option value="WAVECI">Wave CI</option>
            </optgroup>
            <optgroup label="Other Countries">
              <option value="OMBF">Orange Money BF</option>
              <option value="OMML">Orange Money Mali</option>
              <option value="MOMOBJ">MTN Mobile Money Benin</option>
              <option value="FLOOZBJ">Moov Money Benin</option>
              <option value="OMSN">Orange Money Senegal</option>
              <option value="WAVESN">Wave Senegal</option>
              <option value="OMCM">Orange Money Cameroun</option>
              <option value="MOMOCM">MTN Mobile Money Cameroun</option>
              <option value="MOOTG">Flooz Togo</option>
              <option value="TOGOCEL">Togo Cel</option>
            </optgroup>
            <optgroup label="International">
              <option value="CARD">Visa/Mastercard</option>
              <option value="PAYPAL">PayPal</option>
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.customerFirstName}
              onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.customerLastName}
              onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.customerPhoneNumber}
            onChange={(e) => setFormData({ ...formData, customerPhoneNumber: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="22507517917"
          />
          <p className="text-sm text-gray-500 mt-1">
            Format: Country code + number (e.g., 22507517917 for CI)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            placeholder="Payment for..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
}
```

**File:** `app/payment/success/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reference = searchParams.get('referenceNumber');
    
    if (reference) {
      fetch(`/api/payments/status/${reference}`)
        .then(res => res.json())
        .then(data => {
          setPaymentDetails(data.payment);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch payment details:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          Payment Successful!
        </h1>
        
        {loading ? (
          <p className="text-gray-600">Loading payment details...</p>
        ) : paymentDetails ? (
          <div className="bg-white rounded-lg p-6 mt-6 text-left">
            <h2 className="font-semibold mb-4">Payment Details</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Reference:</dt>
                <dd className="font-mono">{paymentDetails.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Amount:</dt>
                <dd className="font-semibold">{paymentDetails.amount / 100} XOF</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Channel:</dt>
                <dd>{paymentDetails.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Date:</dt>
                <dd>{paymentDetails.date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Transaction ID:</dt>
                <dd className="font-mono text-sm">{paymentDetails.pay_id}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-gray-600 mt-4">
            Your payment has been processed successfully.
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**File:** `app/payment/failed/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('referenceNumber');
  const responsecode = searchParams.get('responsecode');

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-red-700 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed.
        </p>

        {reference && (
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Reference Number:</p>
            <p className="font-mono font-semibold">{reference}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/payment"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing & Debugging

### Testing Checklist

1. **Environment Setup**
   - [ ] All environment variables configured
   - [ ] Merchant ID is valid
   - [ ] Webhook URL is accessible (use ngrok for local testing)

2. **Payment Flow**
   - [ ] Payment initialization succeeds
   - [ ] Redirection to PaiementPro works
   - [ ] Payment completion redirects back correctly
   - [ ] Webhook receives notifications

3. **Error Handling**
   - [ ] Invalid merchant ID handled
   - [ ] Missing required fields validated
   - [ ] Network errors handled gracefully
   - [ ] Failed payments handled correctly

### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Update your .env.local with the ngrok URL
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
PAIEMENTPRO_NOTIFICATION_URL=https://your-ngrok-url.ngrok.io/api/payments/webhook
```

### Debug Logging

Add comprehensive logging:

```typescript
// lib/paiementpro/logger.ts
export function logPaymentEvent(
  event: string,
  data: any,
  level: 'info' | 'error' | 'warn' = 'info'
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    level,
    data: JSON.stringify(data, null, 2),
  };

  console.log(`[${level.toUpperCase()}] ${event}:`, logEntry);
  
  // TODO: Send to your logging service (e.g., Datadog, Sentry)
}
```

### Testing Payment Channels

Test each channel individually to ensure proper integration:

```typescript
// Test script: scripts/test-payment.ts
import { getPaiementProClient } from '../lib/paiementpro/client';

async function testPayment(channel: string) {
  const client = getPaiementProClient();
  
  const result = await client.initializePayment({
    amount: 100, // 1 XOF in minor units
    customerEmail: 'test@example.com',
    customerFirstName: 'Test',
    customerLastName: 'User',
    customerPhoneNumber: '22500000000',
    channel: channel as any,
    description: `Test payment for ${channel}`,
  });

  console.log(`Test result for ${channel}:`, result);
}

// Run tests
const channels = ['OMCIV2', 'MOMOCI', 'CARD', 'PAYPAL'];
for (const channel of channels) {
  await testPayment(channel);
}
```

---

## 📝 Implementation Notes

### Important Considerations

1. **Security**
   - Always use HTTPS in production
   - Implement hashcode verification
   - Validate webhook signatures
   - Never expose merchant credentials client-side

2. **Currency**
   - Default is XOF (West African CFA Franc)
   - Code 952 for XOF
   - Amounts must be in minor units (multiply by 100)

3. **Phone Numbers**
   - Must be in international format without "+"
   - Example: 22507517917 (CI)
   - Remove all non-digit characters

4. **Reference Numbers**
   - Must be unique per transaction
   - Recommended format: PREFIX-TIMESTAMP-RANDOM
   - Store in your database before initialization

5. **Webhooks**
   - Must be publicly accessible
   - Should respond quickly (< 5 seconds)
   - Implement idempotency (handle duplicate notifications)
   - Always verify hashcode

6. **Error Handling**
   - Network failures: Implement retry logic
   - Timeout issues: Session valid for 5 minutes only
   - Status checks: Poll status API for pending payments

### Production Checklist

- [ ] Update all URLs from test to production
- [ ] Configure proper error monitoring (Sentry, etc.)
- [ ] Set up proper logging system
- [ ] Implement database transactions for payment records
- [ ] Add rate limiting to API routes
- [ ] Set up automated status checking for pending payments
- [ ] Configure proper CORS headers
- [ ] Implement proper session management
- [ ] Add email notifications for payment events
- [ ] Set up monitoring and alerts
- [ ] Create admin dashboard for payment management
- [ ] Implement refund handling if needed
- [ ] Add comprehensive test coverage

---

## 🔐 Security Best Practices

1. **Never expose secrets client-side**
2. **Always verify webhook signatures**
3. **Use environment variables for all configuration**
4. **Implement rate limiting on API routes**
5. **Log all payment events for audit trail**
6. **Use HTTPS only in production**
7. **Implement CSRF protection**
8. **Validate all user inputs**
9. **Use secure session management**
10. **Regularly rotate API credentials**

---

## 📞 Support

For PaiementPro support:
- **Phone:** +(225) 21 21 48 50 / +(225) 78 25 22 83
- **Email:** info@paiementpro.net
- **Website:** https://www.paiementpro.net

---

## 📄 License

This implementation guide is provided as-is for integration purposes.
