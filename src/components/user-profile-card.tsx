'use client'

import { useState, useRef } from 'react'
import {
  Camera,
  MapPin,
  Clock,
  Globe,
  Monitor,
  Loader2,
  User,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  Wifi,
  Fingerprint,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UserProfileCardProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string
    whatsappNumber?: string | null
    image?: string | null
    role?: string
    country?: string | null
    countryCode?: string | null
    city?: string | null
    ipAddress?: string | null // Registration IP
    lastLoginAt?: string | null
    lastLoginIp?: string | null
    lastLoginBrowser?: string | null
    twoFactorEnabled?: boolean
    phoneVerified?: boolean
    emailVerified?: string | null // Date string if verified
    createdAt?: string
    updatedAt?: string
  }
  variant?: 'horizontal' | 'vertical' | 'full'
  onImageUpdate?: (newImageUrl: string) => void
  showLoginInfo?: boolean
  editable?: boolean // Allow image upload
}

export function UserProfileCard({
  user,
  variant = 'horizontal',
  onImageUpdate,
  showLoginInfo = true,
  editable = true
}: UserProfileCardProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(user.image || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file - allow common image formats for profile photos
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/tiff']
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, GIF, WEBP, SVG ou TIFF')
      return
    }

    setUploading(true)
    try {
      // Upload image
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'avatars')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      // Determine which API to use based on user role
      const isAdminRole = user.role && ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes(user.role)
      const profileApiUrl = isAdminRole ? '/api/admin/profile' : '/api/account/profile'

      // Update user profile
      const updateRes = await fetch(profileApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadData.url }),
      })

      const updateData = await updateRes.json()

      // Handle both response formats: { success, user } or { user }
      if (updateData.success || updateData.user) {
        setImageUrl(uploadData.url)
        onImageUpdate?.(uploadData.url)
        toast.success('Photo de profil mise à jour')
      } else {
        throw new Error(updateData.error || 'Update failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBrowserName = (userAgent: string | null | undefined) => {
    if (!userAgent) return 'Inconnu'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Autre'
  }

  const getCountryFlag = (countryCode: string | null | undefined) => {
    if (!countryCode) return null
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    CUSTOMER: 'Client'
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
    MANAGER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    STAFF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    CUSTOMER: 'bg-green-500/20 text-green-400 border-green-500/30'
  }

  // Full variant - detailed user info card
  if (variant === 'full') {
    return (
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-dark-700">
          <User className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations complètes du compte</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profil</h4>

            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div
                  onClick={editable ? handleImageClick : undefined}
                  className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center overflow-hidden group ${editable ? 'cursor-pointer hover:border-primary-500' : ''} transition-all`}
                >
                  {uploading ? (
                    <Loader2 className="h-7 w-7 text-primary-500 animate-spin" />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary-400" />
                  )}
                  {editable && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                {editable && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || 'Utilisateur'}</h3>
                {user.role && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${roleColors[user.role] || roleColors.CUSTOMER}`}>
                    <Shield className="h-3 w-3" />
                    {roleLabels[user.role] || user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</h4>
            <div className="space-y-3">
              {user.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                    <Phone className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">{user.phone}</p>
                    <p className="text-xs text-gray-500">Téléphone principal</p>
                  </div>
                  {user.phoneVerified !== undefined && (
                    user.phoneVerified ? (
                      <span title="Vérifié"><CheckCircle className="h-4 w-4 text-green-500 ml-auto" /></span>
                    ) : (
                      <span title="Non vérifié"><XCircle className="h-4 w-4 text-red-500 ml-auto" /></span>
                    )
                  )}
                </div>
              )}

              {user.whatsappNumber && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
                    <MessageCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">{user.whatsappNumber}</p>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                  </div>
                </div>
              )}

              {user.email && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
                    <Mail className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm truncate max-w-[200px]">{user.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                  {user.emailVerified !== undefined && (
                    user.emailVerified ? (
                      <span title="Vérifié"><CheckCircle className="h-4 w-4 text-green-500 ml-auto" /></span>
                    ) : (
                      <span title="Non vérifié"><XCircle className="h-4 w-4 text-red-500 ml-auto" /></span>
                    )
                  )}
                </div>
              )}

              {(user.country || user.city) && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                    <MapPin className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">
                      {getCountryFlag(user.countryCode)} {user.city}{user.city && user.country && ', '}{user.country}
                    </p>
                    <p className="text-xs text-gray-500">Localisation</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sécurité</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${user.twoFactorEnabled ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                  <Fingerprint className={`h-4 w-4 ${user.twoFactorEnabled ? 'text-green-500 dark:text-green-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`text-sm ${user.twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {user.twoFactorEnabled ? 'Activée' : 'Désactivée'}
                  </p>
                  <p className="text-xs text-gray-500">Authentification 2FA</p>
                </div>
                {user.twoFactorEnabled ? (
                  <ShieldCheck className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <ShieldX className="h-4 w-4 text-gray-500 ml-auto" />
                )}
              </div>

              {user.ipAddress && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10">
                    <Wifi className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm font-mono">{user.ipAddress}</p>
                    <p className="text-xs text-gray-500">IP d&apos;inscription</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login Info Section */}
        {showLoginInfo && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Dernière connexion</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-800/50 rounded-lg p-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-900 dark:text-white text-sm">{formatDate(user.lastLoginAt)}</p>
                  <p className="text-xs text-gray-500">Date & heure</p>
                </div>
              </div>

              {user.lastLoginIp && (
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-800/50 rounded-lg p-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm font-mono">{user.lastLoginIp}</p>
                    <p className="text-xs text-gray-500">Adresse IP</p>
                  </div>
                </div>
              )}

              {user.lastLoginBrowser && (
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-800/50 rounded-lg p-3">
                  <Monitor className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">{getBrowserName(user.lastLoginBrowser)}</p>
                    <p className="text-xs text-gray-500">Navigateur</p>
                  </div>
                </div>
              )}

              {user.createdAt && (
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-800/50 rounded-lg p-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">{formatDate(user.createdAt)}</p>
                    <p className="text-xs text-gray-500">Date d&apos;inscription</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'vertical') {
    return (
      <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              onClick={handleImageClick}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary-500 transition-all"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              ) : imageUrl ? (
                <img src={imageUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary-400" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Name & Role */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user.name || 'Utilisateur'}</h3>
          {user.role && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || roleColors.CUSTOMER}`}>
              <Shield className="h-3 w-3 inline mr-1" />
              {roleLabels[user.role] || user.role}
            </span>
          )}

          {/* Contact Info */}
          <div className="w-full mt-4 space-y-3">
            {user.phone && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Phone className="h-4 w-4" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {(user.country || user.city) && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <MapPin className="h-4 w-4" />
                <span>
                  {getCountryFlag(user.countryCode)} {user.city}{user.city && user.country && ', '}{user.country}
                </span>
              </div>
            )}
          </div>

          {/* Login Info */}
          {showLoginInfo && (
            <div className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Dernière connexion
                </span>
                <span className="text-gray-600 dark:text-gray-400">{formatDate(user.lastLoginAt)}</span>
              </div>
              {user.lastLoginBrowser && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    Navigateur
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{getBrowserName(user.lastLoginBrowser)}</span>
                </div>
              )}
              {user.lastLoginIp && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    IP
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 font-mono">{user.lastLoginIp}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Horizontal variant (default)
  return (
    <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            onClick={handleImageClick}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary-500 transition-all"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            ) : imageUrl ? (
              <img src={imageUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-primary-400" />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.name || 'Utilisateur'}</h3>
            {user.role && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role] || roleColors.CUSTOMER}`}>
                {roleLabels[user.role] || user.role}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {user.phone}
              </span>
            )}
            {(user.country || user.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {getCountryFlag(user.countryCode)} {user.city || user.country}
              </span>
            )}
          </div>
        </div>

        {/* Login Info (compact) */}
        {showLoginInfo && user.lastLoginAt && (
          <div className="hidden lg:flex flex-col items-end text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(user.lastLoginAt)}
            </span>
            {user.lastLoginBrowser && (
              <span className="flex items-center gap-1 mt-1">
                <Monitor className="h-3 w-3" />
                {getBrowserName(user.lastLoginBrowser)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
