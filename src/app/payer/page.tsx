'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function PayerPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (parsedAmount < 100) {
      setError('Le montant minimum est de 100 FCFA');
      return;
    }

    if (parsedAmount > 10000000) {
      setError('Le montant maximum est de 10 000 000 FCFA');
      return;
    }

    router.push(`/payer/${parsedAmount}`);
  };


  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 safe-area-top">
        <Image
          src="/logo-dark-rect.png"
          alt="Cave Express"
          width={120}
          height={36}
          className="h-7 w-auto"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-4 py-6">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Paiement
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Entrez le montant à payer
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="100"
                    max="10000000"
                    autoComplete="off"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    FCFA
                  </span>
                </div>
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!amount}
                className="w-full py-4 bg-amber-500 active:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:shadow-none"
              >
                Continuer
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-5">
            Paiement sécurisé par PaiementPro
          </p>
        </div>
      </main>
    </div>
  );
}
