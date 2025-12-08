'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ProductImage } from '@/components/ui/product-image'
import { Sparkles } from 'lucide-react'

const spirits = [
  { name: 'Vin Rouge', slug: 'rouge', image: '/images/ROU-MUCH-MA-3043.png' },
  { name: 'Vin Blanc', slug: 'blanc', image: '/images/ROU-CARILL-0691.png' },
  { name: 'Vin Rosé', slug: 'rose', image: '/images/ROU-BLAN-MOEL-DUCH-LOUI-9793.png' },
  { name: 'Champagne', slug: 'champagne', image: '/images/ROU-IND-MER-CAB-SEC-6123.png' },
  { name: 'Effervescent', slug: 'effervescent', image: '/images/vin-rouge.png' },
  { name: 'Bio & Nature', slug: 'bio', image: '/images/ROU-ROSE-INS-DEMISEC-7496.png' },
]

export function SpiritsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#13151a] dark:to-[#1a1d24] relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
              Catégories
            </span>
            <Sparkles className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-gray-900 dark:text-white mb-4">
            Spectre des Saveurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Explorez la riche tapisserie des vins, où chaque bouteille offre une révélation distincte de saveur,
            d&apos;arôme et d&apos;histoire.
          </p>
        </div>

        {/* Spirits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {spirits.map((spirit, index) => (
            <Link
              key={spirit.name}
              href={`/vins/${spirit.slug}`}
              className={`flex flex-col items-center group cursor-pointer transition-all duration-700 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Product Image with animated container */}
              <div className="relative w-24 h-36 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/20 rounded-full blur-xl transition-all duration-500" />

                {/* Product Image */}
                <div className="relative w-full h-full">
                  <ProductImage
                    src={spirit.image}
                    alt={spirit.name}
                    fill
                    className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 drop-shadow-lg group-hover:drop-shadow-2xl"
                  />
                </div>
              </div>

              {/* Label with underline animation */}
              <div className="relative">
                <span className="text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white font-medium transition-colors duration-300 text-sm">
                  {spirit.name}
                </span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* Browse all categories link */}
        <div className={`text-center mt-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} style={{ transitionDelay: '800ms' }}>
          <Link
            href="/vins"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 font-semibold transition-colors"
          >
            Explorer toutes les catégories
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

// Re-export for backward compatibility
export { SpiritsSection as SpiritsSectionComponent }
