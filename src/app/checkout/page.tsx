'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header-legacy'
import { Footer } from '@/components/footer'
import { useCart } from '@/store/cart'
import { useCurrency } from '@/store/currency'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { CreditCard, Truck, MapPin, Navigation, Loader2, Tag, X, ChevronDown, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  cost: number | null
  costType: string
  isVariable: boolean
  estimatedDays: string | null
  taxable: boolean
}

interface SavedAddress {
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
  latitude: number | null
  longitude: number | null
  geoAccuracy: number | null
  isDefault: boolean
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, getTotal, clearCart, coupon, getDiscount, getFinalTotal, removeCoupon } = useCart()
  const { currency, exchangeRate } = useCurrency()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [loadingShipping, setLoadingShipping] = useState(true)
  const [gettingLocation, setGettingLocation] = useState(false)

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new')
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    quartier: '',
    cite: '',
    rue: '',
    city: 'Abidjan',
    description: '',
    latitude: null as number | null,
    longitude: null as number | null,
    geoAccuracy: null as number | null,
    shippingMethodId: '',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentChannel: '',
  })

  const subtotal = getTotal()
  const discount = getDiscount()
  const subtotalAfterDiscount = getFinalTotal()

  // Get selected shipping method
  const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethodId)
  const shippingCost = selectedShipping?.isVariable ? 0 : (selectedShipping?.cost || 0)
  const finalTotal = subtotalAfterDiscount + shippingCost

  // Fetch shipping methods
  useEffect(() => {
    fetchShippingMethods()
  }, [subtotal])

  // Fetch saved addresses and prefill with default
  useEffect(() => {
    if (session) {
      fetchSavedAddresses()
    }
  }, [session])

  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const response = await fetch('/api/account/addresses')
      const data = await response.json()

      if (response.ok && data.addresses) {
        setSavedAddresses(data.addresses)

        // Find default address or use first one
        const defaultAddress = data.addresses.find((addr: SavedAddress) => addr.isDefault) || data.addresses[0]

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          prefillFormWithAddress(defaultAddress)
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const prefillFormWithAddress = (address: SavedAddress) => {
    setFormData(prev => ({
      ...prev,
      fullName: address.fullName || '',
      phone: address.phone || '',
      quartier: address.quartier || address.addressLine1 || '',
      cite: address.cite || address.addressLine2 || '',
      rue: address.rue || '',
      city: address.city || 'Abidjan',
      description: address.description || '',
      latitude: address.latitude,
      longitude: address.longitude,
      geoAccuracy: address.geoAccuracy,
    }))
  }

  const handleAddressSelect = (addressId: string | 'new') => {
    setSelectedAddressId(addressId)
    setShowAddressDropdown(false)

    if (addressId === 'new') {
      // Reset form for new address
      setFormData(prev => ({
        ...prev,
        fullName: '',
        phone: '',
        quartier: '',
        cite: '',
        rue: '',
        city: 'Abidjan',
        description: '',
        latitude: null,
        longitude: null,
        geoAccuracy: null,
      }))
    } else {
      // Find and prefill selected address
      const address = savedAddresses.find(a => a.id === addressId)
      if (address) {
        prefillFormWithAddress(address)
      }
    }
  }

  const fetchShippingMethods = async () => {
    try {
      setLoadingShipping(true)
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: "Côte d'Ivoire",
          orderTotal: subtotal,
        }),
      })

      const data = await response.json()

      if (data.success && data.methods.length > 0) {
        setShippingMethods(data.methods)
        // Auto-select first method
        setFormData(prev => ({ ...prev, shippingMethodId: data.methods[0].id }))
      }
    } catch (error) {
      console.error('Error fetching shipping methods:', error)
    } finally {
      setLoadingShipping(false)
    }
  }

  // Get user's geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          geoAccuracy: position.coords.accuracy,
        }))
        toast.success('Position récupérée avec succès!')
        setGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let message = 'Impossible de récupérer votre position'
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Vous avez refusé l\'accès à la géolocalisation'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Position non disponible'
        } else if (error.code === error.TIMEOUT) {
          message = 'Délai d\'attente dépassé'
        }
        toast.error(message)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </main>
        <Footer />
      </div>
    )
  }

  // Redirect to cart if not authenticated (auth modal is in cart)
  if (!session) {
    router.push('/cart')
    return null
  }

  // Don't redirect if order was just placed (cart cleared after success)
  // Check sessionStorage as backup for page refreshes
  const lastOrderId = typeof window !== 'undefined'
    ? sessionStorage.getItem('lastOrderId')
    : null

  if (items.length === 0 && !orderPlaced && !lastOrderId) {
    router.push('/cart')
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.shippingMethodId) {
      toast.error('Veuillez sélectionner un mode de livraison')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        address: {
          fullName: formData.fullName,
          phone: formData.phone,
          quartier: formData.quartier,
          cite: formData.cite,
          rue: formData.rue,
          city: formData.city,
          description: formData.description,
          latitude: formData.latitude,
          longitude: formData.longitude,
          geoAccuracy: formData.geoAccuracy,
        },
        shippingMethodId: formData.shippingMethodId,
        paymentMethod: formData.paymentMethod,
        paymentChannel: formData.paymentChannel || undefined,
        subtotal,
        discount,
        couponId: coupon?.id,
        couponCode: coupon?.code,
        shippingCost: selectedShipping?.isVariable ? null : shippingCost,
        total: finalTotal,
      }

      // Store order data in sessionStorage for the progress page
      sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData))

      // Navigate to progress page with payment method flow
      setOrderPlaced(true)
      router.push(`/order-progress?flow=${formData.paymentMethod}`)

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-sans font-bold text-gray-900 dark:text-white mb-8">
          Finaliser la commande
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Address Section */}
              <div className="bg-white dark:bg-transparent rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      1
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Adresse de livraison
                    </h2>
                  </div>

                  {/* Geolocation button */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    Ma position GPS
                  </button>
                </div>

                {/* Address Selector Dropdown */}
                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                      Sélectionner une adresse
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                        className="w-full flex items-center justify-between bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <span className="truncate">
                          {selectedAddressId === 'new' ? (
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Nouvelle adresse
                            </span>
                          ) : (
                            savedAddresses.find(a => a.id === selectedAddressId)?.quartier || 'Sélectionner...'
                          )}
                        </span>
                        <ChevronDown className={`h-5 w-5 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showAddressDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {/* New Address Option */}
                          <button
                            type="button"
                            onClick={() => handleAddressSelect('new')}
                            className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors ${
                              selectedAddressId === 'new' ? 'bg-primary-500/20 text-primary-500 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            <Plus className="h-4 w-4" />
                            Nouvelle adresse
                          </button>

                          {/* Saved Addresses */}
                          {savedAddresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => handleAddressSelect(address.id)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border-t border-gray-200 dark:border-dark-700 ${
                                selectedAddressId === address.id ? 'bg-primary-500/20 text-primary-500 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">
                                    {address.quartier || address.addressLine1}
                                    {address.isDefault && (
                                      <span className="ml-2 text-xs bg-primary-500/30 text-primary-500 dark:text-primary-400 px-2 py-0.5 rounded">
                                        Par défaut
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {address.fullName} - {address.phone}
                                  </p>
                                  {address.cite && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{address.cite}</p>
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

                {/* Show GPS coordinates if available */}
                {formData.latitude && formData.longitude && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Position GPS enregistrée (précision: {formData.geoAccuracy?.toFixed(0)}m)
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Row 1: Nom + Téléphone */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Optionnel"
                      className="w-full bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+225 XX XX XX XX XX"
                      className="w-full bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  {/* Row 2: Commune + Cité */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Commune / Quartier *
                    </label>
                    <input
                      type="text"
                      name="quartier"
                      required
                      value={formData.quartier}
                      onChange={handleInputChange}
                      placeholder="Cocody, Marcory..."
                      className="w-full bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Cité / Zone
                    </label>
                    <input
                      type="text"
                      name="cite"
                      value={formData.cite}
                      onChange={handleInputChange}
                      placeholder="Riviera 2, Zone 4..."
                      className="w-full bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  {/* Row 3: Rue + Ville */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Rue / Adresse
                    </label>
                    <input
                      type="text"
                      name="rue"
                      value={formData.rue}
                      onChange={handleInputChange}
                      placeholder="Numéro et nom de rue"
                      className="w-full bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      disabled
                      className="w-full bg-gray-200 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 px-3 py-2 rounded-lg cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Row 4: Indications (full width) */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Indications pour le livreur
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Ex: Pharmacie Lagunes, tourner à gauche, maison bleue portail noir..."
                      rows={2}
                      className="w-full bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Livraison uniquement à Abidjan
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white dark:bg-transparent rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Mode de paiement des articles
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Cash on Delivery - Default */}
                  <label className="flex items-center gap-3 border border-gray-200 dark:border-dark-700 p-4 rounded-lg cursor-pointer hover:border-primary-500">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_ON_DELIVERY"
                      checked={formData.paymentMethod === 'CASH_ON_DELIVERY'}
                      onChange={handleInputChange}
                      className="text-primary-500"
                    />
                    <Truck className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Je paierai à la livraison</span>
                  </label>

                  {/* PaiementPro */}
                  <label className="flex items-center gap-3 border border-gray-200 dark:border-dark-700 p-4 rounded-lg cursor-pointer hover:border-primary-500">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PAIEMENTPRO"
                      checked={formData.paymentMethod === 'PAIEMENTPRO'}
                      onChange={handleInputChange}
                      className="text-primary-500"
                    />
                    <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Je paie en ligne (Wave, MTN, Orange, Moov, PayPal, Visa, Mastercard)</span>
                  </label>

                  {/* PaiementPro channel selection */}
                  {formData.paymentMethod === 'PAIEMENTPRO' && (
                    <div className="ml-8 border border-gray-200 dark:border-dark-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Choisir votre moyen de paiement:
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded">
                          <input
                            type="radio"
                            name="paymentChannel"
                            value=""
                            checked={formData.paymentChannel === ''}
                            onChange={handleInputChange}
                            className="text-primary-500"
                          />
                          <span className="text-gray-900 dark:text-white text-sm">Page de paiement</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded">
                          <input
                            type="radio"
                            name="paymentChannel"
                            value="OMCIV2"
                            checked={formData.paymentChannel === 'OMCIV2'}
                            onChange={handleInputChange}
                          />
                          <div className="w-3 h-3 bg-orange-500 rounded" />
                          <span className="text-gray-900 dark:text-white text-sm">Orange Money</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded">
                          <input
                            type="radio"
                            name="paymentChannel"
                            value="MOMOCI"
                            checked={formData.paymentChannel === 'MOMOCI'}
                            onChange={handleInputChange}
                          />
                          <div className="w-3 h-3 bg-yellow-500 rounded" />
                          <span className="text-gray-900 dark:text-white text-sm">MTN MoMo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded">
                          <input
                            type="radio"
                            name="paymentChannel"
                            value="FLOOZ"
                            checked={formData.paymentChannel === 'FLOOZ'}
                            onChange={handleInputChange}
                          />
                          <div className="w-3 h-3 bg-blue-400 rounded" />
                          <span className="text-gray-900 dark:text-white text-sm">Moov Money</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded">
                          <input
                            type="radio"
                            name="paymentChannel"
                            value="WAVECI"
                            checked={formData.paymentChannel === 'WAVECI'}
                            onChange={handleInputChange}
                          />
                          <div className="w-3 h-3 bg-blue-600 rounded" />
                          <span className="text-gray-900 dark:text-white text-sm">Wave</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded">
                          <input
                            type="radio"
                            name="paymentChannel"
                            value="CARD"
                            checked={formData.paymentChannel === 'CARD'}
                            onChange={handleInputChange}
                          />
                          <CreditCard className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white text-sm">PayPal / Carte bancaire</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

 {/* Shipping Section */}
              <div className="bg-white dark:bg-transparent rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Mode de livraison
                  </h2>
                </div>

                {loadingShipping ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucune méthode de livraison disponible
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start gap-3 border p-4 rounded-lg cursor-pointer transition-colors ${
                          formData.shippingMethodId === method.id
                            ? 'border-primary-500 bg-primary-500/5'
                            : 'border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethodId"
                          value={method.id}
                          checked={formData.shippingMethodId === method.id}
                          onChange={handleInputChange}
                          className="mt-1 text-primary-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-white font-medium">{method.name}</span>
                            {method.isVariable ? (
                              <span className="text-yellow-600 dark:text-yellow-400 text-sm">À payer au livreur</span>
                            ) : method.cost === 0 ? (
                              <span className="text-green-600 dark:text-green-500">Gratuit</span>
                            ) : (
                              <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(method.cost!, currency, exchangeRate)}</span>
                            )}
                          </div>
                          {method.description && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{method.description}</p>
                          )}
                          {method.estimatedDays && (
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                              Délai estimé: {method.estimatedDays}
                            </p>
                          )}
                          {method.isVariable && (
                            <p className="text-yellow-600/80 dark:text-yellow-400/80 text-xs mt-2">
                              Les frais de livraison seront communiqués par le livreur et payés à la réception.
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.shippingMethodId}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 text-white font-semibold py-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Traitement...' : 'Confirmer la commande'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-transparent rounded-lg p-6 sticky top-24 border border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Votre commande
              </h2>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {formatPrice(item.price * item.quantity, currency, exchangeRate)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Applied Coupon */}
              {coupon && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-500" />
                      <span className="text-green-400 font-medium text-sm">{coupon.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon()
                        toast.success('Code promo retiré')
                      }}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-dark-800 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal, currency, exchangeRate)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Réduction ({coupon?.code})</span>
                    <span>-{formatPrice(discount, currency, exchangeRate)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Frais de Livraison</span>
                  <span>
                    {!selectedShipping ? (
                      <span className="text-gray-400 dark:text-gray-500">Sélectionnez une option</span>
                    ) : selectedShipping.isVariable ? (
                      <span className="text-yellow-600 dark:text-yellow-400">À payer au livreur</span>
                    ) : shippingCost === 0 ? (
                      <span className="text-green-600 dark:text-green-500">Gratuit</span>
                    ) : (
                      formatPrice(shippingCost, currency, exchangeRate)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg pt-2 border-t border-gray-200 dark:border-dark-800">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal, currency, exchangeRate)}</span>
                </div>
                {selectedShipping?.isVariable && (
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                    + frais de livraison à payer au livreur
                  </p>
                )}
                {discount > 0 && (
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    Vous économisez {formatPrice(discount, currency, exchangeRate)}
                  </p>
                )}
              </div>

              <div className="rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-700">
                <p className="flex items-start gap-2">
                  <Truck className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span>
                    {selectedShipping?.estimatedDays
                      ? `Livraison estimée: ${selectedShipping.estimatedDays}`
                      : 'Livraison à Abidjan uniquement'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
