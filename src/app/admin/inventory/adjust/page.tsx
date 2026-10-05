'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Boxes,
  Search,
  History,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Undo2,
  PackageX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Mise à jour du stock d'une tenue de la boutique.
//
// Seul écran qui appelle `POST /api/admin/inventory/adjust` : chaque saisie
// produit un StockMovement (qui, quand, combien, pourquoi). Modifier le champ
// « stock » depuis la fiche produit change la quantité SANS mouvement — c'est
// pourquoi le Personnel est guidé ici depuis le hub « Boutique en ligne ».

interface ProductLite {
  id: string
  name: string
  sku: string
  stock: number
  images: string[]
  published?: boolean
  lowStockThreshold?: number
}

type MovementType = 'purchase' | 'return' | 'damaged' | 'adjustment'

const MOVEMENT_TYPES: {
  value: MovementType
  label: string
  hint: string
  icon: typeof ArrowDownCircle
  direction: 'in' | 'out' | 'both'
}[] = [
  {
    value: 'purchase',
    label: 'Arrivage',
    hint: 'Nouvelles pièces reçues : le stock augmente',
    icon: ArrowDownCircle,
    direction: 'in',
  },
  {
    value: 'return',
    label: 'Retour cliente',
    hint: 'Pièce rendue en bon état : elle revient en stock',
    icon: Undo2,
    direction: 'in',
  },
  {
    value: 'damaged',
    label: 'Pièce abîmée',
    hint: 'Tache, défaut, invendable : le stock diminue',
    icon: PackageX,
    direction: 'out',
  },
  {
    value: 'adjustment',
    label: 'Correction',
    hint: 'Le comptage réel ne correspond pas au site',
    icon: SlidersHorizontal,
    direction: 'both',
  },
]

