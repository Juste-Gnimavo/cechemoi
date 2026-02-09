'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  Search,
  User,
  Plus,
  Trash2,
  Calendar,
  Scissors,
  CheckCircle,
  X,
  Ruler,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'

// Types prédéfinis de tenues
const GARMENT_TYPES = [
  'Boubou',
  'Robe de soirée',
  'Robe simple',
  'Ensemble tunique',
  'Tunique',
  'Veste',
  'Pantalon',
  'Jupe',
  'Combinaison',
  'Ensemble pagne',
  'Chemise',
  'Tailleur',
  'Caftan',
  'Autre',
]

interface Customer {
  id: string
  name: string
  phone: string
  whatsappNumber?: string
  email?: string
}

interface Measurement {
  id: string
  measurementDate: string
  takenByStaffName?: string
  poitrine?: number
  tourDeTaille?: number
  bassin?: number
  longueurTotale?: number
}

interface Tailor {
  id: string
  name: string
  phone?: string
  activeItems: number
}

interface OrderItem {
  id: string
  garmentType: string
  customType: string
  description: string
  quantity: number
  unitPrice: number
  tailorId: string
  estimatedHours: number | null
}

export default function NewCustomOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { welcome } = useConfetti()

  // Loading states
  const [loading, setLoading] = useState(false)
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [loadingMeasurements, setLoadingMeasurements] = useState(false)
  const [loadingTailors, setLoadingTailors] = useState(true)

  // Customer
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  // Measurements
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string>('')

  // Tailors
  const [tailors, setTailors] = useState<Tailor[]>([])

  // Order items
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: crypto.randomUUID(),
      garmentType: '',
      customType: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      tailorId: '',
      estimatedHours: null,
    },
  ])

  // Dates & other fields
  const [pickupDate, setPickupDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14) // Default: +14 days
    return date.toISOString().split('T')[0]
  })
  const [customerDeadline, setCustomerDeadline] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [materialCost, setMaterialCost] = useState(0)
  const [deposit, setDeposit] = useState(0)
  const [notes, setNotes] = useState('')

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdOrderNumber, setCreatedOrderNumber] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState('')

  // Load tailors on mount
  useEffect(() => {
    fetchTailors()
    // Pre-load customer from URL parameter
    const customerId = searchParams.get('customerId')
    if (customerId) {
      fetchCustomerById(customerId)
    }
  }, [])

  const fetchCustomerById = async (customerId: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`)
      const data = await res.json()
      if (data.success && data.customer) {
        setSelectedCustomer({
          id: data.customer.id,
          name: data.customer.name,
          phone: data.customer.phone,
          whatsappNumber: data.customer.whatsappNumber,
          email: data.customer.email,
        })
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    }
  }

  const fetchTailors = async () => {
    try {
      const res = await fetch('/api/admin/tailors')
      const data = await res.json()
      if (data.success) {
        setTailors(data.tailors)
      }
    } catch (error) {
      console.error('Error fetching tailors:', error)
    } finally {
      setLoadingTailors(false)
    }
  }

  // Search customers with debounce
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([])
      setShowCustomerDropdown(false)
      return
    }

    setSearchingCustomers(true)
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      if (data.success) {
        setCustomers(data.customers)
        setShowCustomerDropdown(true)
      }
    } catch (error) {
      console.error('Error searching customers:', error)
    } finally {
      setSearchingCustomers(false)
    }
  }, [])

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(customerSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch, searchCustomers])

  // Fetch measurements when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      fetchMeasurements(selectedCustomer.id)
    } else {
      setMeasurements([])
      setSelectedMeasurementId('')
    }
  }, [selectedCustomer])

  const fetchMeasurements = async (customerId: string) => {
    setLoadingMeasurements(true)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/measurements`)
      const data = await res.json()
      if (data.success) {
        setMeasurements(data.measurementHistory || [])
        if (data.currentMeasurement) {
          setSelectedMeasurementId(data.currentMeasurement.id)
        }
      }
    } catch (error) {
      console.error('Error fetching measurements:', error)
    } finally {
      setLoadingMeasurements(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch('')
    setShowCustomerDropdown(false)
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setMeasurements([])
    setSelectedMeasurementId('')
  }

  // Items management
  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        garmentType: '',
        customType: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        tailorId: '',
        estimatedHours: null,
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          // Reset customType when garmentType changes and is not "Autre"
          if (field === 'garmentType' && value !== 'Autre') {
            return { ...item, [field]: value, customType: '' }
          }
          return { ...item, [field]: value }
        }
        return item
      })
    )
  }

  // Calculate totals
  const totalCost = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const balance = totalCost + materialCost - deposit

  // Form validation
  const isValid =
    selectedCustomer &&
    items.length > 0 &&
    items.every((item) => item.garmentType && (item.garmentType !== 'Autre' || item.customType)) &&
    pickupDate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    if (!items.every((item) => item.garmentType)) {
      toast.error('Veuillez spécifier le type de tenue pour chaque article')
      return
    }

    if (!pickupDate) {
      toast.error('Veuillez spécifier la date de retrait')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          measurementId: selectedMeasurementId || null,
          items: items.map((item) => ({
            garmentType: item.garmentType === 'Autre' ? item.customType : item.garmentType,
            customType: item.garmentType === 'Autre' ? item.customType : null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tailorId: item.tailorId || null,
            estimatedHours: item.estimatedHours,
          })),
          pickupDate,
          customerDeadline: customerDeadline || null,
          priority,
          materialCost,
          deposit,
          notes,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setCreatedOrderNumber(data.order.orderNumber)
        setCreatedOrderId(data.order.id)
        setShowSuccessModal(true)
        welcome()
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Erreur lors de la création de la commande')
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = () => {
    router.push(`/admin/custom-orders/${createdOrderId}`)
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedOrderId('')
    setCreatedOrderNumber('')
    // Reset form
    setSelectedCustomer(null)
    setMeasurements([])
    setSelectedMeasurementId('')
    setItems([
      {
        id: crypto.randomUUID(),
        garmentType: '',
        customType: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        tailorId: '',
        estimatedHours: null,
      },
    ])
    const date = new Date()
    date.setDate(date.getDate() + 14)
    setPickupDate(date.toISOString().split('T')[0])
    setCustomerDeadline('')
    setPriority('NORMAL')
    setMaterialCost(0)
    setDeposit(0)
    setNotes('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Commande Sur-Mesure</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Créer une commande personnalisée</p>
        </div>
        <Link
          href="/admin/custom-orders"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-400" />
            Client <span className="text-red-500">*</span>
          </h2>

          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.phone}</p>
                {selectedCustomer.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearCustomer}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-red-400" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center border border-gray-200 dark:border-dark-700 rounded-lg bg-gray-100 dark:bg-dark-900">
                <Search className="h-5 w-5 ml-3 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Rechercher un client par nom ou téléphone..."
                  className="flex-1 px-3 py-2 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white"
                />
                {searchingCustomers && <Loader2 className="h-5 w-5 mr-3 animate-spin text-gray-400" />}
              </div>

              {/* Customer dropdown */}
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-dark-700 border-b border-gray-200 dark:border-dark-700 last:border-0"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                    </button>
                  ))}
                </div>
              )}

              {showCustomerDropdown && customerSearch.length >= 2 && customers.length === 0 && !searchingCustomers && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">Aucun client trouvé</p>
                  <Link
                    href="/admin/customers/new"
                    className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400"
                  >
                    <Plus className="h-4 w-4" />
                    Créer un nouveau client
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Measurements Selection */}
        {selectedCustomer && (
          <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary-400" />
              Mensurations
            </h2>

            {loadingMeasurements ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
              </div>
            ) : measurements.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedMeasurementId}
                  onChange={(e) => setSelectedMeasurementId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sans mensurations</option>
                  {measurements.map((m) => (
                    <option key={m.id} value={m.id}>
                      {new Date(m.measurementDate).toLocaleDateString('fr-FR')}
                      {m.takenByStaffName && ` - par ${m.takenByStaffName}`}
                      {m.poitrine && ` - Poitrine: ${m.poitrine}cm`}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {measurements.length} mensuration(s) enregistrée(s) pour ce client
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Aucune mensuration enregistrée pour ce client (optionnel)
                </p>
                <Link
                  href={`/admin/customers/${selectedCustomer.id}`}
                  className="text-sm text-primary-500 hover:text-primary-400 mt-2 inline-block"
                >
                  Ajouter des mensurations
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary-400" />
              Articles <span className="text-red-500">*</span>
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-900"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Article {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Garment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Type de tenue <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.garmentType}
                      onChange={(e) => updateItem(item.id, 'garmentType', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {GARMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom type if "Autre" selected */}
                  {item.garmentType === 'Autre' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        Préciser le type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.customType}
                        onChange={(e) => updateItem(item.id, 'customType', e.target.value)}
                        placeholder="Ex: Agbada, Kaba..."
                        className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Quantité</label>
                    <input
                      type="number"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Prix unitaire (FCFA)
                    </label>
                    <input
                      type="number"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                      min="0"
                      step="500"
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Tailor Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Couturier assigné
                    </label>
                    <select
                      value={item.tailorId}
                      onChange={(e) => updateItem(item.id, 'tailorId', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={loadingTailors}
                    >
                      <option value="">Non assigné</option>
                      {tailors.map((tailor) => (
                        <option key={tailor.id} value={tailor.id}>
                          {tailor.name} ({tailor.activeItems} en cours)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Estimation approximative (en Heure)
                    </label>
                    <input
                      type="number"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={item.estimatedHours || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'estimatedHours', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      min="0"
                      step="0.5"
                      placeholder="Ex: 8"
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    rows={2}
                    placeholder="Détails spécifiques, couleur, tissu, style..."
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Item subtotal */}
                <div className="mt-3 text-right text-sm text-gray-500 dark:text-gray-400">
                  Sous-total: <span className="font-semibold text-gray-900 dark:text-white">{(item.unitPrice * item.quantity).toLocaleString()} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dates & Priority */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-400" />
            Dates & Priorité
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {/* Pickup Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Date de retrait <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Date prévue pour le retrait</p>
            </div>

            {/* Customer Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Délai client (optionnel)
              </label>
              <input
                type="date"
                value={customerDeadline}
                onChange={(e) => setCustomerDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Événement ou deadline du client</p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="NORMAL">Normal (30 jours)</option>
                <option value="URGENT">Urgent (+20% prix)</option>
                <option value="VIP">VIP / Rush (+40% prix)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment & Costs */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coût & Paiement</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Material Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Coût du matériel (FCFA)
              </label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={materialCost}
                onChange={(e) => setMaterialCost(parseInt(e.target.value) || 0)}
                min="0"
                step="500"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Tissu, boutons, fermetures...</p>
            </div>

            {/* Deposit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Avance reçue (FCFA)</label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={deposit}
                onChange={(e) => setDeposit(parseInt(e.target.value) || 0)}
                min="0"
                step="500"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Montant déjà payé par le client</p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-dark-900 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Coût des tenues:</span>
                <span className="text-gray-900 dark:text-white">{totalCost.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Coût du matériel:</span>
                <span className="text-gray-900 dark:text-white">{materialCost.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Avance:</span>
                <span className="text-green-500">-{deposit.toLocaleString()} FCFA</span>
              </div>
              <div className="border-t border-gray-200 dark:border-dark-700 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Total à payer:</span>
                  <span className="text-gray-900 dark:text-white">{(totalCost + materialCost).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-1">
                  <span className={balance > 0 ? 'text-orange-500' : 'text-green-500'}>Reliquat:</span>
                  <span className={balance > 0 ? 'text-orange-500' : 'text-green-500'}>
                    {balance.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes (facultatif)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes internes sur la commande..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/custom-orders"
            className="px-6 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            <span>{loading ? 'Création...' : 'Créer la Commande'}</span>
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-green-500/30 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-3">Commande créée!</h2>

              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Commande <span className="font-semibold text-gray-900 dark:text-white">{createdOrderNumber}</span> créée
                avec succès.
              </p>

              <p className="text-gray-500 text-sm mb-6">
                Client: {selectedCustomer?.name}
                <br />
                {items.length} article(s) - {(totalCost + materialCost).toLocaleString()} FCFA
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateAnother}
                  className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg transition-colors border border-gray-200 dark:border-dark-700"
                >
                  Nouvelle commande
                </button>
                <button
                  onClick={handleViewOrder}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Voir la commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
