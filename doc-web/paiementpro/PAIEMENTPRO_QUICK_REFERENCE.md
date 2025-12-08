# PaiementPro - Quick Reference & Copy-Paste Snippets

## 🚀 Ultra-Fast Setup (5 Minutes)

### Step 1: Install & Configure (1 min)

```bash
# Terminal commands
npm install soap crypto uuid
echo 'PAIEMENTPRO_MERCHANT_ID=PP-F105
PAIEMENTPRO_SECRET=your_secret
PAIEMENTPRO_CURRENCY_CODE=952
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAIEMENTPRO_NOTIFICATION_URL=http://localhost:3000/api/payments/webhook
PAIEMENTPRO_RETURN_URL=http://localhost:3000/payment/success' > .env.local
```

### Step 2: Create Core Files (2 min)

#### File 1: `lib/paiementpro/types.ts` (Copy-Paste)

```typescript
export const PAYMENT_CHANNELS = {
  OMCIV2: 'OMCIV2', MOMOCI: 'MOMOCI', FLOOZ: 'FLOOZ', OMBF: 'OMBF',
  OMML: 'OMML', MOMOBJ: 'MOMOBJ', FLOOZBJ: 'FLOOZBJ', AIRTELNG: 'AIRTELNG',
  WAVECI: 'WAVECI', OMSN: 'OMSN', PAYPAL: 'PAYPAL', OMGN: 'OMGN',
  OMCM: 'OMCM', WAVESN: 'WAVESN', MOOTG: 'MOOTG', TOGOCEL: 'TOGOCEL',
  MOMOCM: 'MOMOCM', CARD: 'CARD',
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
```

#### File 2: `lib/paiementpro/client.ts` (Copy-Paste)

```typescript
import soap from 'soap';

const SOAP_URL = 'https://www.paiementpro.net/webservice/OnlineServicePayment_v2.php?wsdl';
const PAYMENT_URL = 'https://paiementpro.net/webservice/onlinepayment/processing_v2.php';

export class PaiementProClient {
  constructor(
    private merchantId: string,
    private notificationURL: string,
    private returnURL: string,
    private currencyCode = '952'
  ) {}

  async initializePayment(params: any) {
    const reference = params.referenceNumber || `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
      const client = await soap.createClientAsync(SOAP_URL);
      const [response] = await client.initTransactAsync({
        merchantId: this.merchantId,
        countryCurrencyCode: this.currencyCode,
        referenceNumber: reference,
        amount: params.amount,
        customerEmail: params.customerEmail,
        customerFirstName: params.customerFirstName,
        customerLastName: params.customerLastName,
        customerPhoneNumber: params.customerPhoneNumber.replace(/\D/g, ''),
        notificationURL: this.notificationURL,
        returnURL: this.returnURL,
        ...(params.channel && { channel: params.channel }),
        ...(params.description && { description: params.description }),
      });

      if (response.Code === 0 && response.Sessionid) {
        return {
          success: true,
          sessionId: response.Sessionid,
          paymentUrl: `${PAYMENT_URL}?sessionid=${response.Sessionid}`,
          reference,
        };
      }

      return { success: false, reference, error: response.Description };
    } catch (error) {
      return { success: false, reference, error: error.message };
    }
  }

  async checkPaymentStatus(reference: string) {
    const response = await fetch(`https://api.paiementpro.net/status/${reference}`);
    return response.json();
  }
}

export const getPaiementProClient = () => new PaiementProClient(
  process.env.PAIEMENTPRO_MERCHANT_ID!,
  process.env.PAIEMENTPRO_NOTIFICATION_URL!,
  process.env.PAIEMENTPRO_RETURN_URL!,
  process.env.PAIEMENTPRO_CURRENCY_CODE
);
```

#### File 3: `app/api/payments/initialize/route.ts` (Copy-Paste)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPaiementProClient } from '@/lib/paiementpro/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getPaiementProClient();
    const result = await client.initializePayment(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### File 4: `app/api/payments/webhook/route.ts` (Copy-Paste)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Payment notification:', {
      reference: body.referenceNumber,
      success: body.responsecode === 0,
      amount: body.amount,
    });
    
    // TODO: Update your database here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
```

