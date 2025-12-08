'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, Check, X, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useConfetti } from '@/hooks/useConfetti'
import { AdminMessageModal, AdminMessageType } from '@/components/admin/admin-message-modal'

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  verified: boolean
  published: boolean
  adminReply: string | null
  repliedAt: Date | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string
  }
  product: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

interface ReviewStats {
  total: number
  published: number
  pending: number
  averageRating: number
  byRating: Record<number, number>
}

export default function ReviewsManagementPage() {
  const { reward, mini } = useConfetti()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [filter, setFilter] = useState('all') // all, published, pending
  const [ratingFilter, setRatingFilter] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: AdminMessageType
    title: string
    message: string
    secondaryMessage?: string
    onConfirm?: () => void
    confirmLabel?: string
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  useEffect(() => {
    fetchReviews()
  }, [filter, ratingFilter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (ratingFilter) params.append('rating', ratingFilter)

      const response = await fetch(`/api/admin/reviews?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId: string) => {
    // Find the review to get its rating
    const reviewToApprove = reviews.find(r => r.id === reviewId)

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Avis approuvé')
        // Celebrate good reviews! ⭐
        if (reviewToApprove && reviewToApprove.rating >= 4) {
          reward({ duration: 1500 }) // Stars for great reviews!
        } else {
          mini() // Small confetti for other reviews
        }
        fetchReviews()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: false }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Avis rejeté')
        fetchReviews()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors du rejet')
    }
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('Veuillez entrer une réponse')
      return
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Réponse ajoutée')
        setReplyingTo(null)
        setReplyText('')
        fetchReviews()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la réponse')
    }
  }

  const confirmDelete = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId)
    setModal({
      isOpen: true,
      type: 'delete',
      title: 'Supprimer cet avis ?',
      message: review ? `L'avis de ${review.user.name || review.user.phone} sur "${review.product.name}" sera supprimé définitivement.` : 'Cet avis sera supprimé définitivement.',
      confirmLabel: 'Supprimer',
      onConfirm: () => handleDelete(reviewId),
    })
  }

  const handleDelete = async (reviewId: string) => {
    setModal(prev => ({ ...prev, isOpen: false }))
    setProcessing(true)

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Avis supprimé')
        fetchReviews()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setProcessing(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Avis</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Modération et réponses aux avis clients</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Publiés</p>
            <p className="text-2xl font-bold text-green-500">{stats.published}</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <p className="text-gray-500 dark:text-gray-400 text-sm">En attente</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>

          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Note moyenne</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating.toFixed(1)}
              </p>
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
        >
          <option value="all">Tous les avis</option>
          <option value="published">Publiés</option>
          <option value="pending">En attente</option>
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
        >
          <option value="">Toutes les notes</option>
          <option value="5">5 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="2">2 étoiles</option>
          <option value="1">1 étoile</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun avis trouvé</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/5 dark:shadow-black/20"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  {review.product.images[0] && (
                    <img
                      src={review.product.images[0]}
                      alt={review.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <Link
                      href={`/products/${review.product.slug}`}
                      className="text-gray-900 dark:text-white hover:text-primary-500 font-medium"
                    >
                      {review.product.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      {renderStars(review.rating)}
                      {review.verified && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                          Achat vérifié
                        </span>
                      )}
                      {review.published ? (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <Eye className="h-3 w-3" />
                          Publié
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-500">
                          <EyeOff className="h-3 w-3" />
                          En attente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Par {review.user.name || review.user.phone} •{' '}
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!review.published && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                      title="Approuver"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {review.published && (
                    <button
                      onClick={() => handleReject(review.id)}
                      className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20"
                      title="Rejeter"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => confirmDelete(review.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Review Content */}
              {review.title && (
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">{review.title}</h3>
              )}
              {review.comment && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">{review.comment}</p>
              )}

              {/* Admin Reply */}
              {review.adminReply && (
                <div className="bg-gray-100 dark:bg-dark-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium text-primary-500">
                      Réponse de l'équipe
                    </span>
                    {review.repliedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(review.repliedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{review.adminReply}</p>
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === review.id ? (
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-100 dark:bg-dark-800/50 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-transparent"
                    placeholder="Votre réponse..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(review.id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Envoyer la réponse
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText('')
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-700"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setReplyingTo(review.id)
                    setReplyText(review.adminReply || '')
                  }}
                  className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
                >
                  <MessageSquare className="h-4 w-4" />
                  {review.adminReply ? 'Modifier la réponse' : 'Répondre à cet avis'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AdminMessageModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        secondaryMessage={modal.secondaryMessage}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        isProcessing={processing}
      />
    </div>
  )
}
