import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-gray-100 to-gray-50 dark:from-dark-900 dark:to-dark-800 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-sans font-bold text-gray-900 dark:text-white mb-6">
            La QUALITÉ du vin,<br />
            <span className="text-primary-600 dark:text-primary-500">livrée à votre porte</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Plus de 700 références de vins, champagnes et spiritueux.
            Livraison rapide partout à Abidjan.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/vins"
              className="inline-flex items-center px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              Explorer nos vins
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-8 py-3 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