#### File 5: `app/payment/page.tsx` (Copy-Paste)

```typescript
'use client';

import { useState } from 'react';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    customerEmail: '',
    customerFirstName: '',
    customerLastName: '',
    customerPhoneNumber: '',
    channel: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount) * 100,
      }),
    });

    const data = await response.json();
    if (data.paymentUrl) window.location.href = data.paymentUrl;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Make Payment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          step="0.01"
          placeholder="Amount (XOF)"
          required
          value={form.amount}
          onChange={(e) => setForm({...form, amount: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.customerEmail}
          onChange={(e) => setForm({...form, customerEmail: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="First Name"
          required
          value={form.customerFirstName}
          onChange={(e) => setForm({...form, customerFirstName: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          required
          value={form.customerLastName}
          onChange={(e) => setForm({...form, customerLastName: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="tel"
          placeholder="Phone (e.g., 22507517917)"
          required
          value={form.customerPhoneNumber}
          onChange={(e) => setForm({...form, customerPhoneNumber: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
        <select
          value={form.channel}
          onChange={(e) => setForm({...form, channel: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Select channel (optional)</option>
          <option value="OMCIV2">Orange Money CI</option>
          <option value="MOMOCI">MTN CI</option>
          <option value="FLOOZ">Moov CI</option>
          <option value="WAVECI">Wave CI</option>
          <option value="CARD">Visa/Mastercard</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
}
```

### Step 3: Test (2 min)

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3000/payment
# Fill form and test payment flow
```

---

## 📝 Common Snippets

### 1. Simple Payment Button Component

```typescript
// components/PaymentButton.tsx
'use client';

export default function PaymentButton({ 
  amount, 
  description,
  userEmail,
  userName 
}: { 
  amount: number;
  description: string;
  userEmail: string;
  userName: string;
}) {
  const handlePayment = async () => {
    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount * 100,
        customerEmail: userEmail,
        customerFirstName: userName.split(' ')[0],
        customerLastName: userName.split(' ')[1] || '',
        customerPhoneNumber: '22500000000',
        description,
      }),
    });
    
    const data = await response.json();
    if (data.paymentUrl) window.location.href = data.paymentUrl;
  };

  return (
    <button 
      onClick={handlePayment}
      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
    >
      Pay {amount} XOF
    </button>
  );
}

// Usage:
<PaymentButton 
  amount={5000} 
  description="Premium subscription" 
  userEmail="user@example.com"
  userName="John Doe"
/>
```

### 2. Payment Status Badge

```typescript
// components/PaymentStatusBadge.tsx
export default function PaymentStatusBadge({ status }: { status: string }) {
  const styles = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles}`}>
      {status}
    </span>
  );
}
```

### 3. Payment History List

```typescript
// app/payments/history/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch('/api/payments/list')
      .then(res => res.json())
      .then(data => setPayments(data.payments));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Payment History</h1>
      <div className="space-y-2">
        {payments.map((payment: any) => (
          <div key={payment.id} className="border rounded-lg p-4 flex justify-between">
            <div>
              <p className="font-semibold">{payment.description}</p>
              <p className="text-sm text-gray-600">{payment.reference}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{payment.amount / 100} XOF</p>
              <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Inline Payment Modal

```typescript
// components/PaymentModal.tsx
'use client';

import { useState } from 'react';

export default function PaymentModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('');

  const handlePay = async () => {
    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount) * 100,
        customerEmail: 'user@example.com',
        customerFirstName: 'John',
        customerLastName: 'Doe',
        customerPhoneNumber: '22500000000',
      }),
    });
    
    const data = await response.json();
    if (data.paymentUrl) window.location.href = data.paymentUrl;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Make Payment</h2>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={handlePay}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Pay Now
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Server Action (App Router)

