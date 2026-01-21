'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShoppingBag,
  Users,
  CreditCard,
  Ruler,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TeamMember {
  id: string
  name: string | null
  email: string | null
  phone: string
  role: string
  createdAt: string
  lastLoginAt: string | null
  image?: string
}

interface Stats {
  customOrdersCreated: number
  customOrdersValue: number
  customersCreated: number
  paymentsReceived: number
  paymentsValue: number
  measurementsTaken: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  priority: string
  totalCost: number
  orderDate: string
  customer: {
    id: string
    name: string
    phone: string
  }
  _count: {
    items: number
  }
}

interface RecentPayment {
  id: string
  amount: number
  paymentType: string
  paymentMethod: string | null
  paidAt: string
  customOrder: {
    id: string
    orderNumber: string
    customer: {
      name: string
    }
  }
}

interface RecentCustomer {
  id: string
  name: string
  phone: string
  email: string | null
  createdAt: string
}

export default function TeamMemberProfilePage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<TeamMember | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all')

  useEffect(() => {
    fetchActivity()
  }, [memberId, period])

  const fetchActivity = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/team/${memberId}/activity?period=${period}`)
      const data = await res.json()

      if (data.success) {
        setMember(data.member)
        setStats(data.stats)
        setRecentOrders(data.recentOrders)
        setRecentPayments(data.recentPayments)
        setRecentCustomers(data.recentCustomers)
      } else {
        toast.error(data.error || 'Erreur lors du chargement')
        router.push('/admin/team')
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'STAFF':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur'
      case 'MANAGER':
        return 'Manager'
      case 'STAFF':
        return 'Personnel'
      default:
        return role
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'IN_PRODUCTION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'FITTING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'READY':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      IN_PRODUCTION: 'En production',
      FITTING: 'Essayage',
      ALTERATIONS: 'Retouches',
      READY: 'Prêt',
      DELIVERED: 'Livré',
      CANCELLED: 'Annulé',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Membre non trouvé</p>
        <Link href="/admin/team" className="text-primary-500 hover:text-primary-400 mt-2">
          Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/team"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {member.name || 'Sans nom'}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                {getRoleLabel(member.role)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-1">
          {[
            { value: 'week', label: 'Cette semaine' },
            { value: 'month', label: 'Ce mois' },
            { value: 'all', label: 'Tout' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value as 'week' | 'month' | 'all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === option.value
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Commandes créées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customOrdersCreated}</p>
                <p className="text-xs text-gray-400">{stats.customOrdersValue.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clients créés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customersCreated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paiements reçus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.paymentsReceived}</p>
                <p className="text-xs text-gray-400">{stats.paymentsValue.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Ruler className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mensurations prises</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.measurementsTaken}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary-500" />
              Commandes récentes
            </h2>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-3 py-3">
                          <Link
                            href={`/admin/custom-orders/${order.id}`}
                            className="text-primary-500 hover:text-primary-400 font-medium text-sm"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm text-gray-900 dark:text-white">{order.customer.name}</p>
                          <p className="text-xs text-gray-500">{order.customer.phone}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {order.totalCost.toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune commande</p>
            )}
          </div>

          {/* Recent Customers */}
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-500" />
              Clients créés récemment
            </h2>
            {recentCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {recentCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{customer.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{customer.phone}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="text-primary-500 hover:text-primary-400"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun client</p>
            )}
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Informations
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white">{member.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm text-gray-900 dark:text-white">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Rôle</p>
                  <p className="text-sm text-gray-900 dark:text-white">{getRoleLabel(member.role)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Membre depuis</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Dernière connexion</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Jamais'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Paiements récents
            </h2>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 bg-gray-50 dark:bg-dark-900 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.amount.toLocaleString()} FCFA
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <Link
                      href={`/admin/custom-orders/${payment.customOrder.id}`}
                      className="text-xs text-primary-500 hover:text-primary-400"
                    >
                      {payment.customOrder.orderNumber} - {payment.customOrder.customer.name}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucun paiement</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