function StockAdjustForm() {
  const searchParams = useSearchParams()
  const initialProductId = searchParams.get('productId')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductLite[]>([])
  const [searching, setSearching] = useState(false)
  const [product, setProduct] = useState<ProductLite | null>(null)
  const [loadingInitial, setLoadingInitial] = useState(Boolean(initialProductId))

  const [type, setType] = useState<MovementType>('purchase')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedType = MOVEMENT_TYPES.find((t) => t.value === type)!
  const effectiveDirection: 'in' | 'out' =
    selectedType.direction === 'both' ? direction : selectedType.direction
  const qty = parseInt(quantity) || 0
  const signedQty = effectiveDirection === 'in' ? qty : -qty
  const projectedStock = product ? Math.max(0, product.stock + signedQty) : null
  const wouldClamp = product !== null && qty > 0 && product.stock + signedQty < 0
  const reasonRequired = type === 'adjustment' || type === 'damaged'

  // Préremplissage depuis ?productId= (liens depuis la liste ou l'inventaire)
  useEffect(() => {
    if (!initialProductId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/products/${initialProductId}`)
        const data = await res.json()
        if (!cancelled && data.success && data.product) {
          setProduct(toLite(data.product))
        }
      } catch (error) {
        console.error('Error loading product:', error)
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialProductId])

  // Recherche par nom ou SKU, brouillons compris (une tenue non publiée a
  // aussi un stock à tenir à jour)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({
          search: q,
          limit: '12',
          sortBy: 'name',
          sortOrder: 'asc',
        })
        const res = await fetch(`/api/admin/products?${params}`)
        const data = await res.json()
        if (data.success) setResults((data.products as ProductLite[]).map(toLite))
      } catch (error) {
        console.error('Error searching products:', error)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  const selectProduct = useCallback((p: ProductLite) => {
    setProduct(p)
    setResults([])
    setQuery('')
  }, [])

  const resetForm = () => {
    setQuantity('')
    setReason('')
    setReference('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) {
      toast.error('Choisissez une tenue')
      return
    }
    if (qty <= 0) {
      toast.error('La quantité doit être un nombre entier positif')
      return
    }
    if (reasonRequired && !reason.trim()) {
      toast.error('Indiquez le motif : il restera dans l’historique')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity: signedQty,
          reason: reason.trim() || null,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Stock mis à jour')
        setProduct({ ...product, stock: data.product?.stock ?? projectedStock ?? product.stock })
        resetForm()
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour du stock')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inventory"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Boxes className="h-6 w-6 text-primary-500" />
              Mettre à jour le stock
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Arrivage, retour, pièce abîmée ou correction d’une tenue de la boutique
            </p>
          </div>
        </div>
        <Link
          href="/admin/inventory/movements"
          className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
        >
          <History className="h-4 w-4" />
          Historique
        </Link>
      </div>

      {/* Avertissement */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Chaque saisie reste dans l’historique
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Un mouvement ne se modifie pas après validation. En cas d’erreur,
            enregistrez une « Correction » dans l’autre sens avec le motif : le
            stock est rectifié sans effacer la trace.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-6">
          {/* Tenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Tenue <span className="text-red-500">*</span>
            </label>

            {product ? (
              <div className="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <Thumb product={product} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.sku}
                    {product.published === false && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-200 dark:bg-dark-700 text-xs">
                        Brouillon
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Stock actuel</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{product.stock}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProduct(null)}
                  className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 text-gray-500"
                  title="Changer de tenue"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className={`${inputClass} pl-9`}
                    placeholder="Nom de la tenue ou référence (SKU)…"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                {results.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full max-h-80 overflow-auto bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg divide-y divide-gray-100 dark:divide-dark-800">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => selectProduct(p)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-800"
                        >
                          <Thumb product={p} size="sm" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                              {p.name}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {p.sku}
                              {p.published === false ? ' · brouillon' : ''}
                            </span>
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              p.stock === 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {query.trim().length >= 2 && !searching && results.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Aucune tenue trouvée.{' '}
                    <Link href="/admin/products/new" className="text-primary-600 hover:underline">
                      Ajouter une tenue
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Type de mouvement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Que s’est-il passé ? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOVEMENT_TYPES.map((t) => {
                const Icon = t.icon
                const active = t.value === type
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 shrink-0 ${
                        t.direction === 'in'
                          ? 'text-green-500'
                          : t.direction === 'out'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                      }`}
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {t.label}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{t.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sens (correction uniquement) */}
          {selectedType.direction === 'both' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Sens de la correction
              </label>
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDirection('in')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm ${
                    direction === 'in'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('out')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm ${
                    direction === 'out'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Retirer
                </button>
              </div>
            </div>
          )}

          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Nombre de pièces <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              required
              min="1"
              step="1"
              className={inputClass}
              placeholder="Ex : 3"
            />
            {product && qty > 0 && (
              <p
                className={`text-sm mt-1 ${
                  wouldClamp ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Nouveau stock : {product.stock} {effectiveDirection === 'in' ? '+' : '−'} {qty} ={' '}
                <span className="font-semibold">{projectedStock}</span>
                {wouldClamp && ' — le stock ne peut pas être négatif, vérifiez la quantité'}
              </p>
            )}
          </div>

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Motif {reasonRequired ? <span className="text-red-500">*</span> : '(optionnel)'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={reasonRequired}
              className={inputClass}
              placeholder={
                type === 'damaged'
                  ? 'Ex : tache sur la manche, fermeture cassée'
                  : type === 'adjustment'
                    ? 'Ex : comptage du 5 octobre, 2 pièces en trop'
                    : 'Ex : livraison du fournisseur, retour commande CMD-…'
              }
            />
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Référence (optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="N° de commande, bon de livraison…"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Détails utiles pour la direction"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/inventory"
            className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving || !product || qty <= 0 || wouldClamp}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
              effectiveDirection === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
            Enregistrer le mouvement
          </button>
        </div>
      </form>
    </div>
  )
}

function toLite(p: ProductLite): ProductLite {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    images: Array.isArray(p.images) ? p.images : [],
    published: p.published,
    lowStockThreshold: p.lowStockThreshold,
  }
}

function Thumb({ product, size }: { product: ProductLite; size: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'
  return product.images[0] ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={product.images[0]} alt="" className={`${cls} rounded-lg object-cover shrink-0`} />
  ) : (
    <div
      className={`${cls} rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center shrink-0`}
    >
      <Boxes className="h-5 w-5 text-gray-400" />
    </div>
  )
}

export default function StockAdjustPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      }
    >
      <StockAdjustForm />
    </Suspense>
  )
}
