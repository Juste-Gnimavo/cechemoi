'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [reference, setReference] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    channel?: string;
    date?: string;
  }>({});

  useEffect(() => {
    const ref = searchParams.get('referenceNumber') || searchParams.get('reference');

    if (ref) {
      setReference(ref);
      checkPaymentStatus(ref);
    } else {
      setStatus('success');
      triggerConfetti();
    }
  }, [searchParams]);

  const checkPaymentStatus = async (ref: string) => {
    try {
      const response = await fetch(`/api/payer/status/${ref}`);
      const data = await response.json();

      if (data.success && data.status) {
        if (data.status.success === true) {
          setStatus('success');
          setPaymentDetails({
            amount: data.status.amount,
            channel: data.status.channel,
            date: data.status.date,
          });
          triggerConfetti();
        } else if (data.status.success === false) {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('success');
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.2, 0.8), y: Math.random() - 0.2 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#fbbf24'],
      });
    }, 180);
  };

  const getChannelName = (channel?: string) => {
    const names: Record<string, string> = {
      OMCIV2: 'Orange Money',
      MOMOCI: 'MTN MoMo',
      FLOOZ: 'Moov Money',
      WAVECI: 'Wave',
      CARD: 'Carte Bancaire',
      PAYPAL: 'PayPal',
    };
    return channel ? names[channel] || channel : '';
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <Image src="/logo-dark-rect.png" alt="CÈCHÉMOI" width={120} height={36} className="h-7 w-auto" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Vérification...</h2>
                <p className="text-gray-500 text-sm">Vérification du statut</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Paiement réussi!</h2>
                <p className="text-gray-500 text-sm mb-5">Votre paiement a été effectué avec succès</p>

                {(paymentDetails.amount || reference) && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-2">
                    {paymentDetails.amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Montant</span>
                        <span className="font-bold text-gray-900">{paymentDetails.amount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    )}
                    {paymentDetails.channel && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Mode</span>
                        <span className="text-gray-900">{getChannelName(paymentDetails.channel)}</span>
                      </div>
                    )}
                    {reference && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Réf.</span>
                        <span className="font-mono text-xs text-gray-700 truncate max-w-[180px]">{reference}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => router.push('/payer')}
                  className="w-full py-4 bg-amber-500 active:bg-amber-600 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="h-5 w-5" />
                  Nouveau paiement
                </button>
              </>
            )}

            {status === 'pending' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">En cours...</h2>
                <p className="text-gray-500 text-sm mb-2">Paiement en cours de traitement</p>
                {reference && (
                  <p className="text-gray-400 text-xs mb-5 font-mono truncate">{reference}</p>
                )}
                <button
                  onClick={() => reference && checkPaymentStatus(reference)}
                  className="w-full py-4 bg-amber-500 active:bg-amber-600 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="h-5 w-5" />
                  Actualiser
                </button>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Paiement échoué</h2>
                <p className="text-gray-500 text-sm mb-5">Le paiement n'a pas pu être effectué</p>
                {reference && (
                  <p className="text-gray-400 text-xs mb-5 font-mono truncate">{reference}</p>
                )}
                <button
                  onClick={() => router.push('/payer')}
                  className="w-full py-4 bg-amber-500 active:bg-amber-600 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="h-5 w-5" />
                  Réessayer
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PayerSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
