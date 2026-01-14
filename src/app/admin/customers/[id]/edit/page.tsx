'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, User, MapPin, Gift, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ImageUpload } from '@/components/image-upload'
import { MeasurementsForm } from '@/components/admin/measurements-form'

interface CustomerData {
  id: string
  name: string
  email?: string | null
  phone: string
  whatsappNumber?: string | null
  image?: string | null
  dateOfBirth?: string | null
  howDidYouHearAboutUs?: string | null
  city?: string | null
  country?: string | null
  countryCode?: string | null
  createdAt: string
  loyaltyAccount?: {
    tier: string
    points: number
  } | null
}

interface Measurement {
  id: string
  measurementDate: string
  unit: 'cm' | 'inches'
  dos?: string | null
  carrureDevant?: string | null
  carrureDerriere?: string | null
  epaule?: string | null
  epauleManche?: string | null
  poitrine?: string | null
  tourDeTaille?: string | null
  longueurDetaille?: string | null
  bassin?: string | null
  longueurManches?: string | null
  tourDeManche?: string | null
  poignets?: string | null
  pinces?: string | null
  longueurTotale?: string | null
  longueurRobes?: string | null
  longueurTunique?: string | null
  ceinture?: string | null
  longueurPantalon?: string | null
  frappe?: string | null
  cuisse?: string | null
  genoux?: string | null
  longueurJupe?: string | null
  autresMesures?: string | null
}

// Helper functions for date format conversion (French format DD-MM-YYYY <-> ISO YYYY-MM-DD)
const formatDateToFrench = (isoDate: string | null | undefined): string => {
  if (!isoDate) return ''
  const date = isoDate.split('T')[0] // Handle ISO datetime
  const parts = date.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}-${parts[1]}-${parts[0]}` // YYYY-MM-DD -> DD-MM-YYYY
}

const formatDateToISO = (frenchDate: string | null | undefined): string | null => {
  if (!frenchDate) return null
  const parts = frenchDate.split('-')
  if (parts.length !== 3) return frenchDate // Return as-is if not valid format
  return `${parts[2]}-${parts[1]}-${parts[0]}` // DD-MM-YYYY -> YYYY-MM-DD
}

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Customer fields - Basic Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [image, setImage] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [howDidYouHearAboutUs, setHowDidYouHearAboutUs] = useState('')

  // Location fields
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [countryCode, setCountryCode] = useState('')

  // Loyalty program
  const [loyaltyTier, setLoyaltyTier] = useState('bronze')
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)

  // Custom inscription date
  const [inscriptionDate, setInscriptionDate] = useState('')

  // Measurements
  const [measurementsData, setMeasurementsData] = useState<any>(null)
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement | null>(null)

  useEffect(() => {
    fetchCustomer()
    fetchMeasurements()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/customers/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const customer = data.customer as CustomerData

        // Parse name into first and last name
        const nameParts = customer.name?.split(' ') || ['']
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')

        setEmail(customer.email || '')
        setPhone(customer.phone || '')
        setWhatsappNumber(customer.whatsappNumber || '')
        setImage(customer.image || '')
        setDateOfBirth(formatDateToFrench(customer.dateOfBirth))
        setHowDidYouHearAboutUs(customer.howDidYouHearAboutUs || '')
        setCity(customer.city || '')
        setCountry(customer.country || '')
        setCountryCode(customer.countryCode || '')
        setInscriptionDate(customer.createdAt ? new Date(customer.createdAt).toISOString().slice(0, 16) : '')

        // Loyalty
        if (customer.loyaltyAccount) {
          setLoyaltyTier(customer.loyaltyAccount.tier || 'bronze')
          setLoyaltyPoints(customer.loyaltyAccount.points || 0)
        }
      } else {
        toast.error('Client non trouvé')
        router.push('/admin/customers')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchMeasurements = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}/measurements`)
      const data = await response.json()

      if (data.success && data.currentMeasurement) {
        setCurrentMeasurement(data.currentMeasurement)
        setMeasurementsData(data.currentMeasurement)
      }
    } catch (error) {
      console.error('Error fetching measurements:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !phone) {
      toast.error('Prénom et téléphone sont requis')
      return
    }

    // Validate phone format
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
      setSaving(true)

      // Build full name
      const fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName.trim()

      const res = await fetch(`/api/admin/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: email || null,
          phone,
          whatsappNumber: whatsappNumber || phone,
          image: image || null,
          dateOfBirth: formatDateToISO(dateOfBirth),
          howDidYouHearAboutUs: howDidYouHearAboutUs || null,
          city: city || null,
          country: country || null,
          countryCode: countryCode || null,
          inscriptionDate: inscriptionDate || null,
          loyaltyTier,
          loyaltyPoints,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Save measurements if changed
        if (measurementsData && Object.keys(measurementsData).length > 0) {
          await fetch(`/api/admin/customers/${params.id}/measurements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(measurementsData),
          })
        }

        toast.success('Client mis à jour avec succès')
        router.push(`/admin/customers/${params.id}`)
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le Client</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {firstName} {lastName}
          </p>
        </div>
        <Link
          href={`/admin/customers/${params.id}`}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
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
                placeholder="+225XXXXXXXXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format international avec indicatif pays
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
                placeholder="+225..."
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
                onChange={(e) => setHowDidYouHearAboutUs(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sélectionner...</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="Google">Google</option>
                <option value="Bouche a oreille">Bouche à oreille (ami/famille)</option>
                <option value="Publicite">Publicité</option>
                <option value="Evenement">Évènement / Salon</option>
                <option value="Autre">Autre</option>
              </select>
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
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-400" />
            Localisation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="">Sélectionner...</option>
                <option value="Cote d'Ivoire">Côte d'Ivoire</option>
                <option value="Senegal">Sénégal</option>
                <option value="Mali">Mali</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Benin">Bénin</option>
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
                Code ISO a 2 lettres
              </p>
            </div>
          </div>
        </div>

        {/* Measurements Section */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <MeasurementsForm
            initialData={currentMeasurement || undefined}
            onChange={(data) => setMeasurementsData(data)}
            collapsed={true}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Les mensurations seront enregistrees comme nouvelle version.
          </p>
        </div>

        {/* Loyalty Program */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary-400" />
            Programme de Fidelite
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Niveau de fidelite
              </label>
              <select
                value={loyaltyTier}
                onChange={(e) => setLoyaltyTier(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Argent</option>
                <option value="gold">Or</option>
                <option value="platinum">Platine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Points actuels
              </label>
              <input
                type="number"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Inscription Date */}
        <div className="bg-white/80 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold text-orange-400">Date d'inscription</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Modifier la date d'inscription du client si necessaire.
            </p>
            <input
              type="datetime-local"
              value={inscriptionDate}
              onChange={(e) => setInscriptionDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href={`/admin/customers/${params.id}`}
            className="px-6 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
