# PaiementPro - Additional Code Examples & Utilities

## Quick Start Commands

```bash
# 1. Install dependencies
npm install soap crypto uuid
npm install -D @types/node @types/soap

# 2. Create environment file
cat > .env.local << EOF
PAIEMENTPRO_MERCHANT_ID=PP-F105
PAIEMENTPRO_SECRET=your_secret_key_here
PAIEMENTPRO_CURRENCY_CODE=952
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAIEMENTPRO_NOTIFICATION_URL=http://localhost:3000/api/payments/webhook
PAIEMENTPRO_RETURN_URL=http://localhost:3000/payment/success
EOF

# 3. Start development server
npm run dev
```

---

## Advanced Examples

### 1. Payment with Custom Context

```typescript
// Store custom data that will be returned after payment
const result = await fetch('/api/payments/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 5000, // 50 XOF
    customerEmail: 'user@example.com',
    customerFirstName: 'John',
    customerLastName: 'Doe',
    customerPhoneNumber: '22507517917',
    channel: 'OMCIV2',
    description: 'Order #12345',
    returnContext: {
      orderId: '12345',
      userId: 'user_abc123',
      cartItems: 3,
      discount: 500,
      shippingAddress: 'Abidjan, CI',
    }
  })
});
```

### 2. Subscription Payment Flow

```typescript
// lib/paiementpro/subscription.ts
import { getPaiementProClient } from './client';

export async function createSubscriptionPayment(
  userId: string,
  planId: string,
  amount: number,
  period: 'monthly' | 'yearly'
) {
  const client = getPaiementProClient();
  
  // Generate unique reference for subscription
  const reference = `SUB-${userId}-${planId}-${Date.now()}`;
  
  // TODO: Fetch user details from your database
  const user = await db.user.findUnique({ where: { id: userId } });
  
  const result = await client.initializePayment({
    amount,
    customerEmail: user.email,
    customerFirstName: user.firstName,
    customerLastName: user.lastName,
    customerPhoneNumber: user.phone,
    referenceNumber: reference,
    description: `${period} subscription to ${planId}`,
    returnContext: {
      type: 'subscription',
      userId,
      planId,
      period,
      startDate: new Date().toISOString(),
    },
  });
  
  return result;
}
```

### 3. Split Payment / Installment

```typescript
// lib/paiementpro/installment.ts
import { getPaiementProClient } from './client';

export async function createInstallmentPayment(
  orderId: string,
  totalAmount: number,
  installments: number,
  customerDetails: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
) {
  const client = getPaiementProClient();
  const installmentAmount = Math.ceil(totalAmount / installments);
  
  // Create first installment payment
  const reference = `INST-${orderId}-1-${Date.now()}`;
  
  const result = await client.initializePayment({
    amount: installmentAmount,
    ...customerDetails,
    referenceNumber: reference,
    description: `Installment 1/${installments} for Order ${orderId}`,
    returnContext: {
      type: 'installment',
      orderId,
      currentInstallment: 1,
      totalInstallments: installments,
      installmentAmount,
      totalAmount,
    },
  });
  
  return result;
}
```

### 4. Payment with Multi-Currency Support

```typescript
// lib/paiementpro/currency.ts
const CURRENCY_CODES = {
  XOF: '952', // West African CFA Franc
  USD: '840',
  EUR: '978',
  GBP: '826',
} as const;

const CURRENCY_TO_MINOR_UNITS = {
  XOF: 1,    // No subdivisions for CFA
  USD: 100,  // Cents
  EUR: 100,  // Cents
  GBP: 100,  // Pence
} as const;

export function convertToMinorUnits(
  amount: number,
  currency: keyof typeof CURRENCY_CODES
): number {
  const multiplier = CURRENCY_TO_MINOR_UNITS[currency];
  return Math.round(amount * multiplier);
}

export function convertFromMinorUnits(
  amount: number,
  currency: keyof typeof CURRENCY_CODES
): number {
  const multiplier = CURRENCY_TO_MINOR_UNITS[currency];
  return amount / multiplier;
}

export function getCurrencyCode(currency: keyof typeof CURRENCY_CODES): string {
  return CURRENCY_CODES[currency];
}
```

### 5. Payment Status Polling Hook

