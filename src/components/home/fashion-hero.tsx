'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

// Hero slide banners (images contain their own text/branding)
const HERO_SLIDES = [
  { id: 1, image: '/slides/slide1.jpg?v=2', alt: 'Bienvenue sur la plateforme CÈCHÉMOI — L\'excellence au service de votre style' },
  { id: 2, image: '/slides/slide2.jpg?v=2', alt: 'Nouvelle Collection 2026 — Élégance, Style Africain, Prêt-à-Porter, Sur-Mesure' },
  { id: 3, image: '/slides/slide3.jpg?v=2', alt: 'CÈCHÉMOI — Mode Africaine, Élégance et Tradition' },
]

const SLIDE_INTERVAL = 5000 // 5 seconds

export function FashionHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  }, [])

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(nextSlide, SLIDE_INTERVAL)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  // Pause auto-play when user interacts
  const handleManualChange = (action: () => void) => {
    setIsAutoPlaying(false)
    action()
    // Resume after 10 seconds of no interaction
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const slide = HERO_SLIDES[currentSlide]

  return (
    <section className="relative w-full bg-gray-900 overflow-hidden">
      {/* Slide Image — natural proportions, full width */}
      <div className="relative w-full">
        <Image
          src={slide.image}
          alt={slide.alt}
          width={1600}
          height={1066}
          priority
          sizes="100vw"
          className="w-full h-auto block transition-opacity duration-700"
        />
        {/* Subtle bottom gradient for CTA readability */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* CTA Buttons — overlaid at bottom */}
      <div className="absolute bottom-6 left-0 right-0 z-10">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-colors duration-200 text-sm md:text-base"
            >
              Découvrir la collection
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
            <Link
              href="/sur-mesure"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20 text-sm md:text-base"
            >
              Sur-mesure
            </Link>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <button
              onClick={() => handleManualChange(prevSlide)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Slide Indicators */}
            <div className="flex items-center gap-1.5 mx-2">
              {HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleManualChange(() => setCurrentSlide(index))}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === currentSlide
                      ? 'w-6 bg-primary-500'
                      : 'w-2 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Aller à l'image ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => handleManualChange(nextSlide)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
