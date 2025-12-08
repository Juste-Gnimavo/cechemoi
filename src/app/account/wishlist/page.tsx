'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer-header'
import { Footer } from '@/components/footer'
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ProductImage } from '@/components/ui/product-image'

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    images: string[]
    stock: number
    isActive: boolean
    category: {
      id: string
      name: string
      slug: string
    } | null
  }
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removingIds, setRemovingIds] = useState<string[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-phone?callbackUrl=/account/wishlist')
      return
    }

    if (!session) return

    fetchWishlist()
  }, [session, router, status])

  const fetchWishlist = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wishlist')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Erreur lors du chargement de la wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId: string) => {
    setRemovingIds([...removingIds, productId])
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setItems(items.filter((item) => item.productId !== productId))
        toast.success('Retiré de la wishlist')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Erreur serveur')
    } finally {
      setRemovingIds(removingIds.filter((id) => id !== productId))
    }
  }

  const handleAddToCart = (productId: string, productName: string) => {
    // In a real app, this would add to cart
    // For now, just show a toast
    toast.success(`${productName} ajouté au panier`, {
      icon: '🛒',
    })
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ma Wishlist</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {items.length} {items.length === 1 ? 'article' : 'articles'}
              </p>
            </div>
            <Link
              href="/account"
              className="text-primary-400 hover:text-primary-300"
            >
              ← Retour
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20">
              <Heart className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Votre wishlist est vide</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                Ajoutez vos vins préférés pour les retrouver facilement
              </p>
              <Link
                href="/"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-6 py-2 rounded-lg"
              >
                Découvrir nos vins
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:border-primary-500/30 transition-colors group"
                >
                  {/* Product Image */}
                  <Link href={`/produit/${item.product.slug}`} className="block relative aspect-square overflow-hidden">
                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                      <ProductImage
                        src={item.product.images[0] || '/placeholder.png'}
                        alt={item.product.name}
                        fill
                      />
                    </div>

                    {/* Stock Badge */}
                    {item.product.stock === 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-red-500/90 text-white text-xs rounded">
                          Rupture de stock
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    {item.product.category && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-gray-900/90 dark:bg-dark-900/90 text-white dark:text-gray-300 text-xs rounded">
                          {item.product.category.name}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link href={`/produit/${item.product.slug}`}>
                      <h3 className="text-gray-900 dark:text-white font-semibold mb-2 hover:text-primary-400 transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>

                    {item.product.description && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {item.product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-primary-400 font-bold text-lg">
                        {item.product.price.toLocaleString()} CFA
                      </span>
                      {item.product.stock > 0 && (
                        <span className="text-green-400 text-sm">
                          En stock ({item.product.stock})
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.product.isActive && item.product.stock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(item.product.id, item.product.name)}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Ajouter au panier
                        </button>
                      ) : (
                        <Link
                          href={`/produit/${item.product.slug}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Voir le produit
                        </Link>
                      )}

                      <button
                        onClick={() => handleRemove(item.product.id)}
                        disabled={removingIds.includes(item.product.id)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Retirer de la wishlist"
                      >
                        {removingIds.includes(item.product.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Added Date */}
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">
                      Ajouté le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </p>
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