```typescript
// hooks/usePaymentStatus.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PaymentStatus } from '@/lib/paiementpro/types';

export function usePaymentStatus(reference: string, intervalMs: number = 5000) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!reference) return;

    try {
      const response = await fetch(`/api/payments/status/${reference}`);
      const data = await response.json();

      if (data.success && data.payment) {
        setStatus(data.payment);
        
        // Stop polling if payment is completed or failed
        if (data.payment.success !== undefined) {
          setIsPolling(false);
        }
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    if (!isPolling) return;

    checkStatus();
    const interval = setInterval(checkStatus, intervalMs);

    return () => clearInterval(interval);
  }, [checkStatus, intervalMs, isPolling]);

  return {
    status,
    loading,
    error,
    isPolling,
    refresh: checkStatus,
    stopPolling: () => setIsPolling(false),
  };
}

// Usage example
function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || '';
  
  const { status, loading, isPolling } = usePaymentStatus(reference);

  if (loading) return <div>Checking payment status...</div>;

  if (status?.success) {
    return <div>Payment successful! ✅</div>;
  }

  if (isPolling) {
    return <div>Processing payment... ⏳</div>;
  }

  return <div>Payment failed ❌</div>;
}
```

### 6. Comprehensive Error Handler

```typescript
// lib/paiementpro/errors.ts
export class PaiementProError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PaiementProError';
  }
}

export class PaymentInitializationError extends PaiementProError {
  constructor(message: string, details?: any) {
    super(message, 'INIT_ERROR', details);
    this.name = 'PaymentInitializationError';
  }
}

export class PaymentVerificationError extends PaiementProError {
  constructor(message: string, details?: any) {
    super(message, 'VERIFICATION_ERROR', details);
    this.name = 'PaymentVerificationError';
  }
}

export class WebhookValidationError extends PaiementProError {
  constructor(message: string, details?: any) {
    super(message, 'WEBHOOK_ERROR', details);
    this.name = 'WebhookValidationError';
  }
}

// Error handler middleware
export function handlePaiementProError(error: unknown) {
  if (error instanceof PaiementProError) {
    console.error(`[${error.code}] ${error.message}`, error.details);
    return {
      error: error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { details: error.details }),
    };
  }

  console.error('Unexpected error:', error);
  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}
```

### 7. Payment Analytics Tracker

```typescript
// lib/paiementpro/analytics.ts
export interface PaymentEvent {
  type: 'initialization' | 'success' | 'failure' | 'cancellation';
  reference: string;
  amount: number;
  channel?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class PaymentAnalytics {
  private events: PaymentEvent[] = [];

  track(event: PaymentEvent) {
    this.events.push(event);
    
    // Send to analytics service (e.g., Google Analytics, Mixpanel)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'payment_event', {
        event_category: 'payment',
        event_label: event.type,
        value: event.amount,
        reference: event.reference,
        channel: event.channel,
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Payment Analytics]', event);
    }
  }

  getEvents(): PaymentEvent[] {
    return [...this.events];
  }

  getEventsByType(type: PaymentEvent['type']): PaymentEvent[] {
    return this.events.filter(e => e.type === type);
  }

  getSuccessRate(): number {
    const total = this.events.length;
    if (total === 0) return 0;
    
    const successful = this.events.filter(e => e.type === 'success').length;
    return (successful / total) * 100;
  }

  getTotalAmount(): number {
    return this.events
      .filter(e => e.type === 'success')
      .reduce((sum, e) => sum + e.amount, 0);
  }
}

// Singleton instance
export const paymentAnalytics = new PaymentAnalytics();

// Usage in your payment flow
paymentAnalytics.track({
  type: 'initialization',
  reference: 'TXN-123',
  amount: 5000,
  channel: 'OMCIV2',
  timestamp: new Date().toISOString(),
  metadata: { orderId: '12345' },
});
```

### 8. Payment Receipt Generator

```typescript
// lib/paiementpro/receipt.ts
import { PaymentStatus } from './types';

export interface Receipt {
  reference: string;
  date: string;
  amount: number;
  currency: string;
  channel: string;
  customerName: string;
  merchantName: string;
  status: 'success' | 'failed';
}

export function generateReceiptHTML(receipt: Receipt): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .status { padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; }
        .success { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .details { margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Receipt</h1>
        <p>${receipt.merchantName}</p>
      </div>

      <div class="status ${receipt.status}">
        ${receipt.status === 'success' ? '✅ Payment Successful' : '❌ Payment Failed'}
      </div>

      <div class="details">
        <div class="row">
          <span class="label">Reference:</span>
          <span>${receipt.reference}</span>
        </div>
        <div class="row">
          <span class="label">Date:</span>
          <span>${receipt.date}</span>
        </div>
        <div class="row">
          <span class="label">Amount:</span>
          <span>${receipt.amount} ${receipt.currency}</span>
        </div>
        <div class="row">
          <span class="label">Payment Method:</span>
          <span>${receipt.channel}</span>
        </div>
        <div class="row">
          <span class="label">Customer:</span>
          <span>${receipt.customerName}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your payment!</p>
        <p>This is an automated receipt. Please keep it for your records.</p>
      </div>
    </body>
    </html>
  `;
}

