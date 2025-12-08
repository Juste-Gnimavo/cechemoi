'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Smartphone, Bell, Gift } from 'lucide-react'

export function AppComingSoonModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check if user has closed the modal in this session
    const hasClosedModal = sessionStorage.getItem('appModalClosed')

    if (!hasClosedModal) {
      // Small delay before showing modal for better UX
      const timer = setTimeout(() => {
        setIsOpen(true)
        setIsAnimating(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsOpen(false)
      // Only remember for current session - will show again on next visit
      sessionStorage.setItem('appModalClosed', 'true')
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${
        isAnimating ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div
        className={`relative w-full max-w-4xl max-h-[95vh] overflow-y-auto transform transition-all duration-500 ${
          isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 rounded-2xl blur-lg opacity-40 animate-pulse" />

        {/* Modal content */}
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 rounded-2xl overflow-hidden border border-primary-500/30 shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200/90 dark:bg-dark-800/90 hover:bg-red-500/80 text-gray-500 dark:text-gray-400 hover:text-white transition-all shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Left side - Image */}
            <div className="relative md:w-2/5 h-48 sm:h-64 md:h-auto">
              <Image
                src="/images/cave-express-lady-min.png"
                alt="Cave Express"
                fill
                className="object-cover object-top"
                priority
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white dark:to-dark-900 hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-dark-900 via-transparent to-transparent md:hidden" />

              {/* Badge on image */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/90 backdrop-blur-sm rounded-full shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-white text-sm font-bold">Nouveauté</span>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="md:w-3/5 p-4 sm:p-6 md:p-8 relative">
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative">
                {/* Phone icons */}
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-700 dark:from-gray-800 to-gray-800 dark:to-gray-900 rounded-xl flex items-center justify-center border border-gray-600 dark:border-gray-700 shadow-lg">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">iOS & Android</span>
                </div>

                {/* Main title */}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Notre Application Mobile
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 mb-3 sm:mb-4">
                  Arrive Bientôt !
                </p>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-5">
                  Commandez vos vins préférés en un clic, où que vous soyez à Abidjan. Livraison rapide garantie.
                </p>

                {/* Discount banner */}
                <div className="relative mb-4 sm:mb-5">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl blur opacity-40" />
                  <div className="relative bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Gift className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-bold text-base sm:text-xl md:text-2xl">
                          -30% sur votre 1ère commande
                        </p>
                        <p className="text-primary-600 dark:text-primary-300 text-xs sm:text-sm">
                          Exclusif aux utilisateurs de l'application
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                  <div className="bg-gray-100/50 dark:bg-dark-800/50 rounded-lg p-2 sm:p-2.5 border border-gray-200 dark:border-dark-700 text-center">
                    <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 dark:text-primary-400 mx-auto mb-1" />
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Commande facile</p>
                  </div>
                  <div className="bg-gray-100/50 dark:bg-dark-800/50 rounded-lg p-2 sm:p-2.5 border border-gray-200 dark:border-dark-700 text-center">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 dark:text-primary-400 mx-auto mb-1" />
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Notifications</p>
                  </div>
                  <div className="bg-gray-100/50 dark:bg-dark-800/50 rounded-lg p-2 sm:p-2.5 border border-gray-200 dark:border-dark-700 text-center">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 dark:text-primary-400 mx-auto mb-1" />
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Offres exclusives</p>
                  </div>
                </div>

                {/* App store buttons */}
                <div className="flex flex-row gap-2 mb-3 sm:mb-4">
                  <button className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 dark:bg-dark-800 hover:bg-gray-700 dark:hover:bg-dark-700 border border-gray-600 dark:border-dark-600 rounded-xl transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[9px] sm:text-[10px] text-gray-300 dark:text-gray-400 leading-none">Bientôt sur</p>
                      <p className="text-xs sm:text-sm text-white font-semibold leading-tight">App Store</p>
                    </div>
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 dark:bg-dark-800 hover:bg-gray-700 dark:hover:bg-dark-700 border border-gray-600 dark:border-dark-600 rounded-xl transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[9px] sm:text-[10px] text-gray-300 dark:text-gray-400 leading-none">Bientôt sur</p>
                      <p className="text-xs sm:text-sm text-white font-semibold leading-tight">Google Play</p>
                    </div>
                  </button>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
                >
                  Continuer mes achats
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
