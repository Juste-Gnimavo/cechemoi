'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTheme } from '@/store/theme'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  showBackground?: boolean
}

/**
 * ProductImage component with wine bottle background
 * Applies the bg-product.png background to make transparent product images look beautiful
 */
export function ProductImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  sizes,
  showBackground = true,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()

  const fallbackImage = '/placeholder.png'
  const imageSrc = imageError ? fallbackImage : src

  // Use different gradients for light/dark modes
  const darkGradient = 'radial-gradient(circle closest-side at 50% 50%, #2c3139 0%, #0e1119 100%)'
  const lightGradient = 'radial-gradient(circle closest-side at 50% 50%, #f3f4f6 0%, #e5e7eb 100%)'

  const backgroundStyle = showBackground
    ? {
        backgroundImage: `url(/images/bg-product.png), ${theme === 'dark' ? darkGradient : lightGradient}`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }
    : {}

  if (fill) {
    return (
      <div className="relative w-full h-full" style={backgroundStyle}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={`object-contain transition-all duration-500 ${
            isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          } ${className}`}
          onError={() => setImageError(true)}
          onLoad={() => setIsLoading(false)}
          priority={priority}
          sizes={sizes}
        />
      </div>
    )
  }

  return (
    <div
      className="relative inline-block"
      style={{ ...backgroundStyle, width, height }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`object-contain transition-all duration-500 ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${className}`}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        priority={priority}
      />
    </div>
  )
}
