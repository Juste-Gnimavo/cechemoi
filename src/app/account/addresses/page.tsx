'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { MapPin, Plus, Edit2, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { GeolocationCapture } from '@/components/geolocation-capture'

interface Address {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  country: string
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  geoAccuracy: number | null
  isDefault: boolean
  createdAt: string
}

export default function AddressesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: 'Côte d\'Ivoire',
    postalCode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    geoAccuracy: null as number | null,
    isDefault: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/addresses')
      return
    }

    if (!session) return

    fetchAddresses()
  }, [session, router, status])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast.error('Erreur lors du chargement des adresses')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      country: 'Côte d\'Ivoire',
      postalCode: '',
      latitude: null,
      longitude: null,
      geoAccuracy: null,
      isDefault: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      country: address.country,
      postalCode: address.postalCode || '',
      latitude: address.latitude,
      longitude: address.longitude,
      geoAccuracy: address.geoAccuracy,
      isDefault: address.isDefault,
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const handleLocationCaptured = (geoData: { latitude: number; longitude: number; accuracy: number }) => {
    setFormData({
      ...formData,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      geoAccuracy: geoData.accuracy,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.city || !formData.country) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      const url = editingId
        ? `/api/account/addresses/${editingId}`
        : '/api/account/addresses'

      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(editingId ? 'Adresse mise à jour' : 'Adresse ajoutée')
        resetForm()
        await fetchAddresses()
      } else {
        toast.error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      return
    }

    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Adresse supprimée')
        await fetchAddresses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Erreur serveur')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (res.ok) {
        toast.success('Adresse définie par défaut')
        await fetchAddresses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('Erreur serveur')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Adresses</h1>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          {/* Add Address Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-3 rounded-lg transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Ajouter une adresse
            </button>
          )}

          {/* Address Form */}
          {showForm && (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                      placeholder="Prénom et nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Adresse ligne 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    required
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                    placeholder="Numéro et nom de rue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Adresse ligne 2
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                    placeholder="Appartement, suite, etc. (optionnel)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                      placeholder="Abidjan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Pays *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                      className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                    >
                      <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                      <option value="Sénégal">Sénégal</option>
                      <option value="Mali">Mali</option>
                      <option value="Burkina Faso">Burkina Faso</option>
                      <option value="Bénin">Bénin</option>
                      <option value="Togo">Togo</option>
                      <option value="Niger">Niger</option>
                      <option value="Guinée">Guinée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>

                {/* Geolocation Capture */}
                <GeolocationCapture
                  onLocationCaptured={handleLocationCaptured}
                  currentLocation={
                    formData.latitude && formData.longitude
                      ? {
                          latitude: formData.latitude,
                          longitude: formData.longitude,
                          accuracy: formData.geoAccuracy || 0,
                        }
                      : null
                  }
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-primary-500 bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isDefault" className="text-gray-600 dark:text-gray-400">
                    Définir comme adresse par défaut
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 rounded-lg border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-all duration-200"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses List */}
          {addresses.length === 0 && !showForm ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune adresse enregistrée</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg"
              >
                <Plus className="h-5 w-5" />
                Ajouter votre première adresse
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 transition-colors relative"
                >
                  {address.isDefault && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        Par défaut
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">{address.fullName}</h3>
                    <div className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                      <p>{address.phone}</p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}
                        {address.postalCode && `, ${address.postalCode}`}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-dark-800">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1 rounded border border-primary-500/30 hover:bg-primary-500/10 transition-all duration-200"
                      >
                        Définir par défaut
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-800 transition-all duration-200"
                    >
                      <Edit2 className="h-3 w-3" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
