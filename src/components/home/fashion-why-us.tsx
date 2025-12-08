'use client'

import { Scissors, Truck, Award, HeartHandshake } from 'lucide-react'

const FEATURES = [
  {
    icon: Scissors,
    title: 'Sur-Mesure',
    description: 'Chaque pièce est confectionnée selon vos mensurations exactes.',
  },
  {
    icon: Award,
    title: 'Qualité Premium',
    description: 'Tissus de haute qualité et finitions soignées.',
  },
  {
    icon: Truck,
    title: 'Livraison Rapide',
    description: 'Livraison en 24-48h sur Abidjan et environs.',
  },
  {
    icon: HeartHandshake,
    title: 'Service Client',
    description: 'Accompagnement personnalisé du choix à la livraison.',
  },
]

export function FashionWhyUs() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
            Pourquoi nous choisir
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            L'excellence au service de votre style
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <feature.icon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