export async function sendReceiptEmail(
  receipt: Receipt,
  customerEmail: string
): Promise<boolean> {
  // Implement email sending logic
  // Example using a service like SendGrid, Resend, or Nodemailer
  
  try {
    const html = generateReceiptHTML(receipt);
    
    // TODO: Replace with your email service
    // await emailService.send({
    //   to: customerEmail,
    //   subject: `Payment Receipt - ${receipt.reference}`,
    //   html: html,
    // });

    console.log(`Receipt sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send receipt:', error);
    return false;
  }
}
```

### 9. Payment Retry Logic

```typescript
// lib/paiementpro/retry.ts
interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
}

export async function retryPaymentOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
  } = options;

  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * attempt : delayMs;
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage example
const result = await retryPaymentOperation(
  () => client.checkPaymentStatus(reference),
  { maxAttempts: 3, delayMs: 2000, backoff: true }
);
```

### 10. Database Schema (Prisma Example)

```prisma
// prisma/schema.prisma
model Payment {
  id                String   @id @default(cuid())
  reference         String   @unique
  amount            Int      // Amount in minor units
  currency          String   @default("XOF")
  status            PaymentStatus @default(PENDING)
  
  // Customer info
  customerEmail     String
  customerFirstName String
  customerLastName  String
  customerPhone     String
  customerId        String?
  
  // Payment details
  channel           String?
  sessionId         String?
  paymentId         String?
  transactionDate   DateTime?
  
  // Metadata
  description       String?
  returnContext     Json?
  
  // PaiementPro response
  merchantId        String
  responsecode      Int?
  hashcode          String?
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  userId            String?
  user              User?    @relation(fields: [userId], references: [id])
  orderId           String?
  order             Order?   @relation(fields: [orderId], references: [id])
  
  @@index([reference])
  @@index([status])
  @@index([customerEmail])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}

// Usage in webhook handler
await prisma.payment.update({
  where: { reference: notification.referenceNumber },
  data: {
    status: notification.responsecode === 0 ? 'COMPLETED' : 'FAILED',
    responsecode: notification.responsecode,
    transactionDate: new Date(notification.transactiondt),
    paymentId: notification.pay_id,
  },
});
```

### 11. Admin Dashboard Component

```typescript
// app/admin/payments/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  useEffect(() => {
    fetch(`/api/admin/payments?filter=${filter}`)
      .then(res => res.json())
      .then(data => setPayments(data.payments));
  }, [filter]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Management</h1>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded ${filter === 'failed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Failed
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment: any) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{payment.reference}</td>
                <td className="px-6 py-4 whitespace-nowrap">{payment.customerEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">{payment.amount / 100} XOF</td>
                <td className="px-6 py-4 whitespace-nowrap">{payment.channel}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 12. Testing Suite

```typescript
// __tests__/paiementpro.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PaiementProClient } from '../lib/paiementpro/client';
import { generateReference, formatPhoneNumber } from '../lib/paiementpro/utils';

describe('PaiementPro Client', () => {
  let client: PaiementProClient;

  beforeEach(() => {
    client = new PaiementProClient({
      merchantId: 'TEST-MERCHANT',
      secret: 'test-secret',
      notificationURL: 'http://localhost:3000/api/webhook',
      returnURL: 'http://localhost:3000/success',
    });
  });

  describe('Payment Initialization', () => {
    it('should generate unique references', () => {
      const ref1 = generateReference();
      const ref2 = generateReference();
      expect(ref1).not.toBe(ref2);
    });

    it('should format phone numbers correctly', () => {
      expect(formatPhoneNumber('+225 07 51 79 17')).toBe('22507517917');
      expect(formatPhoneNumber('0751-7917')).toBe('07517917');
    });

    it('should initialize payment with valid params', async () => {
      const result = await client.initializePayment({
        amount: 1000,
        customerEmail: 'test@example.com',
        customerFirstName: 'Test',
        customerLastName: 'User',
        customerPhoneNumber: '22507517917',
      });

      expect(result).toHaveProperty('reference');
      expect(result.reference).toBeTruthy();
    });
  });

  describe('Payment Status', () => {
    it('should check payment status', async () => {
      const reference = 'TEST-123';
      const result = await client.checkPaymentStatus(reference);
      
      expect(result).toHaveProperty('success');
    });
  });
});
```

---

## Environment-Specific Configurations

### Development (.env.local)
```bash
PAIEMENTPRO_MERCHANT_ID=PP-TEST
PAIEMENTPRO_SECRET=dev-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAIEMENTPRO_NOTIFICATION_URL=https://your-ngrok-url.ngrok.io/api/payments/webhook
PAIEMENTPRO_RETURN_URL=http://localhost:3000/payment/success
NODE_ENV=development
```

### Staging (.env.staging)
```bash
PAIEMENTPRO_MERCHANT_ID=PP-STAGING
PAIEMENTPRO_SECRET=staging-secret
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
PAIEMENTPRO_NOTIFICATION_URL=https://staging.yourdomain.com/api/payments/webhook
PAIEMENTPRO_RETURN_URL=https://staging.yourdomain.com/payment/success
NODE_ENV=staging
```

### Production (.env.production)
```bash
PAIEMENTPRO_MERCHANT_ID=PP-PROD
PAIEMENTPRO_SECRET=production-secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PAIEMENTPRO_NOTIFICATION_URL=https://yourdomain.com/api/payments/webhook
PAIEMENTPRO_RETURN_URL=https://yourdomain.com/payment/success
NODE_ENV=production
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set correctly
- [ ] HTTPS enabled on production domain
- [ ] Webhook URL is publicly accessible
- [ ] Database migrations completed
- [ ] Test all payment channels
- [ ] Verify hashcode generation/verification
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure logging service

### Post-Deployment
- [ ] Test live payment flow end-to-end
- [ ] Monitor webhook delivery
- [ ] Check payment status polling
- [ ] Verify email notifications
- [ ] Test error scenarios
- [ ] Monitor server logs
- [ ] Set up alerting for failed payments

---

## Troubleshooting Guide

### Common Issues

1. **"Session ID is null"**
   - Check merchant ID is correct
   - Verify all required parameters are provided
   - Check SOAP service is accessible

2. **"Webhook not receiving notifications"**
   - Ensure URL is publicly accessible (not localhost)
   - Check firewall settings
   - Verify endpoint is POST-compatible
   - Test with curl: `curl -X POST https://your-domain.com/api/payments/webhook -d '{"test": "data"}'`

3. **"Invalid hashcode"**
   - Verify secret key matches
   - Check parameter ordering in hash generation
   - Contact PaiementPro for correct hash algorithm

4. **"Payment stuck in pending"**
   - Implement status polling
   - Check webhook logs
   - Manually verify via status API

5. **"CORS errors"**
   - Add proper CORS headers to API routes
   - Verify domain is whitelisted

---

## Performance Optimization

### Caching Strategy
```typescript
// lib/paiementpro/cache.ts
const cache = new Map<string, { data: any; expires: number }>();

export function cacheGet<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  
  return item.data as T;
}

export function cacheSet(key: string, data: any, ttlMs: number = 60000) {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

// Usage: Cache payment status for 30 seconds
const cachedStatus = cacheGet(`payment:${reference}`);
if (cachedStatus) return cachedStatus;

const status = await client.checkPaymentStatus(reference);
cacheSet(`payment:${reference}`, status, 30000);
```

---

## Migration Guide

### From Other Payment Gateways

If migrating from another gateway:

1. Map existing payment channels to PaiementPro channels
2. Update webhook endpoints
3. Migrate transaction history
4. Update payment forms
5. Test thoroughly before switching

### Example Migration Script
```typescript
// scripts/migrate-payments.ts
async function migrateFromOldGateway() {
  const oldPayments = await db.oldPayment.findMany();
  
  for (const oldPayment of oldPayments) {
    await db.payment.create({
      data: {
        reference: oldPayment.id,
        amount: oldPayment.amount,
        status: mapStatus(oldPayment.status),
        customerEmail: oldPayment.email,
        // ... map other fields
      },
    });
  }
  
  console.log(`Migrated ${oldPayments.length} payments`);
}
```

---

This completes the comprehensive implementation guide for PaiementPro with Next.js!
