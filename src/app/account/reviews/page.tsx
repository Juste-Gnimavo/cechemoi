'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Star, MessageSquare, Filter, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  verified: boolean
  status: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    price: number
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/reviews')
      return
    }

    if (!session) return

    fetchReviews()
  }, [session, router, status, page, statusFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/account/reviews?page=${page}&status=${statusFilter}`
      )
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      APPROVED: 'bg-green-500/20 text-green-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      REJECTED: 'bg-red-500/20 text-red-400',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      APPROVED: 'Approuvé',
      PENDING: 'En attente',
      REJECTED: 'Rejeté',
    }
    return labels[status] || status
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    )
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Avis</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Gérez vos avis et notes sur les produits
              </p>
            </div>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          {/* Filter */}
          <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700 focus:outline-none focus:border-primary-500"
              >
                <option value="all">Tous les avis</option>
                <option value="APPROVED">Approuvés</option>
                <option value="PENDING">En attente</option>
                <option value="REJECTED">Rejetés</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <MessageSquare className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun avis trouvé</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                Achetez des produits et partagez votre expérience
              </p>
              <Link
                href="/"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg"
              >
                Découvrir nos produits
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 transition-all duration-200"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <Link
                      href={`/produit/${review.product.slug}`}
                      className="relative w-24 h-24 bg-gray-100 dark:bg-dark-800 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      {review.product.images[0] ? (
                        <Image
                          src={review.product.images[0]}
                          alt={review.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Star className="h-8 w-8 text-gray-400 dark:text-gray-700" />
                        </div>
                      )}
                    </Link>

                    {/* Review Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/produit/${review.product.slug}`}
                            className="text-gray-900 dark:text-white font-semibold hover:text-primary-400 transition-all duration-200"
                          >
                            {review.product.name}
                          </Link>
                          <div className="flex items-center gap-3 mt-2">
                            {renderStars(review.rating)}
                            {review.verified && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Achat vérifié
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getStatusColor(review.status)}`}>
                          {getStatusIcon(review.status)}
                          {getStatusLabel(review.status)}
                        </span>
                      </div>

                      {review.title && (
                        <h4 className="text-gray-900 dark:text-white font-medium mb-2">{review.title}</h4>
                      )}

                      {review.comment && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{review.comment}</p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-800">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>

                        {review.status === 'APPROVED' && (
                          <Link
                            href={`/produit/${review.product.slug}#reviews`}
                            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm transition-all duration-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Voir sur le produit
                          </Link>
                        )}

                        {review.status === 'PENDING' && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            En attente de modération
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20"
              >
                Précédent
              </button>
              <span className="text-gray-900 dark:text-white px-4 py-2">
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg disabled:opacity-50 border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
