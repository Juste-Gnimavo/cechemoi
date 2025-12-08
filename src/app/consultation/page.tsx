'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface ConsultationType {
  id: string
  name: string
  slug: string
  description: string
  price: number
  duration: number
  features: string[]
  color: string
}

interface TimeSlot {
  time: string
  available: boolean
}

interface BookingState {
  step: 'service' | 'datetime' | 'info' | 'confirmation'
  serviceId: string
  date: Date | null
  time: string
  customerName: string
  customerPhone: string
  customerEmail: string
  customerNotes: string
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function ConsultationPage() {
  const [services, setServices] = useState<ConsultationType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [appointmentRef, setAppointmentRef] = useState('')

  const [booking, setBooking] = useState<BookingState>({
    step: 'service',
    serviceId: '',
    date: null,
    time: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerNotes: ''
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (booking.date) {
      fetchAvailableSlots(booking.date)
    }
  }, [booking.date])

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/consultations/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const res = await fetch(`/api/consultations/slots?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const selectedService = services.find(s => s.id === booking.serviceId)

  const formatPrice = (price: number) => {
    if (price === 0) return 'Sur devis'
    return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA'
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add empty days for padding
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = date.getDay()

    // Past dates not available
    if (date < today) return false

    // Sunday not available
    if (dayOfWeek === 0) return false

    return true
  }

  const isDateSelected = (date: Date) => {
    if (!booking.date) return false
    return date.toDateString() === booking.date.toDateString()
  }

  const handleServiceSelect = (serviceId: string) => {
    setBooking(prev => ({ ...prev, serviceId, step: 'datetime' }))
  }

  const handleDateSelect = (date: Date) => {
    setBooking(prev => ({ ...prev, date, time: '' }))
  }

  const handleTimeSelect = (time: string) => {
    setBooking(prev => ({ ...prev, time }))
  }

  const handleContinueToInfo = () => {
    if (booking.date && booking.time) {
      setBooking(prev => ({ ...prev, step: 'info' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: booking.serviceId,
          date: booking.date?.toISOString(),
          time: booking.time,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          customerNotes: booking.customerNotes
        })
      })

      const data = await res.json()

      if (res.ok) {
        setAppointmentRef(data.reference)
        setSuccess(true)
        setBooking(prev => ({ ...prev, step: 'confirmation' }))
      } else {
        setError(data.error || 'Erreur lors de la réservation')
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Réserver une consultation
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choisissez le service qui vous convient et prenez rendez-vous
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              {['service', 'datetime', 'info', 'confirmation'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      booking.step === step
                        ? 'bg-primary-500 text-white'
                        : index < ['service', 'datetime', 'info', 'confirmation'].indexOf(booking.step)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index < ['service', 'datetime', 'info', 'confirmation'].indexOf(booking.step) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-1 mx-1 ${
                      index < ['service', 'datetime', 'info', 'confirmation'].indexOf(booking.step)
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Service Selection */}
          {booking.step === 'service' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Choisissez votre type de consultation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: service.color + '20' }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color: service.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {service.duration} min
                          </span>
                          <span className="font-semibold text-primary-500">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {booking.step === 'datetime' && (
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setBooking(prev => ({ ...prev, step: 'service' }))}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedService?.color + '20' }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: selectedService?.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedService?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedService?.duration} min • {formatPrice(selectedService?.price || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth(currentMonth).map((date, index) => (
                        <div key={index} className="aspect-square">
                          {date ? (
                            <button
                              onClick={() => isDateAvailable(date) && handleDateSelect(date)}
                              disabled={!isDateAvailable(date)}
                              className={`w-full h-full rounded-lg flex items-center justify-center text-sm transition-colors ${
                                isDateSelected(date)
                                  ? 'bg-primary-500 text-white'
                                  : isDateAvailable(date)
                                    ? 'hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-900 dark:text-white'
                                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              {date.getDate()}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {booking.date
                        ? `Créneaux disponibles le ${booking.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                        : 'Sélectionnez une date'}
                    </h3>

                    {booking.date ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && handleTimeSelect(slot.time)}
                            disabled={!slot.available}
                            className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                              booking.time === slot.time
                                ? 'bg-primary-500 text-white'
                                : slot.available
                                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-900 dark:text-white'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        Veuillez d'abord sélectionner une date
                      </p>
                    )}

                    {booking.date && booking.time && (
                      <button
                        onClick={handleContinueToInfo}
                        className="w-full mt-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        Continuer
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Personal Info */}
          {booking.step === 'info' && (
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => setBooking(prev => ({ ...prev, step: 'datetime' }))}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Vos informations
                </h2>

                {/* Booking Summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">{selectedService?.name}</strong>
                    <br />
                    {booking.date?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {booking.time}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom complet *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={booking.customerName}
                        onChange={(e) => setBooking(prev => ({ ...prev, customerName: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="Votre nom complet"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Téléphone WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={booking.customerPhone}
                        onChange={(e) => setBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="07 XX XX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email (optionnel)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={booking.customerEmail}
                        onChange={(e) => setBooking(prev => ({ ...prev, customerEmail: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="email@exemple.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes / Ce que vous souhaitez discuter
                    </label>
                    <textarea
                      value={booking.customerNotes}
                      onChange={(e) => setBooking(prev => ({ ...prev, customerNotes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      placeholder="Décrivez votre projet, vos attentes..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-4 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !booking.customerName || !booking.customerPhone}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Réservation en cours...
                      </>
                    ) : (
                      <>
                        Confirmer le rendez-vous
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {booking.step === 'confirmation' && success && (
            <div className="max-w-xl mx-auto text-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Rendez-vous confirmé !
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Votre demande a été enregistrée. Vous recevrez une confirmation par SMS/WhatsApp.
                </p>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Référence :</strong> {appointmentRef}
                    <br />
                    <strong className="text-gray-900 dark:text-white">Service :</strong> {selectedService?.name}
                    <br />
                    <strong className="text-gray-900 dark:text-white">Date :</strong> {booking.date?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    <br />
                    <strong className="text-gray-900 dark:text-white">Heure :</strong> {booking.time}
                    <br />
                    <strong className="text-gray-900 dark:text-white">Prix :</strong> {formatPrice(selectedService?.price || 0)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/"
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                  >
                    Retour à l'accueil
                  </Link>
                  <a
                    href={`https://wa.me/2250759545410?text=Bonjour, j'ai réservé un rendez-vous (${appointmentRef})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Contacter sur WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
