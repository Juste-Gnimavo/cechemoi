'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Wine, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Wine glass icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-primary-500/10 rounded-full flex items-center justify-center">
            <Wine className="w-16 h-16 text-primary-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-red-400 font-bold text-lg">!</span>
          </div>
        </div>

        {/* 404 text */}
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">
          Page introuvable
        </h2>
        <p className="text-gray-400 mb-8">
          Oups ! Cette page semble avoir disparu comme une bonne bouteille de vin...
        </p>

        {/* Countdown */}
        <div className="mb-8 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
          <p className="text-gray-400">
            Redirection vers l'accueil dans{' '}
            <span className="text-primary-400 font-bold text-xl">{countdown}</span>
            {' '}seconde{countdown > 1 ? 's' : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg border border-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Page précédente
          </button>
        </div>

        {/* Explore link */}
        <p className="mt-8 text-gray-500">
          Ou explorez notre{' '}
          <Link href="/vins" className="text-primary-400 hover:text-primary-300 underline">
            collection de vins
          </Link>
        </p>
      </div>
    </div>
  )
}
