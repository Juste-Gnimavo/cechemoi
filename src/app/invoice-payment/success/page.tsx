'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, RefreshCw, FileText, Package, User, Home } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface PaymentStatusResponse {
  success: boolean;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
  };
  order?: {
    id: string;
    orderNumber: string;
  } | null;
  payment?: {
    reference: string;
    amount: number;
    channel?: string;
    paidAt?: string;
  };
  error?: string;
}

function InvoicePaymentSuccessContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [reference, setReference] = useState<string>('');
  const [data, setData] = useState<PaymentStatusResponse | null>(null);

  useEffect(() => {
    const ref = searchParams.get('referenceNumber') || searchParams.get('reference');

    if (ref) {
      setReference(ref);
      checkPaymentStatus(ref);
    } else {
      setStatus('failed');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (ref: string) => {
    try {
      const response = await fetch(`/api/invoices/payment/status/${ref}`);
      const result: PaymentStatusResponse = await response.json();

      setData(result);

      if (result.success && result.status === 'COMPLETED') {
        setStatus('success');
        triggerConfetti();
      } else if (result.status === 'FAILED') {
        setStatus('failed');
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('failed');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <Image src="/logo-dark-rect.png" alt="CÈCHÉMOI" width={120} height={36} className="h-7 w-auto" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Vérification...</h2>
                <p className="text-gray-500 text-sm">Vérification du statut de paiement</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Paiement réussi!</h2>
                <p className="text-gray-500 text-sm mb-5">Votre facture a été payée avec succès</p>

                {data && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-2">
                    {data.invoice && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Facture</span>
                        <span className="font-semibold text-gray-900">{data.invoice.invoiceNumber}</span>
                      </div>
                    )}
                    {data.payment?.amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Montant</span>
                        <span className="font-bold text-gray-900">{formatCurrency(data.payment.amount)}</span>
                      </div>
                    )}
                    {data.payment?.channel && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Mode</span>
                        <span className="text-gray-900">{data.payment.channel}</span>
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

                {/* Navigation Buttons */}
                <div className="space-y-3">
                  {data?.invoice && (
                    <Link
                      href={`/account/invoices/${data.invoice.id}`}
                      className="w-full py-3 bg-amber-500 active:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                    >
                      <FileText className="h-5 w-5" />
                      Voir la facture
                    </Link>
                  )}

                  {data?.order && (
                    <Link
                      href={`/account/orders/${data.order.id}`}
                      className="w-full py-3 bg-white border-2 border-gray-200 active:bg-gray-50 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                      <Package className="h-5 w-5" />
                      Voir la commande
                    </Link>
                  )}

                  <Link
                    href="/account"
                    className="w-full py-3 bg-white border-2 border-gray-200 active:bg-gray-50 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <User className="h-5 w-5" />
                    Mon compte
                  </Link>

                  <Link
                    href="/"
                    className="w-full py-3 bg-white border-2 border-gray-200 active:bg-gray-50 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <Home className="h-5 w-5" />
                    Retour à l'accueil
                  </Link>
                </div>
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
                <div className="space-y-3">
                  <button
                    onClick={() => reference && checkPaymentStatus(reference)}
                    className="w-full py-3 bg-amber-500 active:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Actualiser
                  </button>
                  <Link
                    href="/account"
                    className="w-full py-3 bg-white border-2 border-gray-200 active:bg-gray-50 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <User className="h-5 w-5" />
                    Mon compte
                  </Link>
                </div>
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
                  <p className="text-gray-400 text-xs mb-3 font-mono truncate">{reference}</p>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
                  <p className="text-gray-700 text-sm font-medium mb-2">Raisons possibles :</p>
                  <ul className="text-gray-500 text-sm space-y-1">
                    <li>- Solde insuffisant</li>
                    <li>- Transaction annulée</li>
                    <li>- Code de validation incorrect</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  {data?.invoice && (
                    <Link
                      href={`/account/invoices/${data.invoice.id}`}
                      className="w-full py-3 bg-amber-500 active:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Réessayer
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="w-full py-3 bg-white border-2 border-gray-200 active:bg-gray-50 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <User className="h-5 w-5" />
                    Mon compte
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-5">
            Paiement sécurisé par PaiementPro
          </p>
        </div>
      </main>
    </div>
  );
}

export default function InvoicePaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
      }
    >
      <InvoicePaymentSuccessContent />
    </Suspense>
  );
}
