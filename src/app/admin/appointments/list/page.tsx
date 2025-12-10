'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Eye,
  RefreshCw,
  CalendarDays,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MessageCircle,
  Send,
  Loader2,
  Bell
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AdminPagination } from '@/components/admin/admin-pagination'

interface Appointment {
  id: string
  reference: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  customerNotes: string | null
  date: string
  time: string
  duration: number
  status: string
  paymentStatus: string
  price: number
  adminNotes: string | null
  type: {
    name: string
    color: string
  }
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirme',
  COMPLETED: 'Termine',
  CANCELLED: 'Annule',
  NO_SHOW: 'Absent'
}

const paymentStatusColors: Record<string, string> = {
  UNPAID: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const paymentLabels: Record<string, string> = {
  UNPAID: 'Non paye',
  PAID: 'Paye',
  REFUNDED: 'Rembourse'
}

export default function AppointmentsListPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: ''
  })
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, completedToday: 0, totalThisWeek: 0 })

  // Notification state
  const [customMessage, setCustomMessage] = useState('')
  const [sendingNotification, setSendingNotification] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [filters, activeTab, pagination.page, pagination.limit])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filters, activeTab])

  const fetchAppointments = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      // Apply tab filter
      if (activeTab !== 'all') {
        params.append('status', activeTab.toUpperCase())
      } else if (filters.status) {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/admin/appointments?${params.toString()}`)
      const data = await response.json()

      if (data.appointments) {
        let filtered = data.appointments

        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filtered = filtered.filter((apt: Appointment) =>
            apt.customerName.toLowerCase().includes(searchLower) ||
            apt.customerPhone.includes(filters.search) ||
            apt.reference.toLowerCase().includes(searchLower)
          )
        }

        // Client-side payment filter
        if (filters.paymentStatus) {
          filtered = filtered.filter((apt: Appointment) => apt.paymentStatus === filters.paymentStatus)
        }

        setAppointments(filtered)
        setStats(data.stats || { pending: 0, confirmed: 0, completedToday: 0, totalThisWeek: 0 })
        if (data.pagination) {
          setPagination(data.pagination)
        }
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
      month: 'short',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Sur devis'
    return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA'
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      setUpdating(true)
      const response = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        fetchAppointments()
        setShowModal(false)
        setSelectedAppointment(null)
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentUpdate = async (id: string, paymentStatus: string) => {
    try {
      setUpdating(true)
      const response = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus })
      })

      if (response.ok) {
        fetchAppointments()
        setShowModal(false)
        setSelectedAppointment(null)
      }
    } catch (error) {
      console.error('Error updating payment:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  const handleSendNotification = async (type: string) => {
    if (!selectedAppointment) return
    if (type === 'custom' && !customMessage.trim()) {
      toast.error('Veuillez saisir un message')
      return
    }

    setSendingNotification(true)
    try {
      const response = await fetch(`/api/admin/appointments/${selectedAppointment.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          customMessage: type === 'custom' ? customMessage : undefined
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const channels = []
        if (data.channels?.sms) channels.push('SMS')
        if (data.channels?.whatsapp) channels.push('WhatsApp')
        toast.success(`Notification envoyee (${channels.join(' + ')})`)
        setCustomMessage('')
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingNotification(false)
    }
  }

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tous les rendez-vous
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {pagination.totalCount} rendez-vous au total
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'pending'
              ? 'text-yellow-500 border-b-2 border-yellow-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          En attente ({stats.pending})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'confirmed'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Confirmes ({stats.confirmed})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'completed'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Termines
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cancelled'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Annules
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, tel, reference..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-gray-600"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-gray-600"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirme</option>
            <option value="COMPLETED">Termine</option>
            <option value="CANCELLED">Annule</option>
            <option value="NO_SHOW">Absent</option>
          </select>

          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-gray-600"
          >
            <option value="">Paiement</option>
            <option value="UNPAID">Non paye</option>
            <option value="PAID">Paye</option>
            <option value="REFUNDED">Rembourse</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun rendez-vous trouve</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Client
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Service
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Date & Heure
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Statut
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Paiement
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Prix
                    </th>
                    <th className="text-right px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: appointment.type?.color || '#6b7280' }}
                          >
                            {appointment.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {appointment.customerName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              #{appointment.reference}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 dark:text-white">
                          {appointment.type?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {appointment.duration} min
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 dark:text-white">
                          {formatDate(appointment.date)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {appointment.time}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                          {statusLabels[appointment.status] || appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[appointment.paymentStatus]}`}>
                          {paymentLabels[appointment.paymentStatus] || appointment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {formatPrice(appointment.price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`https://wa.me/${appointment.customerPhone.replace(/\s/g, '')}?text=Bonjour ${appointment.customerName}, concernant votre rendez-vous ${appointment.reference}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <a
                            href={`tel:${appointment.customerPhone}`}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Appeler"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowModal(true)
                            }}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemName="rendez-vous"
            />
          </>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rendez-vous #{selectedAppointment.reference}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedAppointment(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Client</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.customerName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedAppointment.customerPhone}
                    </span>
                    {selectedAppointment.customerEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedAppointment.customerEmail}
                      </span>
                    )}
                  </div>
                  {selectedAppointment.customerNotes && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
                      <strong>Notes:</strong> {selectedAppointment.customerNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Details</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Service</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedAppointment.type?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(selectedAppointment.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Heure</span>
                    <span className="text-gray-900 dark:text-white">{selectedAppointment.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duree</span>
                    <span className="text-gray-900 dark:text-white">{selectedAppointment.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prix</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(selectedAppointment.price)}</span>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Changer le statut</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'CONFIRMED')}
                    disabled={updating || selectedAppointment.status === 'CONFIRMED'}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'COMPLETED')}
                    disabled={updating || selectedAppointment.status === 'COMPLETED'}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Terminer
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'NO_SHOW')}
                    disabled={updating || selectedAppointment.status === 'NO_SHOW'}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Client absent
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'CANCELLED')}
                    disabled={updating || selectedAppointment.status === 'CANCELLED'}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>

              {/* Payment Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Paiement</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePaymentUpdate(selectedAppointment.id, 'PAID')}
                    disabled={updating || selectedAppointment.paymentStatus === 'PAID'}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Marquer paye
                  </button>
                  <button
                    onClick={() => handlePaymentUpdate(selectedAppointment.id, 'REFUNDED')}
                    disabled={updating || selectedAppointment.paymentStatus === 'REFUNDED'}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Rembourser
                  </button>
                </div>
              </div>

              {/* Send Notification Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Envoyer une notification (SMS + WhatsApp)
                </h4>

                {/* Quick Templates */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => handleSendNotification('confirmation')}
                    disabled={sendingNotification}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Confirmation
                  </button>
                  <button
                    onClick={() => handleSendNotification('reminder')}
                    disabled={sendingNotification}
                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Rappel
                  </button>
                  <button
                    onClick={() => handleSendNotification('cancellation')}
                    disabled={sendingNotification}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Annulation
                  </button>
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Message personnalise..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSendNotification('custom')}
                    disabled={sendingNotification || !customMessage.trim()}
                    className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {sendingNotification ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Envoyer message
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/${selectedAppointment.customerPhone.replace(/\s/g, '')}?text=Bonjour ${selectedAppointment.customerName}, concernant votre rendez-vous ${selectedAppointment.reference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${selectedAppointment.customerPhone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Appeler
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
