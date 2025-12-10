'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import {
  CalendarDays,
  Filter,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre']

interface TimeSlot {
  time: string
  available: boolean
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 })

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/appointments')
    }
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetchAppointments()
  }, [session, page, statusFilter])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/account/appointments?page=${page}&status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
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

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-yellow-500/20 text-yellow-500', label: 'En attente' },
      CONFIRMED: { color: 'bg-blue-500/20 text-blue-500', label: 'Confirme' },
      COMPLETED: { color: 'bg-green-500/20 text-green-500', label: 'Termine' },
      CANCELLED: { color: 'bg-red-500/20 text-red-500', label: 'Annule' },
      NO_SHOW: { color: 'bg-gray-500/20 text-gray-500', label: 'Absent' },
    }
    return statuses[status] || { color: 'bg-gray-500/20 text-gray-500', label: status }
  }

  const getPaymentInfo = (status: string) => {
    const statuses: Record<string, { color: string; label: string }> = {
      UNPAID: { color: 'text-orange-500', label: 'Non paye' },
      PAID: { color: 'text-green-500', label: 'Paye' },
      REFUNDED: { color: 'text-gray-500', label: 'Rembourse' },
    }
    return statuses[status] || { color: 'text-gray-500', label: status }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Sur devis'
    return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA'
  }

  // Cancel functions
  const handleCancelClick = (appointmentId: string) => {
    setCancellingId(appointmentId)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleCancelConfirm = async () => {
    if (!cancellingId) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/account/appointments/${cancellingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })
      if (res.ok) {
        setShowCancelModal(false)
        setCancellingId(null)
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error cancelling:', error)
    } finally {
      setCancelling(false)
    }
  }

  // Reschedule functions
  const handleRescheduleClick = (appointment: any) => {
    setReschedulingAppointment(appointment)
    setSelectedDate(null)
    setSelectedTime('')
    setAvailableSlots([])
    setShowRescheduleModal(true)
  }

  const handleRescheduleConfirm = async () => {
    if (!reschedulingAppointment || !selectedDate || !selectedTime) return
    setRescheduling(true)
    try {
      const res = await fetch(`/api/account/appointments/${reschedulingAppointment.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          time: selectedTime
        })
      })
      if (res.ok) {
        setShowRescheduleModal(false)
        setReschedulingAppointment(null)
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error rescheduling:', error)
    } finally {
      setRescheduling(false)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = date.getDay()
    if (date < today) return false
    if (dayOfWeek === 0) return false
    return true
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Rendez-vous</h1>
            <Link href="/account" className="text-primary-400 hover:text-primary-300">
              ← Retour
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-900/50 rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-dark-900/50 rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">Confirmes</p>
              <p className="text-2xl font-bold text-blue-500">{stats.confirmed}</p>
            </div>
            <div className="bg-white dark:bg-dark-900/50 rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">Termines</p>
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-dark-900/50 rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">Annules</p>
              <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white dark:bg-dark-900/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700"
              >
                <option value="all">Tous les rendez-vous</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmes</option>
                <option value="COMPLETED">Termines</option>
                <option value="CANCELLED">Annules</option>
              </select>
              <Link
                href="/consultation"
                className="ml-auto bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Nouveau rendez-vous
              </Link>
            </div>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white dark:bg-dark-900/50 rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50">
              <CalendarDays className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun rendez-vous trouve</p>
              <Link
                href="/consultation"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg"
              >
                Prendre rendez-vous
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white dark:bg-dark-900/50 rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 hover:border-primary-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                          {apt.type?.name}
                        </h3>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          #{apt.reference}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {new Date(apt.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })} a {apt.time}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusInfo(apt.status).color}`}>
                      {getStatusInfo(apt.status).label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Duree</p>
                      <p className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {apt.duration} min
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Prix</p>
                      <p className="text-gray-900 dark:text-white font-bold">{formatPrice(apt.price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Paiement</p>
                      <span className={`text-sm font-medium ${getPaymentInfo(apt.paymentStatus).color}`}>
                        {getPaymentInfo(apt.paymentStatus).label}
                      </span>
                    </div>
                  </div>

                  {['PENDING', 'CONFIRMED'].includes(apt.status) && (
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                      <button
                        onClick={() => handleRescheduleClick(apt)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Reporter
                      </button>
                      <button
                        onClick={() => handleCancelClick(apt.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700"
              >
                Precedent
              </button>
              <span className="text-gray-900 dark:text-white px-4 py-2">
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Annuler le rendez-vous
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Cette action est irreversible. Vous devrez reprendre un nouveau rendez-vous.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raison (optionnel)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none"
                placeholder="Pourquoi annulez-vous?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium"
              >
                Non, garder
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && reschedulingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reporter le rendez-vous
                </h3>
                <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {reschedulingAppointment.type?.name} - #{reschedulingAppointment.reference}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h4>
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
                            onClick={() => isDateAvailable(date) && setSelectedDate(date)}
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
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedDate
                      ? `Creneaux le ${selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                      : 'Selectionnez une date'}
                  </h4>

                  {selectedDate ? (
                    availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                              selectedTime === slot.time
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
                        Aucun creneau disponible ce jour
                      </p>
                    )
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Veuillez d'abord selectionner une date
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRescheduleConfirm}
                  disabled={rescheduling || !selectedDate || !selectedTime}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {rescheduling ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
