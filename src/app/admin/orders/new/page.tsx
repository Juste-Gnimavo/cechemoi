'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  User,
  Package,
  CreditCard,
  Truck,
  Calculator,
  MessageSquare,
  Send,
  Bell,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ExternalLink,
  Tag,
  Loader2,
  CheckCircle,
  X,
  Banknote
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminSuccessModal } from '@/components/admin/admin-message-modal'
import { useConfetti } from '@/hooks/useConfetti'

interface Customer {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string | null
  phone: string
  whatsappNumber?: string | null
  city?: string | null
  _count?: { orders: number }
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
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

interface AppliedCoupon {
  id: string
  code: string
  description: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minimumOrderAmount: number | null
  maximumDiscount: number | null
}

export default function NewOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { celebration } = useConfetti()

  // Get customerId from URL params
  const customerId = searchParams.get('customerId')

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null)

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)

  // Product selection
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // Order details - shipping and payment from database
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)

  // Notification settings
  const [sendSMS, setSendSMS] = useState(true)
  const [sendWhatsApp, setSendWhatsApp] = useState(true)

  // Manual date for offline orders
  const [orderDate, setOrderDate] = useState('')

  // Coupon/promo code
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  // Loading states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Available payment methods
  const paymentMethods: PaymentMethodOption[] = [
    { id: '1', name: 'Paiement à la livraison', code: 'CASH_ON_DELIVERY', enabled: true },
    { id: '2', name: 'Orange Money', code: 'ORANGE_MONEY', enabled: true },
    { id: '3', name: 'MTN Mobile Money', code: 'MTN_MOBILE_MONEY', enabled: true },
    { id: '4', name: 'Wave', code: 'WAVE', enabled: true },
    { id: '5', name: 'PaiementPro (CB, PayPal)', code: 'PAIEMENTPRO', enabled: true },
  ]

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
  const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethodId)
  const calculatedShippingCost = selectedShipping?.costType === 'free' ? 0 : (selectedShipping?.cost || shippingCost)

  // Calculate coupon discount
  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0

    let calculatedDiscount = 0
    if (appliedCoupon.discountType === 'percentage') {
      calculatedDiscount = subtotal * (appliedCoupon.discountValue / 100)
      if (appliedCoupon.maximumDiscount) {
        calculatedDiscount = Math.min(calculatedDiscount, appliedCoupon.maximumDiscount)
      }
    } else {
      calculatedDiscount = appliedCoupon.discountValue
    }
    return Math.min(calculatedDiscount, subtotal)
  }

  const couponDiscount = getCouponDiscount()
  const totalDiscount = discount + couponDiscount
  const total = subtotal - totalDiscount + calculatedShippingCost

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
            // Load addresses
            const addresses = customer.addresses || []
            setCustomerAddresses(addresses)
            if (addresses.length > 0) {
              const defaultAddr = addresses.find((a: Address) => a.isDefault)
              setSelectedAddressId(defaultAddr?.id || addresses[0].id)
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

  // Select customer and load addresses from customer detail API
  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer)
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
            setSelectedAddressId(defaultAddr?.id || addresses[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Error loading addresses:', err)
    }
  }

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

  // Add product to order
  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id)

    if (existingItem) {
      // Increase quantity
      setOrderItems(orderItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          total: product.price,
        }
      ])
    }

    setProductResults([])
    setProductSearch('')
  }

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setOrderItems(orderItems.map(item =>
      item.productId === productId
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ))
  }

  // Remove item
  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId))
  }

  // Validate and apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Veuillez entrer un code promo')
      return
    }

    if (!selectedCustomer) {
      setCouponError('Veuillez d\'abord sélectionner un client')
      return
    }

    setCouponLoading(true)
    setCouponError('')

    try {
      // Use the admin coupon validation endpoint
      const response = await fetch('/api/admin/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          userId: selectedCustomer.id,
          cartItems: orderItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
        }),
      })

      const data = await response.json()

      if (data.valid && data.coupon) {
        // Check minimum order amount
        if (data.coupon.minimumOrderAmount && subtotal < data.coupon.minimumOrderAmount) {
          setCouponError(`Montant minimum requis: ${data.coupon.minimumOrderAmount.toLocaleString()} CFA`)
          return
        }

        setAppliedCoupon(data.coupon as AppliedCoupon)
        setCouponCode('')
      } else {
        setCouponError(data.errors?.[0] || data.error || 'Code promo invalide')
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Erreur lors de la validation du code promo')
    } finally {
      setCouponLoading(false)
    }
  }

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  // Create order
  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      setError('Veuillez sélectionner un client')
      return
    }

    if (orderItems.length === 0) {
      setError('Veuillez ajouter au moins un produit')
      return
    }

    if (!selectedAddressId && customerAddresses.length > 0) {
      setError('Veuillez sélectionner une adresse de livraison')
      return
    }

    if (!paymentMethod) {
      setError('Veuillez sélectionner un mode de paiement')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          addressId: selectedAddressId || null,
          items: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingMethodId: selectedShippingMethodId || null,
          shippingMethod: selectedShipping?.name || 'STANDARD',
          paymentMethod,
          notes,
          discount: totalDiscount, // Include both manual and coupon discount
          couponId: appliedCoupon?.id || null,
          couponCode: appliedCoupon?.code || null,
          shippingCost: calculatedShippingCost,
          sendSMS,
          sendWhatsApp,
          orderDate: orderDate || null,
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

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la commande')
      }

      // Show success modal with confetti
      setCreatedOrderId(data.order.id)
      setCreatedOrderNumber(data.order.orderNumber || data.order.id.slice(-8).toUpperCase())
      setShowSuccessModal(true)
      celebration()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = () => {
    if (createdOrderId) {
      router.push(`/admin/orders/${createdOrderId}`)
    }
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedOrderId(null)
    setCreatedOrderNumber(null)
    // Reset form
    setSelectedCustomer(null)
    setCustomerAddresses([])
    setSelectedAddressId('')
    setOrderItems([])
    setSelectedShippingMethodId('')
    setPaymentMethod('')
    setNotes('')
    setDiscount(0)
    setShippingCost(0)
    setOrderDate('')
    // Reset coupon
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une nouvelle commande</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Créer manuellement une commande pour un client</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Client</h2>
            </div>

            {!selectedCustomer ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => searchCustomers(e.target.value)}
                    placeholder="Rechercher un client par nom, email ou téléphone..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                {customerResults.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {customerResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="w-full p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-left transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-500"
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
                            <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                              {customer._count.orders} commande{customer._count.orders !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-transparent">
                <div className="flex items-center justify-between">
                  <div>
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
                      {selectedCustomer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedCustomer.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setCustomerAddresses([])
                      setSelectedAddressId('')
                    }}
                    className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    Changer
                  </button>
                </div>

                {/* Address Selection */}
                {customerAddresses.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse de livraison</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-left focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                      >
                        <span className="truncate">
                          {selectedAddressId ? (
                            (() => {
                              const addr = customerAddresses.find(a => a.id === selectedAddressId)
                              return addr ? `${addr.quartier || addr.addressLine1 || ''}, ${addr.city}${addr.isDefault ? ' (Par défaut)' : ''}` : 'Sélectionner...'
                            })()
                          ) : 'Sélectionner une adresse...'}
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showAddressDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {customerAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setSelectedAddressId(addr.id)
                                setShowAddressDropdown(false)
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                                selectedAddressId === addr.id ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">
                                    {addr.quartier || addr.addressLine1 || 'Adresse'}
                                    {addr.isDefault && (
                                      <span className="ml-2 text-xs bg-blue-500/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                                        Par défaut
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {addr.fullName} - {addr.phone}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {[addr.cite, addr.rue, addr.city].filter(Boolean).join(', ')}
                                  </p>
                                  {addr.description && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">{addr.description}</p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {customerAddresses.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Ce client n'a pas d'adresse enregistrée
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-green-500 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Produits</h2>
            </div>

            {/* Product Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => searchProducts(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 text-gray-900 dark:text-white"
              />
            </div>

            {productResults.length > 0 && (
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                {productResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-left transition-all duration-200 border border-gray-200 dark:border-transparent"
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

            {/* Order Items */}
            {orderItems.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun produit ajouté</p>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.productId} className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          +
                        </button>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">× {item.price.toLocaleString()} CFA</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.total.toLocaleString()} CFA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipping & Payment */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-transparent shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Livraison et Paiement</h2>
            </div>

            <div className="space-y-4">
              {/* Shipping Methods from Database */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode de livraison</label>
                {shippingMethods.length > 0 ? (
                  <div className="space-y-2">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedShippingMethodId === method.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.id}
                          checked={selectedShippingMethodId === method.id}
                          onChange={(e) => {
                            setSelectedShippingMethodId(e.target.value)
                            if (method.costType !== 'variable') {
                              setShippingCost(method.cost || 0)
                            }
                          }}
                          className="mt-1 text-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                            <span className={method.costType === 'free' ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}>
                              {method.costType === 'free' ? 'Gratuit' :
                               method.costType === 'variable' ? 'Variable' :
                               `${(method.cost || 0).toLocaleString()} CFA`}
                            </span>
                          </div>
                          {method.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                          )}
                          {method.estimatedDays && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Délai: {method.estimatedDays}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucune méthode de livraison configurée</p>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      placeholder="Frais de livraison manuels..."
                      className="w-full mt-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode de paiement *</label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.code
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.code}
                        checked={paymentMethod === method.code}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-purple-500"
                      />
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        {method.code === 'CASH_ON_DELIVERY' && <Banknote className="w-5 h-5 text-green-500" />}
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
                        <span>{method.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes internes sur la commande..."
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 resize-none text-gray-900 dark:text-white"
                />
              </div>

              {/* Manual Order Date */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-semibold text-orange-600 dark:text-orange-400">Date de commande (Offline)</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Pour les commandes passées sans internet, définissez la date réelle de la commande.
                </p>
                <input
                  type="datetime-local"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Laissez vide pour utiliser la date/heure actuelle
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 sticky top-6 border border-gray-200 dark:border-transparent shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Récapitulatif</h2>
            </div>

            <div className="space-y-3">
              {/* Promo Code Input */}
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code promo
                </label>
                {appliedCoupon ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                        <div>
                          <p className="text-green-600 dark:text-green-400 font-semibold">{appliedCoupon.code}</p>
                          {appliedCoupon.description && (
                            <p className="text-green-600/70 dark:text-green-400/70 text-xs">{appliedCoupon.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Retirer le code"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                      {appliedCoupon.discountType === 'percentage'
                        ? `-${appliedCoupon.discountValue}%`
                        : `-${appliedCoupon.discountValue.toLocaleString()} CFA`}
                      {appliedCoupon.maximumDiscount && ` (max ${appliedCoupon.maximumDiscount.toLocaleString()} CFA)`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            setCouponError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApplyCoupon()
                          }}
                          placeholder="CODE PROMO"
                          className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                          disabled={couponLoading}
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        {couponLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'OK'
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-500 dark:text-red-400 text-sm mt-2">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                <span className="font-semibold text-gray-900 dark:text-white">{subtotal.toLocaleString()} CFA</span>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Remise manuelle</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Frais de livraison</label>
                {selectedShipping ? (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                    <span className={selectedShipping.costType === 'free' ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}>
                      {selectedShipping.costType === 'free' ? 'Gratuit' :
                       selectedShipping.costType === 'variable' ? 'À définir' :
                       `${calculatedShippingCost.toLocaleString()} CFA`}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">({selectedShipping.name})</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                )}
              </div>

              {/* Show coupon discount if applied */}
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Réduction ({appliedCoupon?.code})</span>
                  <span>-{couponDiscount.toLocaleString()} CFA</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{total.toLocaleString()} CFA</span>
                </div>
                {totalDiscount > 0 && (
                  <p className="text-green-600 dark:text-green-400 text-sm text-right mt-1">
                    Économie: {totalDiscount.toLocaleString()} CFA
                  </p>
                )}
              </div>

              {/* Notification Settings */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendSMS}
                    onChange={(e) => setSendSMS(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Envoyer SMS</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-green-500 focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Envoyer WhatsApp</span>
                  </div>
                </label>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Le client recevra une notification de confirmation de commande
                </p>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading || !selectedCustomer || orderItems.length === 0}
                className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 text-white"
              >
                {loading ? 'Création...' : 'Créer la commande'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-green-500/30 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              {/* Success icon with animation */}
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-3">
                Commande créée avec succès !
              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-2">
                La commande <span className="font-semibold text-gray-900 dark:text-white">#{createdOrderNumber}</span> a été créée.
              </p>

              <p className="text-gray-500 text-sm mb-6">
                {selectedCustomer?.name && `Client: ${selectedCustomer.name}`}
                {total > 0 && ` • Total: ${total.toLocaleString()} CFA`}
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
