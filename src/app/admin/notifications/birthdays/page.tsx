'use client'

import { useState, useEffect } from 'react'
import { Cake, CheckCircle, XCircle, Loader2, Users, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface UpcomingBirthday {
  id: string
  name: string | null
  phone: string | null
  dateOfBirth: string
  image: string | null
  daysUntil: number
  nextBirthday: string
  age: number
  greetingStatus: string | null
}

interface HistoryLog {
  id: string
  userId: string
  year: number
  sentAt: string
  status: string
  channels: string[]
  user: {
    id: string
    name: string | null
    phone: string | null
    dateOfBirth: string | null
  } | null
}

interface Stats {
  totalWithBirthday: number
  sentThisYear: number
  failedThisYear: number
}

export default function BirthdaysPage() {
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [upcoming, setUpcoming] = useState<UpcomingBirthday[]>([])
  const [history, setHistory] = useState<HistoryLog[]>([])
  const [stats, setStats] = useState<Stats>({ totalWithBirthday: 0, sentThisYear: 0, failedThisYear: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [tab, page, year])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        tab,
        year: String(year),
        page: String(page),
      })
      const response = await fetch(`/api/admin/notifications/birthdays?${params}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        if (tab === 'upcoming') {
          setUpcoming(data.data)
        } else {
          setHistory(data.data)
          setTotalPages(data.pagination?.totalPages || 1)
        }
      }
    } catch (error) {
      console.error('Error fetching birthday data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Supprimer ce log ? Le voeu pourra être renvoyé au prochain passage du cron.')) return

    try {
      const response = await fetch(`/api/admin/notifications/birthdays?logId=${logId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Log supprimé')
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cake className="h-6 w-6 text-pink-500" />
            Anniversaires
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Voeux d&apos;anniversaire automatiques envoyés à vos clients
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="text-primary-500 hover:text-primary-400 text-sm"
        >
          Retour aux notifications
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Clients avec date de naissance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWithBirthday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Envoyés en {year}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sentThisYear}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Échecs en {year}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failedThisYear}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700/50">
        <button
          onClick={() => { setTab('upcoming'); setPage(1) }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-pink-500 text-pink-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1" />
          Prochains anniversaires
        </button>
        <button
          onClick={() => { setTab('history'); setPage(1) }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'history'
              ? 'border-pink-500 text-pink-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <CheckCircle className="h-4 w-4 inline mr-1" />
          Historique des envois
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin h-12 w-12 text-pink-500 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : tab === 'upcoming' ? (
        /* Upcoming Birthdays */
        <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50">
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Cake className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                Aucun anniversaire dans les 30 prochains jours
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800/50">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Âge</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dans</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700/50">
                  {upcoming.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 font-medium text-sm">
                            {customer.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{customer.name || 'Sans nom'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(customer.dateOfBirth)}
                      </td>
                      <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                        {customer.age} ans
                      </td>
                      <td className="p-4">
                        {customer.daysUntil === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                            Aujourd&apos;hui !
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {customer.daysUntil} jour{customer.daysUntil > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {customer.greetingStatus === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-3 w-3" /> Envoyé
                          </span>
                        ) : customer.greetingStatus === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            <XCircle className="h-3 w-3" /> Échoué
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            En attente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* History */
        <div className="space-y-4">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">Année :</label>
            <select
              value={year}
              onChange={(e) => { setYear(parseInt(e.target.value)); setPage(1) }}
              className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700/50">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Cake className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-gray-500 dark:text-gray-400 mt-4">
                  Aucun envoi pour {year}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800/50">
                    <tr>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Envoyé le</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Canaux</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700/50">
                    {history.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 font-medium text-sm">
                              {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{log.user?.name || 'Utilisateur supprimé'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{log.user?.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatDateTime(log.sentAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {log.channels.map((ch) => (
                              <span
                                key={ch}
                                className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              >
                                {ch}
                              </span>
                            ))}
                            {log.channels.length === 0 && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {log.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              <CheckCircle className="h-3 w-3" /> Envoyé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              <XCircle className="h-3 w-3" /> Échoué
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Supprimer pour permettre le renvoi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800/30 rounded-lg p-4">
        <div className="flex gap-3">
          <Cake className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-pink-800 dark:text-pink-200">
            <p className="font-medium mb-1">Comment ça fonctionne ?</p>
            <ul className="list-disc list-inside space-y-1 text-pink-700 dark:text-pink-300">
              <li>Chaque jour à 8h, le système vérifie les anniversaires du jour</li>
              <li>Un SMS et un WhatsApp sont envoyés automatiquement</li>
              <li>Les clients nés le 29 février reçoivent leurs voeux le 28 février les années non bissextiles</li>
              <li>Un seul envoi par client par an (pas de doublons)</li>
              <li>Supprimez un log d&apos;envoi échoué pour relancer l&apos;envoi au prochain passage du cron</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
