'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

// Fashion photos for the hero
const HERO_SLIDES = [
  { id: 1, image: '/photos/0.png', title: 'Collection Élégance', subtitle: 'Robes de soirée sur-mesure' },
  { id: 2, image: '/photos/01.png', title: 'Style Africain', subtitle: 'Tradition et modernité' },
  { id: 3, image: '/photos/02.jpg', title: 'Prêt-à-Porter', subtitle: 'Mode accessible et tendance' },
  { id: 4, image: '/photos/03.jpg', title: 'Sur-Mesure', subtitle: 'Créations uniques pour vous' },
      { id: 5, image: '/photos/04.jpg', title: 'Sur-Mesure', subtitle: 'Créations uniques pour vous' },
        { id: 6, image: '/photos/05.jpg', title: 'Sur-Mesure', subtitle: 'Créations uniques pour vous' },
    { id: 7, image: '/photos/03.jpg', title: 'Sur-Mesure', subtitle: 'Créations uniques pour vous' },
      { id: 8, image: '/photos/01.jpg', title: 'Style Africain', subtitle: 'Tradition et modernité' },

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
    <section className="relative h-[calc(100vh-5rem)] min-h-[600px] bg-gray-900 overflow-hidden">
      {/* Background Image - Simple fade transition */}
      <div className="absolute inset-0">
        <Image
          src={slide.image}
          alt={slide.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top transition-opacity duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
              <span className="text-white/90 text-sm font-medium">Nouvelle Collection 2025</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {slide.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              {slide.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-colors duration-200"
              >
                Découvrir la collection
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/sur-mesure"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20"
              >
                Sur-mesure
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-8 right-8 flex items-center gap-3 z-20">
        <button
          onClick={() => handleManualChange(prevSlide)}
          className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20"
          aria-label="Image précédente"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleManualChange(nextSlide)}
          className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors duration-200 border border-white/20"
          aria-label="Image suivante"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualChange(() => setCurrentSlide(index))}
            className={`h-2 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? 'w-8 bg-primary-500'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Aller à l'image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
