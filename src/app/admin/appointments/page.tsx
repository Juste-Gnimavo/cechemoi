'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Phone,
  Mail,
  ArrowRight,
  Plus,
  Settings,
  RefreshCw
} from 'lucide-react'

interface Appointment {
  id: string
  reference: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  date: string
  time: string
  duration: number
  status: string
  paymentStatus: string
  price: number
  type: {
    name: string
    color: string
  }
}

interface Stats {
  pending: number
  confirmed: number
  completedToday: number
  totalThisWeek: number
}

export default function AppointmentsDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, confirmed: 0, completedToday: 0, totalThisWeek: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/appointments')
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments || [])
        setStats(data.stats || { pending: 0, confirmed: 0, completedToday: 0, totalThisWeek: 0 })
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Sur devis'
    return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
      NO_SHOW: 'Absent'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      UNPAID: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    const labels: Record<string, string> = {
      UNPAID: 'Non payé',
      PAID: 'Payé',
      REFUNDED: 'Remboursé'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.UNPAID}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
     

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Rendez-vous
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Consultations et rendez-vous clients
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <Link
              href="/admin/appointments/availability"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Disponibilités
            </Link>
            <Link
              href="/admin/appointments/services"
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Services
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Confirmés</p>
                <p className="text-3xl font-bold text-blue-500 mt-1">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Terminés aujourd'hui</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cette semaine</p>
                <p className="text-3xl font-bold text-primary-500 mt-1">{stats.totalThisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/appointments?status=pending"
            className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Rendez-vous en attente</span>
            </div>
            <ArrowRight className="w-5 h-5 text-yellow-600" />
          </Link>

          <Link
            href="/admin/appointments/availability"
            className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Gérer mes disponibilités</span>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </Link>

          <Link
            href="/consultation"
            target="_blank"
            className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">Voir page publique</span>
            </div>
            <ArrowRight className="w-5 h-5 text-green-600" />
          </Link>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rendez-vous récents
              </h2>
              <Link
                href="/admin/appointments/list"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun rendez-vous pour le moment</p>
              <Link
                href="/consultation"
                target="_blank"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Partager le lien de réservation
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.slice(0, 10).map((appointment) => (
                <div key={appointment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: appointment.type?.color || '#6b7280' }}
                      >
                        {appointment.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {appointment.customerName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            #{appointment.reference}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {appointment.type?.name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(appointment.date)} à {appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {appointment.customerPhone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        {getPaymentBadge(appointment.paymentStatus)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(appointment.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
