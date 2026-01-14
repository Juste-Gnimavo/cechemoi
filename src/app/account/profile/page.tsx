'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { User, Phone, Mail, MapPin, Calendar, Camera, Loader2, Ruler, Download } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { MeasurementsDisplay } from '@/components/measurements-display'

const DEFAULT_AVATAR = '/images/default-avatar.png'

interface ProfileData {
  id: string
  name: string
  email: string | null
  phone: string
  whatsappNumber: string | null
  image: string | null
  city: string | null
  country: string | null
  countryCode: string | null
  createdAt: string
}

interface Measurement {
  id: string
  measurementDate: string
  unit: string
  takenByStaffName?: string | null
  // All measurements are strings to allow flexible input like "87-2" or "50 - 45"
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

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Measurements state
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement | null>(null)
  const [measurementHistory, setMeasurementHistory] = useState<Measurement[]>([])
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/profile')
      return
    }

    if (!session) return

    async function fetchProfile() {
      try {
        const res = await fetch('/api/account/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(data.user)
          setName(data.user.name)
          setEmail(data.user.email || '')
          setWhatsappNumber(data.user.whatsappNumber || '')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
    fetchMeasurements()
  }, [session, router, status])

  const fetchMeasurements = async () => {
    try {
      const response = await fetch('/api/account/measurements')
      const data = await response.json()

      if (data.success) {
        setCurrentMeasurement(data.currentMeasurement)
        setMeasurementHistory(data.measurementHistory || [])
      }
    } catch (error) {
      console.error('Error fetching measurements:', error)
    }
  }

  const downloadMeasurementPdf = async (measurementId?: string) => {
    try {
      setDownloadingPdf(true)
      const url = measurementId
        ? `/api/account/measurements-pdf?measurementId=${measurementId}`
        : '/api/account/measurements-pdf'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `mes-mensurations.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          whatsappNumber: whatsappNumber.trim() || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(data.user)
        toast.success('Profil mis à jour avec succès')

        // Update session to reflect new name
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
          },
        })
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image doit faire moins de 5MB')
      return
    }

    setUploadingImage(true)
    try {
      // Upload the file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'avatars')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Erreur lors du téléchargement')
      }

      // Update user profile with new image URL
      const profileRes = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadData.url }),
      })

      const profileData = await profileRes.json()

      if (profileRes.ok) {
        setProfile(profileData.user)
        toast.success('Photo de profil mise à jour')

        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            image: profileData.user.image,
          },
        })
      } else {
        throw new Error(profileData.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement')
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <CustomerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with upload */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500/30">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.name || 'Avatar'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <User className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{profile.name || 'Utilisateur'}</h2>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {(profile.city || profile.country) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-800">
                  <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      {profile.city && <p className="text-gray-900 dark:text-white">{profile.city}</p>}
                      {profile.country && <p className="text-sm">{profile.country}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Modifier mes informations</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500 transition-all duration-200"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  {/* Phone (readonly) */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        value={profile.phone}
                        disabled
                        className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-400 dark:text-gray-500 px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Le numéro de téléphone ne peut pas être modifié
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500 transition-colors pl-11"
                        placeholder="votre@email.com"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Numéro WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="whatsapp"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500 transition-all duration-200"
                        placeholder="+225 XX XX XX XX XX"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pour recevoir les notifications de commande via WhatsApp
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Enregistrement...
                        </span>
                      ) : (
                        'Enregistrer les modifications'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(profile.name)
                        setEmail(profile.email || '')
                        setWhatsappNumber(profile.whatsappNumber || '')
                        toast.success('Modifications annulées')
                      }}
                      className="px-6 py-3 rounded-lg border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>

              {/* Measurements Section */}
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary-500" />
                    Mes Mensurations
                  </h3>
                  {currentMeasurement && (
                    <button
                      onClick={() => downloadMeasurementPdf()}
                      disabled={downloadingPdf}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingPdf ? 'Téléchargement...' : 'Télécharger PDF'}
                    </button>
                  )}
                </div>

                {currentMeasurement ? (
                  <MeasurementsDisplay
                    measurement={currentMeasurement}
                    measurementHistory={measurementHistory}
                    showHistory={true}
                    onDownloadPDF={downloadMeasurementPdf}
                    isDownloading={downloadingPdf}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucune mensuration enregistrée
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Rendez-vous en boutique pour prendre vos mensurations
                    </p>
                  </div>
                )}
              </div>

              {/* Security Section */}
              <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 mt-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sécurité</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">Authentification par téléphone</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Connexion sécurisée par code OTP</p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Votre compte est protégé par un code de vérification envoyé par SMS à chaque connexion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
