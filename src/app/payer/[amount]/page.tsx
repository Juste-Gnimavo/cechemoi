'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, User, CreditCard, ArrowLeft, Loader2, Check } from 'lucide-react';
import Image from 'next/image';

interface PaymentChannel {
  code: string;
  name: string;
  color: string;
  abbr: string;
}

const paymentChannels: PaymentChannel[] = [
  { code: 'OMCIV2', name: 'Orange Money', color: 'bg-orange-500', abbr: 'OM' },
  { code: 'MOMOCI', name: 'MTN MoMo', color: 'bg-yellow-400', abbr: 'MTN' },
  { code: 'FLOOZ', name: 'Moov Money', color: 'bg-blue-600', abbr: 'M' },
  { code: 'WAVECI', name: 'Wave', color: 'bg-cyan-500', abbr: 'W' },
  { code: 'CARD', name: 'Carte', color: 'bg-purple-600', abbr: 'CB' },
  { code: 'PAYPAL', name: 'PayPal', color: 'bg-[#003087]', abbr: 'PP' },
];

// Sanitize amount: "5,000" or "5.000" or "5 000" or "5%2C000" → "5000"
// Handles URL-encoded commas (%2C) and various separators
const sanitizeAmount = (value: string): string => {
  // First decode any URL-encoded characters (e.g., %2C for comma)
  const decoded = decodeURIComponent(value);
  // Remove all non-digit characters (commas, dots, spaces, etc.)
  return decoded.replace(/\D/g, '');
};

export default function PayerAmountPage() {
  const params = useParams();
  const router = useRouter();

  // Sanitize amount to handle formats like "5,000" or "5.000" or "5 000"
  const rawAmount = params.amount as string;
  const cleanAmount = sanitizeAmount(rawAmount);
  const amount = parseInt(cleanAmount, 10);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (isNaN(amount) || amount <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b px-4 py-3">
          <Image src="/logo-dark-rect.png" alt="CÈCHÉMOI" width={120} height={36} className="h-7 w-auto" />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            <p className="text-red-500 mb-4">Montant invalide</p>
            <button
              onClick={() => router.push('/payer')}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold active:bg-amber-600"
            >
              Retour
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Veuillez entrer votre nom complet');
      return;
    }

    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Numéro de téléphone invalide');
      return;
    }

    if (!selectedChannel) {
      setError('Veuillez choisir un mode de paiement');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payer/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          customerName: name.trim(),
          customerPhone: cleanPhone,
          channel: selectedChannel,
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || 'Erreur lors de l\'initialisation du paiement');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center gap-2 sticky top-0 z-10">
        <button
          onClick={() => router.push('/payer')}
          className="p-1.5 -ml-1.5 rounded-lg active:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <Image src="/logo-dark-rect.png" alt="CÈCHÉMOI" width={100} height={30} className="h-6 w-auto" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 py-3 pb-safe">
        <div className="max-w-md mx-auto space-y-3">
          {/* Amount Display */}
          <div className="bg-amber-500 rounded-xl p-3 text-center shadow-md shadow-amber-500/20">
            <p className="text-amber-100 text-xs">Montant à payer</p>
            <p className="text-2xl font-bold text-white">
              {amount.toLocaleString('fr-FR')} <span className="text-sm font-normal text-amber-100">FCFA</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm border p-3">
              <p className="text-xs font-semibold text-gray-900 mb-2">Vos informations</p>
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07 XX XX XX XX"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods - 3 columns for compact layout */}
            <div className="bg-white rounded-xl shadow-sm border p-3">
              <p className="text-xs font-semibold text-gray-900 mb-2">Mode de paiement</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentChannels.map((channel) => (
                  <button
                    key={channel.code}
                    type="button"
                    onClick={() => setSelectedChannel(channel.code)}
                    disabled={isLoading}
                    className={`relative p-2 rounded-lg border transition-all active:scale-95 ${
                      selectedChannel === channel.code
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 active:border-gray-300 active:bg-gray-50'
                    } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    {selectedChannel === channel.code && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full ${channel.color} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${channel.code === 'MOMOCI' ? 'text-black' : 'text-white'}`}>
                          {channel.abbr}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-700 font-medium text-center leading-tight">
                        {channel.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-red-600 text-xs text-center font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !name || !phone || !selectedChannel}
              className="w-full py-3 bg-amber-500 active:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Payer {amount.toLocaleString('fr-FR')} FCFA
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-[10px] mt-2">
            Paiement sécurisé par PaiementPro
          </p>

          {/* Spacer for WhatsApp floating button */}
          <div className="h-16" />
        </div>
      </main>
    </div>
  );
}
