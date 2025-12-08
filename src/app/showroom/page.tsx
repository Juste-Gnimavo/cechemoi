'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, X, Maximize2, Heart,
  Grid3x3, Play, Pause, Sparkles, ArrowLeft
} from 'lucide-react'

// 20 photos in public/photos
const photos = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  src: `/photos/${i + 1}.jpg`,
  title: `Création CÈCHÉMOI ${i + 1}`,
  description: `Tenue exclusive - Design ivoirien moderne et élégant`,
  category: i % 4 === 0 ? 'Sur-mesure' : i % 4 === 1 ? 'Robes' : i % 4 === 2 ? 'Ensembles' : 'Prêt-à-porter'
}))

// Group photos in pairs for slideshow
const photoPairs = () => {
  const pairs = []
  for (let i = 0; i < photos.length; i += 2) {
    pairs.push({
      left: photos[i],
      right: photos[i + 1] || null,
      pairIndex: Math.floor(i / 2)
    })
  }
  return pairs
}

const PAIRS = photoPairs()
const SLIDE_INTERVAL = 5000

export default function ShowroomPage() {
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'slideshow' | 'grid'>('slideshow')
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  // Navigation
  const nextPair = useCallback(() => {
    setCurrentPairIndex((prev) => (prev + 1) % PAIRS.length)
  }, [])

  const prevPair = useCallback(() => {
    setCurrentPairIndex((prev) => (prev === 0 ? PAIRS.length - 1 : prev - 1))
  }, [])

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || viewMode !== 'slideshow') return
    const interval = setInterval(nextPair, SLIDE_INTERVAL)
    return () => clearInterval(interval)
  }, [isAutoPlaying, viewMode, nextPair])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false)
        if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
        if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % photos.length)
      } else if (viewMode === 'slideshow') {
        if (e.key === 'ArrowLeft') { setIsAutoPlaying(false); prevPair() }
        if (e.key === 'ArrowRight') { setIsAutoPlaying(false); nextPair() }
        if (e.key === ' ') { e.preventDefault(); setIsAutoPlaying(!isAutoPlaying) }
        if (e.key === 'g' || e.key === 'G') setViewMode('grid')
      } else {
        if (e.key === 's' || e.key === 'S') setViewMode('slideshow')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, viewMode, isAutoPlaying, nextPair, prevPair])

  const openLightbox = (photoIndex: number) => {
    setLightboxIndex(photoIndex)
    setIsLightboxOpen(true)
  }

  const toggleFavorite = (photoId: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(photoId)) {
        newFavorites.delete(photoId)
      } else {
        newFavorites.add(photoId)
      }
      return newFavorites
    })
  }

  const currentPair = PAIRS[currentPairIndex]

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="py-4 px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Accueil</span>
          </Link>

          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-400" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Showroom CÈCHÉMOI</h1>
              <p className="text-xs text-gray-400">Découvrez notre univers créatif</p>
            </div>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'slideshow' : 'grid')}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title={viewMode === 'grid' ? 'Mode slideshow (S)' : 'Mode grille (G)'}
          >
            <Grid3x3 className="w-5 h-5 text-gray-300" />
          </button>
        </header>

        {/* Slideshow Mode */}
        {viewMode === 'slideshow' && (
          <div className="flex-1 relative">
            {/* Photos Side by Side */}
            <div className="absolute inset-0 flex">
              {/* Left Photo */}
              <div className="flex-1 relative group">
                <Image
                  src={currentPair.left.src}
                  alt={currentPair.left.title}
                  fill
                  className="object-cover cursor-pointer"
                  onClick={() => openLightbox(currentPair.left.id - 1)}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block px-3 py-1 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-full text-xs mb-2">
                    {currentPair.left.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{currentPair.left.title}</h3>
                  <p className="text-gray-300 text-sm">{currentPair.left.description}</p>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(currentPair.left.id) }}
                    className={`p-2 rounded-full backdrop-blur-sm border transition-colors ${
                      favorites.has(currentPair.left.id)
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'bg-black/30 border-white/20 text-white hover:bg-black/50'
                    }`}
                  >
                    <Heart className="w-5 h-5" fill={favorites.has(currentPair.left.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => openLightbox(currentPair.left.id - 1)}
                    className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-black/50 transition-colors"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-white/20" />

              {/* Right Photo */}
              {currentPair.right && (
                <div className="flex-1 relative group">
                  <Image
                    src={currentPair.right.src}
                    alt={currentPair.right.title}
                    fill
                    className="object-cover cursor-pointer"
                    onClick={() => openLightbox(currentPair.right!.id - 1)}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block px-3 py-1 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-full text-xs mb-2">
                      {currentPair.right.category}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-1">{currentPair.right.title}</h3>
                    <p className="text-gray-300 text-sm">{currentPair.right.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(currentPair.right!.id) }}
                      className={`p-2 rounded-full backdrop-blur-sm border transition-colors ${
                        favorites.has(currentPair.right!.id)
                          ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : 'bg-black/30 border-white/20 text-white hover:bg-black/50'
                      }`}
                    >
                      <Heart className="w-5 h-5" fill={favorites.has(currentPair.right!.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => openLightbox(currentPair.right!.id - 1)}
                      className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-black/50 transition-colors"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => { setIsAutoPlaying(false); prevPair() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => { setIsAutoPlaying(false); nextPair() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {PAIRS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => { setCurrentPairIndex(index); setIsAutoPlaying(false) }}
                  className={`h-1.5 rounded-full transition-all ${
                    currentPairIndex === index
                      ? 'w-8 bg-primary-400'
                      : 'w-3 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="absolute top-20 right-6 p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors z-20"
              title={isAutoPlaying ? 'Pause (Espace)' : 'Play (Espace)'}
            >
              {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Grid Mode */}
        {viewMode === 'grid' && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                    onClick={() => openLightbox(index)}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm mb-1">{photo.title}</h3>
                        <span className="inline-block px-2 py-0.5 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-full text-xs">
                          {photo.category}
                        </span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id) }}
                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm border transition-colors ${
                          favorites.has(photo.id)
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-black/30 border-white/20 text-white'
                        }`}
                      >
                        <Heart className="w-4 h-4" fill={favorites.has(photo.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-3 px-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←→</kbd> Navigation
              </span>
              <span className="hidden sm:inline">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">G</kbd> Grille
              </span>
              <span className="hidden sm:inline">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Espace</kbd> Pause
              </span>
            </div>

            <span className="text-primary-400">{photos.length} créations exclusives</span>

            <span>{viewMode === 'slideshow' ? `${currentPairIndex + 1} / ${PAIRS.length}` : 'Grille'}</span>
          </div>
        </footer>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center">
          {/* Close */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-colors z-60"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={() => setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-colors z-60"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setLightboxIndex((prev) => (prev + 1) % photos.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-colors z-60"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image */}
          <div className="relative max-w-5xl max-h-[85vh] mx-4">
            <Image
              src={photos[lightboxIndex].src}
              alt={photos[lightboxIndex].title}
              width={1200}
              height={1600}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
              priority
            />

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent rounded-b-lg">
              <span className="inline-block px-3 py-1 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-full text-xs mb-2">
                {photos[lightboxIndex].category}
              </span>
              <h2 className="text-2xl font-bold text-white mb-1">{photos[lightboxIndex].title}</h2>
              <p className="text-gray-300">{photos[lightboxIndex].description}</p>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => toggleFavorite(photos[lightboxIndex].id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                    favorites.has(photos[lightboxIndex].id)
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={favorites.has(photos[lightboxIndex].id) ? 'currentColor' : 'none'} />
                  <span className="text-sm">
                    {favorites.has(photos[lightboxIndex].id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </span>
                </button>

                <Link
                  href="/sur-mesure"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Commander sur-mesure
                </Link>
              </div>
            </div>
          </div>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 border border-white/20 rounded-full text-white text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </main>
  )
}