```typescript
// app/actions/payment.ts
'use server';

import { getPaiementProClient } from '@/lib/paiementpro/client';

export async function createPayment(formData: FormData) {
  const client = getPaiementProClient();
  
  const result = await client.initializePayment({
    amount: parseInt(formData.get('amount') as string) * 100,
    customerEmail: formData.get('email') as string,
    customerFirstName: formData.get('firstName') as string,
    customerLastName: formData.get('lastName') as string,
    customerPhoneNumber: formData.get('phone') as string,
  });
  
  return result;
}

// Usage in component:
'use client';

import { createPayment } from './actions/payment';

export default function PaymentForm() {
  return (
    <form action={async (formData) => {
      const result = await createPayment(formData);
      if (result.paymentUrl) window.location.href = result.paymentUrl;
    }}>
      <input name="amount" type="number" required />
      <input name="email" type="email" required />
      <input name="firstName" type="text" required />
      <input name="lastName" type="text" required />
      <input name="phone" type="tel" required />
      <button type="submit">Pay</button>
    </form>
  );
}
```

---

## 🔧 Debugging Snippets

### 1. Test SOAP Connection

```typescript
// scripts/test-soap.ts
import soap from 'soap';

const SOAP_URL = 'https://www.paiementpro.net/webservice/OnlineServicePayment_v2.php?wsdl';

async function testSoapConnection() {
  try {
    const client = await soap.createClientAsync(SOAP_URL);
    console.log('✅ SOAP connection successful');
    console.log('Available methods:', Object.keys(client));
  } catch (error) {
    console.error('❌ SOAP connection failed:', error);
  }
}

testSoapConnection();
```

### 2. Test Webhook Locally

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Test webhook with curl
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "PP-F105",
    "referenceNumber": "TEST-123",
    "amount": 1000,
    "responsecode": 0
  }'
```

### 3. Payment Status Checker Script

```typescript
// scripts/check-payment.ts
import { getPaiementProClient } from '../lib/paiementpro/client';

async function checkPayment(reference: string) {
  const client = getPaiementProClient();
  const result = await client.checkPaymentStatus(reference);
  console.log('Payment status:', result);
}

// Run: ts-node scripts/check-payment.ts TXN-123
checkPayment(process.argv[2]);
```

### 4. List All Channels

```typescript
// scripts/list-channels.ts
const CHANNELS = {
  'OMCIV2': { name: 'Orange Money CI', country: 'CI' },
  'MOMOCI': { name: 'MTN Mobile Money CI', country: 'CI' },
  'FLOOZ': { name: 'Moov Money CI', country: 'CI' },
  'WAVECI': { name: 'Wave CI', country: 'CI' },
  'OMBF': { name: 'Orange Money BF', country: 'BF' },
  'OMML': { name: 'Orange Money Mali', country: 'ML' },
  'MOMOBJ': { name: 'MTN Mobile Money Benin', country: 'BJ' },
  'FLOOZBJ': { name: 'Moov Money Benin', country: 'BJ' },
  'AIRTELNG': { name: 'Airtel Niger', country: 'NE' },
  'OMSN': { name: 'Orange Money Senegal', country: 'SN' },
  'WAVESN': { name: 'Wave Senegal', country: 'SN' },
  'OMGN': { name: 'Orange Guinee Bissau', country: 'GW' },
  'OMCM': { name: 'Orange Money Cameroun', country: 'CM' },
  'MOMOCM': { name: 'MTN Mobile Money Cameroun', country: 'CM' },
  'MOOTG': { name: 'Flooz Togo', country: 'TG' },
  'TOGOCEL': { name: 'Togo Cel', country: 'TG' },
  'CARD': { name: 'Visa/Mastercard', country: 'INTL' },
  'PAYPAL': { name: 'PayPal', country: 'INTL' },
};

