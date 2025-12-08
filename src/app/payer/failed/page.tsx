'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams.get('referenceNumber') || searchParams.get('reference') || '';
  const errorMessage = searchParams.get('error') || 'Le paiement n\'a pas pu être effectué';

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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Paiement échoué</h2>
            <p className="text-gray-500 text-sm mb-5">{errorMessage}</p>

            {reference && (
              <p className="text-gray-400 text-xs mb-4 font-mono truncate">{reference}</p>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
              <p className="text-gray-700 text-sm font-medium mb-2">Raisons possibles :</p>
              <ul className="text-gray-500 text-sm space-y-1">
                <li>• Solde insuffisant</li>
                <li>• Transaction annulée</li>
                <li>• Code de validation incorrect</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/payer')}
              className="w-full py-4 bg-amber-500 active:bg-amber-600 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="h-5 w-5" />
              Réessayer
            </button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-5">
            Besoin d'aide ?{' '}
            <a href="tel:+2250707517917" className="text-amber-600 font-medium">
              07 07 51 79 17
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PayerFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
      }
    >
      <FailedContent />
    </Suspense>
  );
}
