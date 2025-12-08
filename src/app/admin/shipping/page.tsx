'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Globe, Truck, Edit, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  enabled: boolean
  costType: string
  cost: number
  estimatedDays: string | null
  zone?: {
    id: string
    name: string
  }
  _count: {
    orders: number
  }
}

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  enabled: boolean
  isDefault: boolean
  methods: ShippingMethod[]
  _count: {
    methods: number
  }
}

export default function ShippingManagementPage() {
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [allMethods, setAllMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedZone, setExpandedZone] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'zones' | 'methods'>('methods')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch zones and methods in parallel
      const [zonesRes, methodsRes] = await Promise.all([
        fetch('/api/admin/shipping/zones'),
        fetch('/api/admin/shipping/methods'),
      ])

      const zonesData = await zonesRes.json()
      const methodsData = await methodsRes.json()

      if (zonesData.success) {
        setZones(zonesData.zones)
      }
      if (methodsData.success) {
        setAllMethods(methodsData.methods)
      }
    } catch (error) {
      console.error('Error fetching shipping data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone de livraison ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Zone supprimée avec succès')
        fetchData()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting zone:', error)
      toast.error('Erreur lors de la suppression de la zone')
    }
  }

  const handleToggleZone = async (zoneId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !enabled }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Zone ${!enabled ? 'activée' : 'désactivée'} avec succès`)
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling zone:', error)
      toast.error('Erreur lors de la modification')
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de livraison ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/shipping/methods/${methodId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Méthode supprimée avec succès')
        fetchData()
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting method:', error)
      toast.error('Erreur lors de la suppression de la méthode')
    }
  }

  const handleToggleMethod = async (methodId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/shipping/methods/${methodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !enabled }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Méthode ${!enabled ? 'activée' : 'désactivée'} avec succès`)
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling method:', error)
      toast.error('Erreur lors de la modification')
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`
  }

  const getCostTypeLabel = (costType: string) => {
    const labels: Record<string, string> = {
      flat_rate: 'Tarif fixe',
      free: 'Gratuit',
      variable: 'Variable (Yango)',
      weight_based: 'Basé sur le poids',
      price_based: 'Basé sur le prix',
    }
    return labels[costType] || costType
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Livraisons</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configuration des zones et méthodes de livraison
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/shipping/zones/new"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Zone
          </Link>
          <Link
            href="/admin/shipping/methods/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Méthode
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        <button
          onClick={() => setActiveTab('methods')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'methods'
              ? 'text-primary-500 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Méthodes de livraison
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-dark-700 text-xs rounded-full">
              {allMethods.length}
            </span>
          </div>
          {activeTab === 'methods' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'zones'
              ? 'text-primary-500 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Zones de livraison
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-dark-700 text-xs rounded-full">
              {zones.length}
            </span>
          </div>
          {activeTab === 'zones' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
      </div>

      {/* Methods Tab */}
      {activeTab === 'methods' && (
        <div className="space-y-4">
          {allMethods.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 text-center">
              <Truck className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune méthode de livraison configurée
              </p>
              <Link
                href="/admin/shipping/methods/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Créer une méthode
              </Link>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-100 dark:bg-dark-800/50">
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Méthode</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Zone</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Coût</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Délai</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Statut</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                  {allMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-100 dark:hover:bg-dark-800/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                          {method.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{method.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-700 dark:text-gray-300">{method.zone?.name || '-'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          method.costType === 'variable'
                            ? 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400'
                            : method.costType === 'free'
                            ? 'bg-green-500/10 text-green-500 dark:text-green-400'
                            : 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                        }`}>
                          {getCostTypeLabel(method.costType)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-700 dark:text-gray-300">
                          {method.costType === 'variable' ? 'Variable' : formatCurrency(method.cost)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-500 dark:text-gray-400">{method.estimatedDays || '-'}</span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleMethod(method.id, method.enabled)}
                          className={`px-3 py-1 text-xs rounded ${
                            method.enabled
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}
                        >
                          {method.enabled ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/shipping/methods/${method.id}`}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4 text-gray-400" />
                          </Link>
                          <button
                            onClick={() => handleDeleteMethod(method.id)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          {zones.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 text-center">
              <Globe className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune zone de livraison configurée
              </p>
              <Link
                href="/admin/shipping/zones/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Créer la première zone
              </Link>
            </div>
          ) : (
            zones.map((zone) => (
              <div
                key={zone.id}
                className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 overflow-hidden"
              >
                {/* Zone Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {zone.name}
                        </h3>
                        {zone.isDefault && (
                          <span className="px-2 py-1 bg-primary-500/10 text-primary-500 text-xs rounded">
                            Par défaut
                          </span>
                        )}
                        {!zone.enabled && (
                          <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded">
                            Désactivée
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {zone.countries.map((country) => (
                          <span
                            key={country}
                            className="px-2 py-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 text-sm rounded"
                          >
                            {country}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {zone._count.methods} méthode{zone._count.methods > 1 ? 's' : ''} de
                        livraison
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleZone(zone.id, zone.enabled)}
                        className={`px-3 py-1 text-sm rounded ${
                          zone.enabled
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {zone.enabled ? 'Activée' : 'Désactivée'}
                      </button>
                      <button
                        onClick={() =>
                          setExpandedZone(expandedZone === zone.id ? null : zone.id)
                        }
                        className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
                        title={expandedZone === zone.id ? 'Masquer les méthodes' : 'Voir les méthodes'}
                      >
                        {expandedZone === zone.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <Link
                        href={`/admin/shipping/zones/${zone.id}`}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
                        title="Modifier la zone"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Link>
                      {!zone.isDefault && (
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
                          title="Supprimer la zone"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Methods List (Expandable) */}
                {expandedZone === zone.id && zone.methods.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-800/30">
                    <div className="p-6">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Méthodes de livraison
                      </h4>
                      <div className="space-y-3">
                        {zone.methods.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-transparent"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                                {!method.enabled && (
                                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded">
                                    Désactivée
                                  </span>
                                )}
                              </div>
                              {method.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {method.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>{getCostTypeLabel(method.costType)}</span>
                                <span>•</span>
                                <span>{method.costType === 'variable' ? 'Variable' : formatCurrency(method.cost)}</span>
                                {method.estimatedDays && (
                                  <>
                                    <span>•</span>
                                    <span>{method.estimatedDays}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{method._count.orders} commandes</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleMethod(method.id, method.enabled)}
                                className={`px-3 py-1 text-xs rounded ${
                                  method.enabled
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-gray-500/10 text-gray-500'
                                }`}
                              >
                                {method.enabled ? 'Active' : 'Inactive'}
                              </button>
                              <Link
                                href={`/admin/shipping/methods/${method.id}`}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
                              >
                                <Edit className="h-4 w-4 text-gray-400" />
                              </Link>
                              <button
                                onClick={() => handleDeleteMethod(method.id)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