Object.entries(CHANNELS).forEach(([code, info]) => {
  console.log(`${code.padEnd(10)} | ${info.name.padEnd(30)} | ${info.country}`);
});
```

---

## 🎨 Styled Components

### Payment Card Component

```typescript
// components/PaymentCard.tsx
export default function PaymentCard({
  title,
  amount,
  description,
  onPay
}: {
  title: string;
  amount: number;
  description: string;
  onPay: () => void;
}) {
  return (
    <div className="border rounded-lg shadow-lg p-6 bg-gradient-to-br from-blue-50 to-white">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-blue-600">{amount} XOF</span>
        <button
          onClick={onPay}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}
```

### Channel Selector Component

```typescript
// components/ChannelSelector.tsx
'use client';

import { useState } from 'react';

const CHANNELS = [
  { code: 'OMCIV2', name: 'Orange Money', flag: '🇨🇮', color: 'orange' },
  { code: 'MOMOCI', name: 'MTN Money', flag: '🇨🇮', color: 'yellow' },
  { code: 'FLOOZ', name: 'Moov Money', flag: '🇨🇮', color: 'blue' },
  { code: 'WAVECI', name: 'Wave', flag: '🇨🇮', color: 'pink' },
  { code: 'CARD', name: 'Visa/Mastercard', flag: '💳', color: 'gray' },
];

export default function ChannelSelector({ 
  onSelect 
}: { 
  onSelect: (channel: string) => void 
}) {
  const [selected, setSelected] = useState('');

  return (
    <div className="grid grid-cols-2 gap-4">
      {CHANNELS.map((channel) => (
        <button
          key={channel.code}
          onClick={() => {
            setSelected(channel.code);
            onSelect(channel.code);
          }}
          className={`p-4 rounded-lg border-2 transition ${
            selected === channel.code
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-2">{channel.flag}</div>
          <div className="font-semibold">{channel.name}</div>
        </button>
      ))}
    </div>
  );
}
```

---

## 📊 Analytics Integration

### Track Payment Events

```typescript
// lib/analytics.ts
export function trackPaymentEvent(
  eventName: string,
  properties: Record<string, any>
) {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, properties);
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, properties);
  }

  // Your custom analytics
  console.log('[Analytics]', eventName, properties);
}

// Usage:
trackPaymentEvent('payment_initiated', {
  amount: 5000,
  channel: 'OMCIV2',
  reference: 'TXN-123',
});

trackPaymentEvent('payment_completed', {
  amount: 5000,
  channel: 'OMCIV2',
  reference: 'TXN-123',
});
```

---

## 🔐 Security Snippets

### Rate Limiting Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/payments')) {
    const ip = request.ip || 'unknown';
    const now = Date.now();
    const limit = rateLimit.get(ip);

    if (limit && now < limit.resetAt) {
      if (limit.count >= 10) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }
      limit.count++;
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    }
  }

  return NextResponse.next();
}
```

### Input Validation

```typescript
// lib/validation.ts
import { z } from 'zod';

export const PaymentSchema = z.object({
  amount: z.number().positive().max(10000000),
  customerEmail: z.string().email(),
  customerFirstName: z.string().min(2).max(50),
  customerLastName: z.string().min(2).max(50),
  customerPhoneNumber: z.string().regex(/^\d{8,15}$/),
  channel: z.enum([
    'OMCIV2', 'MOMOCI', 'FLOOZ', 'CARD', 'PAYPAL',
    // ... other channels
  ]).optional(),
});

// Usage:
const result = PaymentSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: result.error.issues },
    { status: 400 }
  );
}
```

---

## 💡 Pro Tips

1. **Always use HTTPS in production**
2. **Implement idempotency for webhooks** (handle duplicate notifications)
3. **Store reference numbers before redirecting** to payment page
4. **Use environment-specific merchant IDs** for dev/staging/prod
5. **Log all payment events** for debugging and compliance
6. **Test all channels individually** before going live
7. **Set up monitoring alerts** for failed payments
8. **Implement retry logic** for network failures
9. **Cache payment status** to reduce API calls
10. **Use TypeScript** for better type safety

---

## 🎯 One-Liners

### Quick Payment Link
```typescript
const paymentUrl = `https://paiementpro.net/webservice/onlinepayment/processing_v2.php?sessionid=${sessionId}`;
```

### Format Phone Number
```typescript
const phone = phoneInput.replace(/\D/g, '');
```

### Generate Reference
```typescript
const ref = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
```

### Convert to Minor Units
```typescript
const amountInMinorUnits = Math.round(amount * 100);
```

### Check if Payment Successful
```typescript
const isSuccess = notification.responsecode === 0;
```

---

This quick reference guide provides everything you need to integrate PaiementPro into your Next.js app in minutes!

For full documentation, see: `PAIEMENTPRO_NEXTJS_IMPLEMENTATION.md`
