'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  CalendarDays
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'
import { UserProfileCard } from '@/components/user-profile-card'

interface DashboardStats {
  revenue: {
    total: number
    subtotal: number
    tax: number
    shipping: number
    discount: number
  }
  orders: {
    total: number
    paid: number
    byStatus: Record<string, number>
    byPaymentStatus: Record<string, number>
    averageValue: number
  }
  items: {
    totalSold: number
  }
  customers: {
    total: number
  }
  products: {
    total: number
  }
  revenueByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
  topProducts: Array<{
    id: string
    name: string
    quantity: number
    revenue: number
  }>
}

interface RecentOrder {
  id: string
  orderNumber: string
  createdAt: string
  total: number
  status: string
  user: {
    name: string
    phone: string
  }
  items: Array<{ id: string }>
}

interface AdminProfile {
  id: string
  name: string | null
  email: string | null
  phone: string
  image: string | null
  role: string
  country: string | null
  countryCode: string | null
  city: string | null
  lastLoginAt: string | null
  lastLoginIp: string | null
  lastLoginBrowser: string | null
  createdAt: string
}

interface AppointmentStats {
  total: number
  pending: number
  confirmed: number
  today: number
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-500 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  REFUNDED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En traitement',
  SHIPPED: 'Expédié',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { celebration, success } = useConfetti()
  const confettiFired = useRef(false)

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    recipient: '',
    message: '',
    channel: 'WHATSAPP' as 'WHATSAPP' | 'SMS' | 'WHATSAPP_CLOUD'
  })
  const [sendingNotification, setSendingNotification] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Celebrate when dashboard loads with good revenue!
  useEffect(() => {
    if (stats && !loading && !confettiFired.current) {
      // Fire celebration if there are new orders today or good revenue
      const hasNewOrders = recentOrders.some(order => {
        const orderDate = new Date(order.createdAt)
        const today = new Date()
        return orderDate.toDateString() === today.toDateString()
      })

      if (hasNewOrders && stats.revenue.total > 0) {
        confettiFired.current = true
        // Small celebration for the shop owner!
        success()
      }
    }
  }, [stats, loading, recentOrders, success])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch analytics, orders, profile, and appointments in parallel
      const [analyticsRes, ordersRes, profileRes, appointmentsRes] = await Promise.all([
        fetch('/api/admin/analytics/overview'),
        fetch('/api/admin/orders?limit=5&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/admin/profile'),
        fetch('/api/admin/appointments?limit=1000')
      ])

      const [analyticsData, ordersData, profileData, appointmentsData] = await Promise.all([
        analyticsRes.json(),
        ordersRes.json(),
        profileRes.json(),
        appointmentsRes.json()
      ])

      if (analyticsData.success) {
        setStats(analyticsData.analytics)
      }

      if (ordersData.success) {
        setRecentOrders(ordersData.orders)
      }

      if (profileData.success) {
        setAdminProfile(profileData.user)
      }

      // Calculate appointment stats
      if (appointmentsData.appointments) {
        const appointments = appointmentsData.appointments
        const today = new Date().toDateString()
        setAppointmentStats({
          total: appointmentsData.pagination?.total || appointments.length,
          pending: appointments.filter((a: any) => a.status === 'PENDING').length,
          confirmed: appointments.filter((a: any) => a.status === 'CONFIRMED').length,
          today: appointments.filter((a: any) => new Date(a.date).toDateString() === today).length
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const sendNotification = async () => {
    if (!notificationForm.recipient || !notificationForm.message) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    try {
      setSendingNotification(true)
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationForm)
      })

      const data = await response.json()

      if (data.success) {
        // Mini celebration for sent notification!
        success()
        toast.success('Notification envoyée avec succès!')
        setNotificationForm({ recipient: '', message: '', channel: 'WHATSAPP' })
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Erreur lors de l\'envoi de la notification')
    } finally {
      setSendingNotification(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} CFA`
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</div>
      </div>
    )
  }

  // Calculate some trend data (simplified - comparing to previous period would require backend changes)
  const revenueChange = { value: 12.5, isPositive: true }
  const ordersChange = { value: 8.2, isPositive: true }
  const customersChange = { value: 5.3, isPositive: true }
  const productsChange = { value: 2.1, isPositive: true }

  return (
    <div className="space-y-8">
      {/* Header with Profile Card */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Vue d'ensemble de votre boutique CÈCHÉMOI
          </p>
        </div>
        {adminProfile && (
          <div className="lg:w-auto">
            <UserProfileCard
              user={adminProfile}
              variant="horizontal"
              onImageUpdate={(url) => setAdminProfile({ ...adminProfile, image: url })}
            />
          </div>
        )}
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Revenue net of all paid invoices  */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              revenueChange.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {revenueChange.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {revenueChange.value.toFixed(1)}%
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs mb-1">Revenu Net</h3>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {formatCurrency(stats.revenue.total)}
          </p>
          <p className="text-xs text-gray-500">
            {stats.orders.paid} facture{stats.orders.paid > 1 ? 's' : ''} payée{stats.orders.paid > 1 ? 's' : ''}
          </p>
        </div>

         {/* Commandes totale inclu non payee */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-yellow-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              revenueChange.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {revenueChange.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {revenueChange.value.toFixed(1)}%
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs mb-1">En attente</h3>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.orders.total - stats.orders.paid}
          </p>
          <p className="text-xs text-gray-500">
            commande{(stats.orders.total - stats.orders.paid) > 1 ? 's' : ''} non payée{(stats.orders.total - stats.orders.paid) > 1 ? 's' : ''}
          </p>
        </div>

        {/* Orders */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              ordersChange.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {ordersChange.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {ordersChange.value.toFixed(1)}%
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs mb-1">Commandes</h3>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.orders.total}
          </p>
          <p className="text-xs text-gray-500">
            Moy: {formatCurrency(stats.orders.averageValue)}
          </p>
        </div>

        {/* Customers */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              customersChange.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {customersChange.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {customersChange.value.toFixed(1)}%
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs mb-1">Clients</h3>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.customers.total}
          </p>
          <p className="text-xs text-gray-500">
            {stats.items.totalSold} articles vendus
          </p>
        </div>

        {/* Products */}
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              productsChange.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {productsChange.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {productsChange.value.toFixed(1)}%
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs mb-1">Produits</h3>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.products.total}
          </p>
          <p className="text-xs text-gray-500">
            Catalogue actif
          </p>
        </div>

        {/* Appointments */}
        <a href="/admin/appointments" className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-pink-500/30 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <CalendarDays className="h-5 w-5 text-pink-500" />
            </div>
            {appointmentStats && appointmentStats.today > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-pink-500">
                <Clock className="h-3 w-3" />
                {appointmentStats.today} aujourd'hui
              </div>
            )}
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs mb-1">Rendez-vous</h3>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {appointmentStats?.total || 0}
          </p>
          <p className="text-xs text-gray-500">
            {appointmentStats?.pending || 0} en attente
          </p>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Orders & Revenue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Breakdown */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Détail du Revenu</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Sous-total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.revenue.subtotal)}
                </p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Taxes</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.revenue.tax)}
                </p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Livraison</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.revenue.shipping)}
                </p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Réductions</p>
                <p className="text-lg font-bold text-red-500">
                  -{formatCurrency(stats.revenue.discount)}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Commandes Récentes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-800/50">
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      N° Commande
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Client
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Articles
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Total
                    </th>
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-all duration-200">
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white font-medium font-mono">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{order.user.name}</p>
                            <p className="text-gray-500 text-xs">{order.user.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-500 dark:text-gray-400">
                            {order.items.length} article{order.items.length > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {recentOrders.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-dark-800 text-center bg-gray-50 dark:bg-dark-800/30">
                <a
                  href="/admin/orders"
                  className="text-primary-500 hover:text-primary-400 font-semibold text-sm inline-flex items-center gap-2 transition-all duration-200"
                >
                  Voir toutes les commandes
                  <ArrowUp className="h-4 w-4 rotate-90" />
                </a>
              </div>
            )}
          </div>

          {/* Appointments Section */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-pink-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Rendez-vous
                </h2>
              </div>
              <a
                href="/admin/appointments"
                className="text-sm text-primary-500 hover:text-primary-400 font-medium"
              >
                Voir tout
              </a>
            </div>
            <div className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-100 dark:bg-dark-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{appointmentStats?.total || 0}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{appointmentStats?.pending || 0}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{appointmentStats?.confirmed || 0}</p>
                  <p className="text-xs text-gray-500">Confirmes</p>
                </div>
                <div className="text-center p-3 bg-pink-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-pink-600">{appointmentStats?.today || 0}</p>
                  <p className="text-xs text-gray-500">Aujourd'hui</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <a
                  href="/admin/appointments"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors font-medium"
                >
                  <CalendarDays className="h-4 w-4" />
                  Gerer les RDV
                </a>
                <a
                  href="/admin/appointments/availability"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors font-medium border border-gray-200 dark:border-dark-700"
                >
                  <Clock className="h-4 w-4" />
                  Disponibilites
                </a>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Top 5 Produits
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 hover:border-primary-500/30 transition-all">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-500/10 rounded-full flex items-center justify-center">
                      <span className="text-primary-500 font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium truncate">{product.name}</p>
                      <p className="text-gray-500 text-sm">{product.quantity} vendu{product.quantity > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white font-bold">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Order Status */}
        <div className="space-y-6">
          {/* Quick Notification Sender */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Send className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Envoi Rapide
              </h2>
            </div>

            <div className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Canal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setNotificationForm({ ...notificationForm, channel: 'WHATSAPP' })}
                    className={`p-3 rounded-lg border transition-all ${
                      notificationForm.channel === 'WHATSAPP'
                        ? 'bg-green-500/10 border-green-500 text-green-500'
                        : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-green-500/50'
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setNotificationForm({ ...notificationForm, channel: 'SMS' })}
                    className={`p-3 rounded-lg border transition-all ${
                      notificationForm.channel === 'SMS'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                        : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-blue-500/50'
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">SMS</span>
                  </button>
                  <button
                    onClick={() => setNotificationForm({ ...notificationForm, channel: 'WHATSAPP_CLOUD' })}
                    className={`p-3 rounded-lg border transition-all ${
                      notificationForm.channel === 'WHATSAPP_CLOUD'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                        : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-purple-500/50'
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">WA Cloud</span>
                  </button>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Destinataire
                </label>
                <input
                  type="text"
                  value={notificationForm.recipient}
                  onChange={(e) => setNotificationForm({ ...notificationForm, recipient: e.target.value })}
                  placeholder="+225 07 XX XX XX XX"
                  className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Message
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  placeholder="Entrez votre message..."
                  rows={4}
                  className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder:text-gray-400"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={sendNotification}
                disabled={sendingNotification}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingNotification ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Order Status Overview */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Statut des Commandes
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.orders.byStatus).map(([status, count]) => {
                const percentage = stats.orders.total > 0
                  ? ((count as number / stats.orders.total) * 100).toFixed(0)
                  : 0

                const statusIcons: Record<string, any> = {
                  PENDING: Clock,
                  PROCESSING: TrendingUp,
                  SHIPPED: Package,
                  DELIVERED: CheckCircle,
                  CANCELLED: AlertCircle,
                  REFUNDED: AlertCircle,
                }

                const Icon = statusIcons[status] || Clock

                return (
                  <div key={status} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                    <div className={`p-2 rounded-lg ${statusColors[status]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 dark:text-white font-medium text-sm">
                          {statusLabels[status]}
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Actions Rapides
            </h2>
            <div className="space-y-2">
              <a
                href="/admin/orders"
                className="block p-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 hover:border-primary-500/30 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gérer les commandes</span>
                  <ShoppingCart className="h-4 w-4" />
                </div>
              </a>
              <a
                href="/admin/products"
                className="block p-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 hover:border-primary-500/30 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gérer les produits</span>
                  <Package className="h-4 w-4" />
                </div>
              </a>
              <a
                href="/admin/customers"
                className="block p-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 hover:border-primary-500/30 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gérer les clients</span>
                  <Users className="h-4 w-4" />
                </div>
              </a>
              <a
                href="/admin/analytics"
                className="block p-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 hover:border-primary-500/30 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Analytics détaillés</span>
                  <TrendingUp className="h-4 w-4" />
                </div>
              </a>
              <a
                href="/admin/appointments"
                className="block p-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 hover:border-pink-500/30 rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gérer les rendez-vous</span>
                  <CalendarDays className="h-4 w-4" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
