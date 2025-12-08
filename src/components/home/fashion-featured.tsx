'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'

// Featured fashion items - Will be replaced with API data
const FEATURED_ITEMS = [
  {
    id: '1',
    name: 'Robe Sequins Rouge',
    slug: 'robe-sequins-rouge',
    price: 650000,
    image: '/photos/1.jpg',
    category: 'Robes de soirée',
    isNew: true,
  },
  {
    id: '2',
    name: 'Ensemble Wax Élégance',
    slug: 'ensemble-wax-elegance',
    price: 450000,
    image: '/photos/4.jpg',
    category: 'Ensembles',
    isNew: false,
  },
  {
    id: '3',
    name: 'Robe Brodée Or',
    slug: 'robe-brodee-or',
    price: 850000,
    image: '/photos/11.jpg',
    category: 'Sur-mesure',
    isNew: true,
  },
  {
    id: '4',
    name: 'Tailleur Moderne',
    slug: 'tailleur-moderne',
    price: 550000,
    image: '/photos/3.jpg',
    category: 'Prêt-à-porter',
    isNew: false,
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-CI', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price) + ' FCFA'
}

export function FashionFeatured() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Nouveautés
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
              Nos créations phares
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mt-4 md:mt-0 transition-colors duration-200"
          >
            Voir tout le catalogue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* New Badge */}
                {item.isNew && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                    Nouveau
                  </div>
                )}

                {/* Quick Actions - Show on hover */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Ajouter aux favoris"
                  >
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Ajouter au panier"
                  >
                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {item.category}
                </p>
                <Link href={`/produit/${item.slug}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors duration-200">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-lg font-bold text-primary-500 mt-2">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
