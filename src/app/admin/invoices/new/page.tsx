'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Plus, Trash2, Loader2, Search, User, Phone, Mail, MapPin, Bell, Send, MessageSquare, ChevronDown, Truck, CreditCard, Package, ExternalLink, FileText, Banknote } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  whatsappNumber?: string | null
  city?: string | null
  _count?: { orders: number }
}

interface Address {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  quartier: string | null
  cite: string | null
  rue: string | null
  city: string
  country: string
  description: string | null
  isDefault: boolean
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  productId?: string
}

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  cost: number | null
  costType: string
  enabled: boolean
  estimatedDays: string | null
}

interface PaymentMethodOption {
  id: string
  name: string
  code: string
  enabled: boolean
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { celebration } = useConfetti()
  const [loading, setLoading] = useState(false)

  // Get customerId from URL params
  const customerId = searchParams.get('customerId')

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState<string | null>(null)

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)

  // Customer info (manual entry or from selected customer)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])

  // Notification settings
  const [sendSMS, setSendSMS] = useState(true)
  const [sendWhatsApp, setSendWhatsApp] = useState(true)

  // Invoice details
  const [dueDate, setDueDate] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('DRAFT')

  // Shipping and payment
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')

  // Available payment methods
  const paymentMethods: PaymentMethodOption[] = [
    { id: '1', name: 'Paiement espèce à la caisse', code: 'CASH_AT_STORE', enabled: true },
    { id: '2', name: 'Paiement à la livraison', code: 'CASH_ON_DELIVERY', enabled: true },
    { id: '3', name: 'Orange Money', code: 'ORANGE_MONEY', enabled: true },
    { id: '4', name: 'MTN Mobile Money', code: 'MTN_MOBILE_MONEY', enabled: true },
    { id: '5', name: 'Wave', code: 'WAVE', enabled: true },
    { id: '6', name: 'PaiementPro (CB, PayPal)', code: 'PAIEMENTPRO', enabled: true },
  ]

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ])

  // Amounts
  const [tax, setTax] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [discount, setDiscount] = useState(0)

  // Fetch shipping methods on mount
  useEffect(() => {
    fetchShippingMethods()
  }, [])

  // Pre-fill customer if customerId is provided in URL
  useEffect(() => {
    if (customerId && !selectedCustomer) {
      fetchCustomerById(customerId)
    }
  }, [customerId])

  // Fetch customer by ID (for pre-filling from URL param)
  const fetchCustomerById = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`)
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          if (data.success && data.customer) {
            const customer = data.customer
            setSelectedCustomer({
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              whatsappNumber: customer.whatsappNumber,
              city: customer.city,
            })
            // Fill customer info fields
            setCustomerName(customer.name || '')
            setCustomerEmail(customer.email || '')
            setCustomerPhone(customer.phone || '')
            // Load addresses
            const addresses = customer.addresses || []
            setCustomerAddresses(addresses)
            if (addresses.length > 0) {
              const defaultAddr = addresses.find((a: Address) => a.isDefault)
              setSelectedAddressId(defaultAddr?.id || addresses[0].id)
              if (defaultAddr) {
                setCustomerAddress(`${defaultAddr.addressLine1 || defaultAddr.quartier || ''}, ${defaultAddr.city}`)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching customer:', err)
    }
  }

  const fetchShippingMethods = async () => {
    try {
      const res = await fetch('/api/admin/shipping/methods')
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          const enabledMethods = (data.methods || []).filter((m: ShippingMethod) => m.enabled)
          setShippingMethods(enabledMethods)
        }
      }
    } catch (err) {
      console.error('Error fetching shipping methods:', err)
    }
  }

  // Calculate shipping cost based on selected method
  const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethodId)
  // Always use manual shippingCost - free methods set it to 0
  const calculatedShippingCost = selectedShipping?.costType === 'free' ? 0 : shippingCost

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }

    setItems(newItems)
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal + tax + calculatedShippingCost - discount

  // Search products
  const searchProducts = async (query: string) => {
    setProductSearch(query)
    if (query.length < 2) {
      setProductResults([])
      return
    }

    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error('Erreur de recherche')
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      setProductResults(data.products || [])
    } catch (err) {
      console.error('Product search error:', err)
    }
  }

  // Add product to items
  const addProductToItems = (product: Product) => {
    // Check if product already exists in items
    const existingIndex = items.findIndex(item => item.productId === product.id)

    if (existingIndex >= 0) {
      // Increase quantity
      const newItems = [...items]
      newItems[existingIndex].quantity += 1
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice
      setItems(newItems)
    } else {
      // Add new item
      setItems([
        ...items.filter(item => item.description.trim() !== '' || item.productId), // Remove empty items
        {
          description: product.name,
          quantity: 1,
          unitPrice: product.price,
          total: product.price,
          productId: product.id,
        }
      ])
    }

    setProductResults([])
    setProductSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName) {
      toast.error('Le nom du client est requis')
      return
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      toast.error('Ajoutez au moins un article')
      return
    }

    // Filter out empty items
    const validItems = items.filter(item => item.description.trim() !== '')

    if (validItems.length === 0) {
      toast.error('Ajoutez au moins un article valide')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          customerName,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          addressId: selectedAddressId || null,
          items: validItems,
          subtotal,
          tax,
          shippingCost: calculatedShippingCost,
          shippingMethodId: selectedShippingMethodId || null,
          paymentMethod: selectedPaymentMethod || null,
          discount,
          total,
          notes: notes || null,
          dueDate: dueDate || null,
          invoiceDate: invoiceDate || null,
          status,
          sendSMS,
          sendWhatsApp,
        }),
      })

      // Safe JSON parsing
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error('Réponse invalide du serveur')
      }

      if (data.success) {
        // Show success modal with confetti
        setCreatedInvoiceId(data.invoice.id)
        setCreatedInvoiceNumber(data.invoice.invoiceNumber || data.invoice.id.slice(-8).toUpperCase())
        setShowSuccessModal(true)
        celebration()
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleViewInvoice = () => {
    if (createdInvoiceId) {
      router.push(`/admin/invoices/${createdInvoiceId}`)
    }
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedInvoiceId(null)
    setCreatedInvoiceNumber(null)
    // Reset form
    setSelectedCustomer(null)
    setCustomerAddresses([])
    setSelectedAddressId('')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerAddress('')
    setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }])
    setSelectedShippingMethodId('')
    setSelectedPaymentMethod('')
    setTax(0)
    setShippingCost(0)
    setDiscount(0)
    setNotes('')
    setDueDate('')
    setInvoiceDate('')
    setStatus('DRAFT')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  // Search customers
  const searchCustomers = async (query: string) => {
    setCustomerSearch(query)
    if (query.length < 2) {
      setCustomerResults([])
      return
    }

    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error('Erreur de recherche')
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      setCustomerResults(data.customers || [])
    } catch (err) {
      console.error('Customer search error:', err)
    }
  }

  // Select customer and fill info, including addresses
  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerEmail(customer.email || '')
    setCustomerPhone(customer.phone)
    setCustomerResults([])
    setCustomerSearch('')

    // Load customer addresses from admin customer detail endpoint
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`)
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          const addresses = data.customer?.addresses || []
          setCustomerAddresses(addresses)
          if (addresses.length > 0) {
            const defaultAddr = addresses.find((a: Address) => a.isDefault)
            const selectedAddr = defaultAddr || addresses[0]
            setSelectedAddressId(selectedAddr?.id || '')
            // Pre-fill address field
            if (selectedAddr) {
              setCustomerAddress([
                selectedAddr.quartier || selectedAddr.addressLine1,
                selectedAddr.cite,
                selectedAddr.rue,
                selectedAddr.city
              ].filter(Boolean).join(', '))
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading addresses:', err)
    }
  }

  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    setShowAddressDropdown(false)
    const addr = customerAddresses.find(a => a.id === addressId)
    if (addr) {
      setCustomerAddress([
        addr.quartier || addr.addressLine1,
        addr.cite,
        addr.rue,
        addr.city
      ].filter(Boolean).join(', '))
    }
  }

  // Clear selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerAddress('')
    setCustomerAddresses([])
    setSelectedAddressId('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Facture</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Créez une facture standalone personnalisée</p>
        </div>
        <Link
          href="/admin/invoices"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informations Client</h2>
          </div>

          {/* Customer Search */}
          {!selectedCustomer && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Rechercher un client existant
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => searchCustomers(e.target.value)}
                  placeholder="Rechercher par nom, téléphone ou email..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {customerResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="w-full p-4 bg-gray-100 dark:bg-dark-900 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg text-left transition-all duration-200 border border-gray-200 dark:border-dark-700 hover:border-blue-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {customer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </span>
                            )}
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </span>
                            )}
                            {customer.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {customer.city}
                              </span>
                            )}
                          </div>
                        </div>
                        {customer._count?.orders !== undefined && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {customer._count.orders} commande{customer._count.orders !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Ou entrez manuellement les informations ci-dessous
              </p>
            </div>
          )}

          {/* Selected Customer Badge */}
          {selectedCustomer && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-400">Client sélectionné</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedCustomer}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Changer
                </button>
              </div>

              {/* Address Selection */}
              {customerAddresses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-500/20">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Adresse de livraison</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-left focus:outline-none focus:border-blue-500"
                    >
                      <span className="truncate text-gray-900 dark:text-white">
                        {selectedAddressId ? (
                          (() => {
                            const addr = customerAddresses.find(a => a.id === selectedAddressId)
                            return addr ? `${addr.quartier || addr.addressLine1 || ''}, ${addr.city}${addr.isDefault ? ' (Par défaut)' : ''}` : 'Sélectionner...'
                          })()
                        ) : 'Sélectionner une adresse...'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showAddressDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {customerAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleAddressSelect(addr.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border-b border-gray-200 dark:border-dark-700 last:border-b-0 ${
                              selectedAddressId === addr.id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {addr.quartier || addr.addressLine1 || 'Adresse'}
                                  {addr.isDefault && (
                                    <span className="ml-2 text-xs bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded">
                                      Par défaut
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {addr.fullName} - {addr.phone}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {[addr.cite, addr.rue, addr.city].filter(Boolean).join(', ')}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Nom du client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="jean@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Téléphone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+225 XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Date d'échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Adresse complète</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Adresse du client..."
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Articles</h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Ligne manuelle</span>
            </button>
          </div>

          {/* Product Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => searchProducts(e.target.value)}
              placeholder="Rechercher un produit à ajouter..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {productResults.length > 0 && (
            <div className="mb-4 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-700 rounded-lg">
              {productResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToItems(product)}
                  className="w-full p-3 bg-gray-100 dark:bg-dark-900 hover:bg-gray-200 dark:hover:bg-dark-700 text-left transition-all duration-200 border-b border-gray-200 dark:border-dark-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku} • Stock: {product.stock}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.price.toLocaleString()} CFA</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description de l'article..."
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="Qté"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="Prix unit."
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <div className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm">
                    {formatCurrency(item.total)}
                  </div>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Livraison et Paiement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Mode de livraison</label>
              {shippingMethods.length > 0 ? (
                <div className="space-y-2">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedShippingMethodId === method.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-200 dark:border-dark-700 hover:border-purple-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="invoiceShippingMethod"
                        value={method.id}
                        checked={selectedShippingMethodId === method.id}
                        onChange={(e) => {
                          setSelectedShippingMethodId(e.target.value)
                          // Reset shipping cost to 0 for manual entry
                          if (method.costType === 'free') {
                            setShippingCost(0)
                          }
                        }}
                        className="mt-1 text-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                          <span className={method.costType === 'free' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400 text-sm'}>
                            {method.costType === 'free' ? 'Gratuit' : 'Montant à définir'}
                          </span>
                        </div>
                        {method.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg">
                  Aucune méthode configurée - frais manuels ci-dessous
                </p>
              )}
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Mode de paiement</label>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.code
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-200 dark:border-dark-700 hover:border-purple-500/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invoicePaymentMethod"
                      value={method.code}
                      checked={selectedPaymentMethod === method.code}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="text-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      {method.code === 'CASH_AT_STORE' && <Banknote className="w-5 h-5 text-emerald-500" />}
                      {method.code === 'CASH_ON_DELIVERY' && <Truck className="w-5 h-5 text-green-500" />}
                      {method.code === 'ORANGE_MONEY' && (
                        <Image src="/logo/orange.svg" alt="Orange Money" width={20} height={20} className="object-contain" />
                      )}
                      {method.code === 'MTN_MOBILE_MONEY' && (
                        <Image src="/logo/mtn.svg" alt="MTN MoMo" width={20} height={20} className="object-contain" />
                      )}
                      {method.code === 'WAVE' && (
                        <Image src="/logo/wave.svg" alt="Wave" width={20} height={20} className="object-contain" />
                      )}
                      {method.code === 'PAIEMENTPRO' && (
                        <div className="flex items-center gap-1">
                          <Image src="/logo/visa.svg" alt="Visa" width={20} height={20} className="object-contain" />
                          <Image src="/logo/paypal.png" alt="PayPal" width={20} height={20} className="object-contain" />
                        </div>
                      )}
                      <span className="text-gray-900 dark:text-white">{method.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Montants</h2>

          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
              <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-500 dark:text-gray-400">Taxe</label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-32 px-3 py-1 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-500 dark:text-gray-400">
                Frais de livraison
                {selectedShipping && (
                  <span className="text-xs block">({selectedShipping.name})</span>
                )}
              </label>
              {selectedShipping?.costType === 'free' ? (
                <span className="text-green-500">Gratuit</span>
              ) : (
                <input
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-32 px-3 py-1 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-500 dark:text-gray-400">Remise</label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-32 px-3 py-1 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-700">
              <span className="text-gray-900 dark:text-white font-semibold text-lg">Total</span>
              <span className="text-primary-400 font-bold text-xl">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations Complémentaires</h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Notes ou conditions de paiement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="SENT">Envoyée</option>
              <option value="PAID">Payée</option>
            </select>
          </div>

          {/* Manual Invoice Date */}
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold text-orange-400">Date de facture (Antidater)</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Pour les factures créées a posteriori, définissez la date réelle de la facture.
            </p>
            <input
              type="datetime-local"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-2">
              Laissez vide pour utiliser la date/heure actuelle
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={sendSMS}
                onChange={(e) => setSendSMS(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-900 dark:text-white font-medium">Envoyer SMS</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Le client recevra un SMS avec le lien de la facture
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                  <span className="text-gray-900 dark:text-white font-medium">Envoyer WhatsApp</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Le client recevra un message WhatsApp avec la facture PDF
                </p>
              </div>
            </label>
          </div>

          {status === 'DRAFT' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-400">
                ⚠️ Les notifications ne seront envoyées que si le statut n'est pas "Brouillon"
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/invoices"
            className="px-6 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            <span>{loading ? 'Création...' : 'Créer la Facture'}</span>
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-green-500/30 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              {/* Success icon with animation */}
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <FileText className="w-10 h-10 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-3">
                Facture créée avec succès !
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-2">
                La facture <span className="font-semibold text-gray-900 dark:text-white">#{createdInvoiceNumber}</span> a été créée.
              </p>

              <p className="text-gray-500 text-sm mb-6">
                {customerName && `Client: ${customerName}`}
                {total > 0 && ` • Total: ${formatCurrency(total)}`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateAnother}
                  className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-lg transition-colors border border-gray-200 dark:border-dark-700"
                >
                  Nouvelle facture
                </button>
                <button
                  onClick={handleViewInvoice}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Voir la facture
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
