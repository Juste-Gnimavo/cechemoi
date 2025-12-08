'use client'

import { useState } from 'react'
import { MapPin, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface GeolocationData {
  latitude: number
  longitude: number
  accuracy: number
}

interface GeolocationCaptureProps {
  onLocationCaptured: (data: GeolocationData) => void
  currentLocation?: GeolocationData | null
  className?: string
}

export function GeolocationCapture({
  onLocationCaptured,
  currentLocation,
  className = '',
}: GeolocationCaptureProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur')
      setError('Géolocalisation non supportée')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoData: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }

        onLocationCaptured(geoData)
        toast.success('Position capturée avec succès!')
        setLoading(false)
      },
      (error) => {
        let errorMessage = 'Erreur lors de la capture de position'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible'
            break
          case error.TIMEOUT:
            errorMessage = 'Délai de géolocalisation dépassé'
            break
        }

        toast.error(errorMessage)
        setError(errorMessage)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-500 dark:text-primary-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Position GPS</span>
        </div>

        <button
          type="button"
          onClick={captureLocation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Capture en cours...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              Capturer ma position
            </>
          )}
        </button>
      </div>

      {currentLocation && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-green-600 dark:text-green-400 font-medium mb-1">Position capturée</p>
              <div className="text-green-700/80 dark:text-green-300/80 space-y-1">
                <p>Latitude: {currentLocation.latitude.toFixed(6)}°</p>
                <p>Longitude: {currentLocation.longitude.toFixed(6)}°</p>
                <p>Précision: ±{Math.round(currentLocation.accuracy)}m</p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 mt-2 underline"
              >
                <MapPin className="h-3 w-3" />
                Voir sur Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {error && !currentLocation && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          </div>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Astuce:</strong> La position GPS permet au livreur de vous localiser précisément,
          même sans adresse complète. Très utile dans les zones sans numérotation.
        </p>
      </div>
    </div>
  )
}
