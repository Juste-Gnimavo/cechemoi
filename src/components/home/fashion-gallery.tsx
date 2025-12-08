'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Instagram } from 'lucide-react'

// Gallery photos - showcase the fashion collection
const GALLERY_PHOTOS = [
  '/photos/2.jpg',
  '/photos/5.jpg',
  '/photos/6.jpg',
  '/photos/7.jpg',
  '/photos/8.jpg',
  '/photos/9.jpg',
  '/photos/10.jpg',
  '/photos/12.jpg',
]

export function FashionGallery() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary-500 font-medium uppercase tracking-wider text-sm">
            @cechemoi
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            Suivez-nous sur Instagram
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Découvrez nos dernières créations et inspirations
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GALLERY_PHOTOS.map((photo, index) => (
            <Link
              key={index}
              href="https://instagram.com/cechemoi"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden"
            >
              <Image
                src={photo}
                alt={`CÈCHÉMOI création ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </Link>
          ))}
        </div>

        {/* Follow Button */}
        <div className="text-center mt-8">
          <Link
            href="https://instagram.com/cechemoi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold rounded-full hover:opacity-90 transition-opacity duration-200"
          >
            <Instagram className="w-5 h-5" />
            Suivre @cechemoi
          </Link>
        </div>
      </div>
    </section>
  )
}
