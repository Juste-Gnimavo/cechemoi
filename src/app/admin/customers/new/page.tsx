'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Mail, Send, User, MapPin, Globe, Image as ImageIcon, ExternalLink, UserPlus, Gift, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { GeolocationCapture } from '@/components/geolocation-capture'
import { ImageUpload } from '@/components/image-upload'
import { useConfetti } from '@/hooks/useConfetti'
import { MeasurementsForm } from '@/components/admin/measurements-form'

// Helper function for date format conversion (French format DD-MM-YYYY -> ISO YYYY-MM-DD)
const formatDateToISO = (frenchDate: string | null | undefined): string | null => {
  if (!frenchDate) return null
  const parts = frenchDate.split('-')
  if (parts.length !== 3) return frenchDate // Return as-is if not valid format
  return `${parts[2]}-${parts[1]}-${parts[0]}` // DD-MM-YYYY -> YYYY-MM-DD
}

export default function NewCustomerPage() {
  const router = useRouter()
  const { welcome } = useConfetti()
  const [loading, setLoading] = useState(false)

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null)
  const [createdCustomerName, setCreatedCustomerName] = useState<string | null>(null)

  // Customer fields - Basic Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [image, setImage] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [howDidYouHearAboutUs, setHowDidYouHearAboutUs] = useState('')
  const [customSource, setCustomSource] = useState('')
  const [availableSources, setAvailableSources] = useState<string[]>([])

  // Default sources for the dropdown
  const DEFAULT_SOURCES = ['Instagram', 'Facebook', 'TikTok', 'Google', 'Bouche à oreille', 'Publicité', 'Événement']

  // Fetch existing sources from API
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await fetch('/api/admin/customers/sources?period=all')
        const data = await res.json()
        if (data.success && data.stats) {
          const apiSources = data.stats
            .map((s: { source: string }) => s.source)
            .filter((s: string) => s !== 'Non spécifié')
          setAvailableSources(apiSources)
        }
      } catch (error) {
        console.error('Error fetching sources:', error)
      }
    }
    fetchSources()
  }, [])

  // Build merged source options: defaults + API sources (deduplicated)
  const sourceOptions = [
    ...DEFAULT_SOURCES,
    ...availableSources.filter(s => !DEFAULT_SOURCES.includes(s) && s !== 'Autre'),
  ]

  // Measurements
  const [measurementsData, setMeasurementsData] = useState<any>(null)

  // Location fields
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Côte d\'Ivoire')
  const [countryCode, setCountryCode] = useState('CI')


  // Notes
  const [notes, setNotes] = useState('')

  // Custom inscription date (for backdating)
  const [inscriptionDate, setInscriptionDate] = useState('')

  // Address fields (optional - can add address during customer creation)
  const [addAddress, setAddAddress] = useState(false)
  const [addressFullName, setAddressFullName] = useState('')
  const [addressPhone, setAddressPhone] = useState('')
  const [rue, setRue] = useState('')
  const [quartier, setQuartier] = useState('')
  const [cite, setCite] = useState('')
  const [ville, setVille] = useState('Abidjan')
  const [addressDescription, setAddressDescription] = useState('')
  const [addressCountry, setAddressCountry] = useState('Côte d\'Ivoire')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null)

  // Notifications
  const [sendWelcomeSMS, setSendWelcomeSMS] = useState(true)
  const [sendWelcomeWhatsApp, setSendWelcomeWhatsApp] = useState(true)

  // Collapsed sections (collapsed by default on mobile)
  const [locationCollapsed, setLocationCollapsed] = useState(true)
  const [notesCollapsed, setNotesCollapsed] = useState(true)
  const [welcomeCollapsed, setWelcomeCollapsed] = useState(true)

  const handleLocationCaptured = (geoData: { latitude: number; longitude: number; accuracy: number }) => {
    setLatitude(geoData.latitude)
    setLongitude(geoData.longitude)
    setGeoAccuracy(geoData.accuracy)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !phone) {
      toast.error('Prénom et téléphone sont requis')
      return
    }

    // Validate phone format - must start with + for international format
    if (!phone.startsWith('+')) {
      toast.error('Le numéro de téléphone doit être au format international (ex: +225...)')
      return
    }

    // Validate email if provided
    if (email && !email.includes('@')) {
      toast.error('Format d\'email invalide')
      return
    }

    try {
      setLoading(true)

      // Build full name
      const fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName.trim()

      // Prepare address data if user wants to add address
      let addressData = null
      if (addAddress) {
        if (!ville) {
          toast.error('Ville est requise pour l\'adresse')
          return
        }

        // Build combined addressLine1 from African fields
        const addressParts = [rue, quartier, cite].filter(Boolean)
        const combinedAddress = addressParts.length > 0 ? addressParts.join(', ') : ville

        addressData = {
          fullName: addressFullName || fullName,
          phone: addressPhone || phone,
          rue: rue || null,
          quartier: quartier || null,
          cite: cite || null,
          city: ville,
          description: addressDescription || null,
          addressLine1: combinedAddress,
          addressLine2: addressDescription || null,
          country: addressCountry,
          latitude: latitude,
          longitude: longitude,
          geoAccuracy: geoAccuracy,
          geoSource: latitude && longitude ? 'browser' : null,
          isDefault: true, // First address is default
        }
      }

      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: email || null,
          phone,
          whatsappNumber: whatsappNumber || phone,
          image: image || null,
          dateOfBirth: formatDateToISO(dateOfBirth),
          howDidYouHearAboutUs: (howDidYouHearAboutUs === 'Autre' && customSource.trim() ? customSource.trim() : howDidYouHearAboutUs) || null,
          city: city || null,
          country: country || null,
          countryCode: countryCode || null,
          role: 'CUSTOMER',
          notes: notes || null,
          inscriptionDate: inscriptionDate || null,
          address: addressData,
          measurements: measurementsData,
          sendWelcomeSMS,
          sendWelcomeWhatsApp,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Show success modal with confetti
        setCreatedCustomerId(data.customer.id)
        setCreatedCustomerName(fullName)
        setShowSuccessModal(true)
        welcome()
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCustomer = () => {
    if (createdCustomerId) {
      router.push(`/admin/customers/${createdCustomerId}`)
    }
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedCustomerId(null)
    setCreatedCustomerName(null)
    // Reset form
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setWhatsappNumber('')
    setImage('')
    setDateOfBirth('')
    setHowDidYouHearAboutUs('')
    setCustomSource('')
    setMeasurementsData(null)
    setCity('')
    setCountry('Côte d\'Ivoire')
    setCountryCode('CI')
    setNotes('')
    setInscriptionDate('')
    setAddAddress(false)
    setAddressFullName('')
    setAddressPhone('')
    setRue('')
    setQuartier('')
    setCite('')
    setVille('Abidjan')
    setAddressDescription('')
    setAddressCountry('Côte d\'Ivoire')
    setLatitude(null)
    setLongitude(null)
    setGeoAccuracy(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Client</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ajouter un client manuellement</p>
        </div>
        <Link
          href="/admin/customers"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
      </div>

      {/* Required Fields Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <span className="text-red-500 font-bold">*</span>
          <span>Seuls les champs avec astérisques sont obligatoires. Les autres sections sont facultatives.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations Personnelles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Jean"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Nom <span className="text-gray-500 dark:text-gray-400 text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Dupont"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide si le client n'a qu'un seul nom
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="jean@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+225XXXXXXXXXX ou +33XXXXXXXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format international avec indicatif pays (ex: +225, +33, +1...)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+225... ou +33..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Si vide, utilise le numéro de téléphone principal
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                <Gift className="h-4 w-4 inline mr-2" />
                Date d'anniversaire
              </label>
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="JJ-MM-AAAA (ex: 30-06-1983)"
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: JJ-MM-AAAA (ex: 30-06-1983)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Comment avez-vous connu CECHEMOI ?
              </label>
              <select
                value={howDidYouHearAboutUs}
                onChange={(e) => {
                  setHowDidYouHearAboutUs(e.target.value)
                  if (e.target.value !== 'Autre') setCustomSource('')
                }}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sélectionner...</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source === 'Bouche à oreille' ? 'Bouche à oreille (ami/famille)' : source === 'Événement' ? 'Événement / Salon' : source}
                  </option>
                ))}
                <option value="Autre">Autre</option>
              </select>
              {howDidYouHearAboutUs === 'Autre' && (
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  className="w-full mt-2 px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Précisez la source..."
                />
              )}
            </div>
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Photo de profil
            </label>
            <ImageUpload
              value={image}
              onChange={(url) => setImage(url || '')}
              category="customers/profiles"
              useS3={true}
              maxSizeMB={5}
            />
            <p className="text-xs text-gray-500 mt-2">
              Cliquez ou glissez-déposez une image (JPG, PNG, max. 5 Mo)
            </p>
          </div>
        </div>

        {/* Measurements Section - Facultatif */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <MeasurementsForm
            onChange={(data) => setMeasurementsData(data)}
            collapsed={true}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Les mensurations peuvent être ajoutées maintenant ou plus tard depuis la fiche client.
          </p>
        </div>

        {/* Location Information - Collapsible - Facultatif */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setLocationCollapsed(!locationCollapsed)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-400" />
              Localisation
              <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded">Facultatif</span>
              {(city || country !== 'Côte d\'Ivoire') && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({city || country})
                </span>
              )}
            </h2>
            {locationCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {!locationCollapsed && (
            <div className="p-6 pt-2 space-y-4 border-t border-gray-200 dark:border-dark-700">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Abidjan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Pays
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Mali">Mali</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Bénin">Bénin</option>
                    <option value="Togo">Togo</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="France">France</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Code Pays
                  </label>
                  <input
                    type="text"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="CI"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Code ISO à 2 lettres
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Address Section - Facultatif */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-400" />
              Adresse de Livraison
              <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded">Facultatif</span>
            </h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addAddress}
                onChange={(e) => setAddAddress(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Ajouter une adresse</span>
            </label>
          </div>

          {addAddress && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajoutez une adresse de livraison pour ce client (sera marquée par défaut)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Nom complet pour livraison
                  </label>
                  <input
                    type="text"
                    value={addressFullName}
                    onChange={(e) => setAddressFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Si vide, utilise le nom du client"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour utiliser le nom du client
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Téléphone pour livraison
                  </label>
                  <input
                    type="tel"
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Si vide, utilise le téléphone du client"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour utiliser le téléphone du client
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Rue
                  </label>
                  <input
                    type="text"
                    value={rue}
                    onChange={(e) => setRue(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Rue des Jardins"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Quartier
                  </label>
                  <input
                    type="text"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Cocody, Marcory"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Cité
                  </label>
                  <input
                    type="text"
                    value={cite}
                    onChange={(e) => setCite(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Angré, Riviera"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Abidjan">Abidjan</option>
                    <option value="Yamoussoukro">Yamoussoukro</option>
                    <option value="Bouaké">Bouaké</option>
                    <option value="Daloa">Daloa</option>
                    <option value="San-Pédro">San-Pédro</option>
                    <option value="Korhogo">Korhogo</option>
                    <option value="Man">Man</option>
                    <option value="Gagnoa">Gagnoa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Pays
                  </label>
                  <select
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Mali">Mali</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Bénin">Bénin</option>
                    <option value="Togo">Togo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Indications / Directions
                </label>
                <textarea
                  value={addressDescription}
                  onChange={(e) => setAddressDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: À partir de la pharmacie Lagunes, tourner à gauche après le feu rouge. Maison bleue avec portail blanc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Directions précises pour faciliter la livraison (pas de code postal en Afrique)
                </p>
              </div>

              {/* Geolocation Capture */}
              <GeolocationCapture
                onLocationCaptured={handleLocationCaptured}
                currentLocation={
                  latitude && longitude
                    ? {
                        latitude: latitude,
                        longitude: longitude,
                        accuracy: geoAccuracy || 0,
                      }
                    : null
                }
              />

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-400 flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Cette adresse sera automatiquement marquée comme adresse par défaut du client.
                    Le client pourra ajouter d'autres adresses depuis son espace personnel.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes - Collapsible */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setNotesCollapsed(!notesCollapsed)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-gray-400" />
              Notes
              <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded">Facultatif</span>
              {notes && (
                <span className="ml-2 text-sm font-normal text-green-500">
                  (renseigné)
                </span>
              )}
            </h2>
            {notesCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {!notesCollapsed && (
            <div className="p-6 pt-2 space-y-4 border-t border-gray-200 dark:border-dark-700">
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Notes internes sur le client..."
                />
              </div>

              {/* Custom Inscription Date */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-semibold text-orange-400">Date d'inscription (Antidater)</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Pour les clients ajoutés a posteriori, définissez la date réelle de leur inscription.
                </p>
                <input
                  type="datetime-local"
                  value={inscriptionDate}
                  onChange={(e) => setInscriptionDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Laissez vide pour utiliser la date/heure actuelle
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Welcome Notifications - Collapsible */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setWelcomeCollapsed(!welcomeCollapsed)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
              <Send className="h-5 w-5 text-blue-400" />
              Notifications de Bienvenue
              <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded">Facultatif</span>
              {(sendWelcomeSMS || sendWelcomeWhatsApp) && (
                <span className="text-xs font-normal text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {[sendWelcomeSMS && 'SMS', sendWelcomeWhatsApp && 'WhatsApp'].filter(Boolean).join(' + ')}
                </span>
              )}
            </h2>
            {welcomeCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {!welcomeCollapsed && (
            <div className="p-6 pt-2 space-y-3 border-t border-gray-200 dark:border-dark-700">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={sendWelcomeSMS}
                  onChange={(e) => setSendWelcomeSMS(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4 text-blue-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Envoyer SMS de bienvenue</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Le client recevra un SMS pour lui souhaiter la bienvenue
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={sendWelcomeWhatsApp}
                  onChange={(e) => setSendWelcomeWhatsApp(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-green-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Envoyer WhatsApp de bienvenue</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Le client recevra un message WhatsApp de bienvenue
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/customers"
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
            <span>{loading ? 'Création...' : 'Créer le Client'}</span>
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-900 rounded-2xl border border-green-500/30 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              {/* Success icon with animation */}
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <UserPlus className="w-10 h-10 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-3">
                Client créé avec succès !
              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Le client <span className="font-semibold text-gray-900 dark:text-white">{createdCustomerName}</span> a été ajouté.
              </p>

              <p className="text-gray-500 text-sm mb-6">
                {phone && `Téléphone: ${phone}`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateAnother}
                  className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg transition-colors border border-gray-200 dark:border-dark-700"
                >
                  Nouveau client
                </button>
                <button
                  onClick={handleViewCustomer}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Voir le client
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
