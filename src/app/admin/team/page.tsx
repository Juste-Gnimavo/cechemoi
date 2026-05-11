'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Edit, Power, PowerOff, Eye, EyeOff, Shield, Mail, Phone, X, Save, ExternalLink, CircleSlash } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string | null
  email: string | null
  phone: string
  role: string
  createdAt: Date
  lastLogin: Date | null
  isActive: boolean
  deactivatedAt: Date | null
}

interface TeamStats {
  total: number
  admins: number
  managers: number
  staff: number
  disabled: number
}

export default function TeamManagementPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showDisabled, setShowDisabled] = useState(false)
  const [deactivating, setDeactivating] = useState<TeamMember | null>(null)
  const [deactivationReason, setDeactivationReason] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF' as 'ADMIN' | 'MANAGER' | 'STAFF',
  })

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/team')
      const data = await response.json()

      if (data.success) {
        setMembers(data.members)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone,
        password: '',
        role: member.role as 'ADMIN' | 'MANAGER' | 'STAFF',
      })
    } else {
      setEditingMember(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMember(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'STAFF',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!editingMember && !formData.password) {
      toast.error('Le mot de passe est requis pour un nouvel utilisateur')
      return
    }

    if (formData.password && formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    try {
      const url = editingMember
        ? `/api/admin/team/${editingMember.id}`
        : '/api/admin/team'

      const method = editingMember ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingMember ? 'Membre mis à jour' : 'Membre ajouté')
        handleCloseModal()
        fetchTeamMembers()
      } else {
        toast.error(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleReactivate = async (member: TeamMember) => {
    if (!confirm(`Réactiver ${member.name || 'ce membre'} ?`)) return

    try {
      const response = await fetch(`/api/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Membre réactivé')
        fetchTeamMembers()
      } else {
        toast.error(data.error || 'Erreur lors de la réactivation')
      }
    } catch (error) {
      toast.error('Erreur lors de la réactivation')
    }
  }

  const openDeactivateModal = (member: TeamMember) => {
    setDeactivating(member)
    setDeactivationReason('')
  }

  const confirmDeactivate = async () => {
    if (!deactivating) return

    try {
      const response = await fetch(`/api/admin/team/${deactivating.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false, reason: deactivationReason }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Membre désactivé')
        setDeactivating(null)
        setDeactivationReason('')
        fetchTeamMembers()
      } else {
        toast.error(data.error || 'Erreur lors de la désactivation')
      }
    } catch (error) {
      toast.error('Erreur lors de la désactivation')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800'
      case 'STAFF':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur'
      case 'MANAGER':
        return 'Manager'
      case 'STAFF':
        return 'Personnel'
      default:
        return role
    }
  }

  const currentUserRole = (session?.user as any)?.role

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Gestion de l'Équipe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérer les utilisateurs administrateurs, managers et personnel
          </p>
        </div>
        {currentUserRole === 'ADMIN' && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un Membre
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-transparent">
            <p className="text-sm text-gray-500 dark:text-gray-400">Membres Actifs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-transparent">
            <p className="text-sm text-gray-500 dark:text-gray-400">Administrateurs</p>
            <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-transparent">
            <p className="text-sm text-gray-500 dark:text-gray-400">Managers</p>
            <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-transparent">
            <p className="text-sm text-gray-500 dark:text-gray-400">Personnel</p>
            <p className="text-2xl font-bold text-green-600">{stats.staff}</p>
          </div>
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-200 dark:border-transparent">
            <p className="text-sm text-gray-500 dark:text-gray-400">Désactivés</p>
            <p className="text-2xl font-bold text-gray-500">{stats.disabled}</p>
          </div>
        </div>
      )}

      {/* Filter: show disabled members */}
      <div className="mb-4 flex items-center justify-end">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.target.checked)}
            className="rounded border-gray-300"
          />
          Afficher les membres désactivés
        </label>
      </div>

      {/* Team Members Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-white/80 dark:bg-dark-900/50 rounded-lg shadow border border-gray-200 dark:border-transparent">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun membre de l'équipe</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow overflow-hidden border border-gray-200 dark:border-transparent">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière Connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-dark-700">
                {members.filter((m) => showDisabled || m.isActive).map((member) => (
                  <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-dark-800/50 ${!member.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name || 'Sans nom'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300 flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {member.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300 flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {member.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          <CircleSlash className="h-3 w-3" />
                          Désactivé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.lastLogin
                        ? new Date(member.lastLogin).toLocaleDateString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/team/${member.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Voir le profil"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        {currentUserRole === 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleOpenModal(member)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {member.isActive ? (
                              <button
                                onClick={() => openDeactivateModal(member)}
                                className="text-red-600 hover:text-red-900"
                                title="Désactiver"
                              >
                                <PowerOff className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(member)}
                                className="text-emerald-600 hover:text-emerald-900"
                                title="Réactiver"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {deactivating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
          <div className="bg-white dark:bg-dark-900 backdrop-blur-sm rounded-lg max-w-md w-full border border-gray-200 dark:border-dark-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PowerOff className="h-5 w-5 text-red-600" />
                  Désactiver le membre
                </h2>
                <button
                  onClick={() => { setDeactivating(null); setDeactivationReason('') }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Vous allez désactiver <strong>{deactivating.name || 'ce membre'}</strong>.
                  Son accès sera révoqué immédiatement, mais ses données (commandes, clients, factures…) restent intactes pour préserver l'historique d'audit. Vous pouvez le réactiver à tout moment.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motif (optionnel)
                  </label>
                  <textarea
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    rows={3}
                    placeholder="Ex: Départ, suspension, fin de contrat..."
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-200 dark:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setDeactivating(null); setDeactivationReason('') }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-dark-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeactivate}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <PowerOff className="h-4 w-4" />
                    Désactiver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
          <div className="bg-white dark:bg-dark-900 backdrop-blur-sm rounded-lg max-w-md w-full border border-gray-200 dark:border-dark-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingMember ? 'Modifier le Membre' : 'Ajouter un Membre'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom Complet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+225xxxxxxxxxx"
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mot de Passe {editingMember ? '(laisser vide pour ne pas changer)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                      required={!editingMember}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rôle *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF' })
                    }
                    className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200 dark:border-transparent"
                  >
                    <option value="STAFF">Personnel</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-dark-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingMember ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
