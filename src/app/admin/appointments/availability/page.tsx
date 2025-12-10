'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  RefreshCw,
  Clock,
  Calendar,
  Check,
  X
} from 'lucide-react'

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  breakBetween: number
  enabled: boolean
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/consultations/slots?getAvailability=true')
      if (res.ok) {
        const data = await res.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sort by day of week (Monday first)
  const sortedAvailability = [...availability].sort((a, b) => {
    const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
    const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
    return orderA - orderB
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/appointments"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Disponibilites
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Horaires d'ouverture pour les rendez-vous
            </p>
          </div>
        </div>
        <button
          onClick={fetchAvailability}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Availability Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : sortedAvailability.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune disponibilite configuree</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Jour
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Horaires
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Duree creneau
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Pause entre RDV
                </th>
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAvailability.map((slot) => (
                <tr
                  key={slot.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-500" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dayNames[slot.dayOfWeek]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {slot.slotDuration} min
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {slot.breakBetween} min
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      slot.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {slot.enabled ? (
                        <>
                          <Check className="w-3 h-3" />
                          Ouvert
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Ferme
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && sortedAvailability.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Jours ouverts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedAvailability.filter(s => s.enabled).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Duree creneau</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedAvailability[0]?.slotDuration || 60} min
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pause entre RDV</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedAvailability[0]?.breakBetween || 15} min
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Pour modifier les disponibilites, editez le fichier <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">prisma/seed-consultations.ts</code> et relancez le seed.
        </p>
      </div>
    </div>
  )
}
