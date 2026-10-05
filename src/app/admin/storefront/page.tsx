'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@prisma/client'
import {
  Loader2,
  ArrowLeft,
  GalleryHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  Info,
  X,
  Check,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ImageUpload } from '@/components/image-upload'
import { hasPermission } from '@/lib/role-permissions'
import { DEFAULT_HERO_SLIDES } from '@/lib/hero-slides'

// Bandeau de l'accueil du site : les grandes images qui défilent en haut de
// cechemoi.com. Le Personnel ajoute, modifie, ordonne et masque ; la
// suppression définitive reste à la direction (storefront.delete).

interface Slide {
  id: string
  image: string
  alt: string
  link: string | null
  position: number
  active: boolean
}

interface SlideForm {
  image: string
  alt: string
  link: string
}

const EMPTY_FORM: SlideForm = { image: '', alt: '', link: '' }

export default function StorefrontPage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: UserRole } | undefined)?.role
  const canDelete = role ? hasPermission(role, 'storefront.delete') : false

  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState<SlideForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<SlideForm>(EMPTY_FORM)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hero-slides')
      const data = await res.json()
      if (data.success) setSlides(data.slides)
      else toast.error(data.error || 'Erreur lors du chargement')
    } catch (error) {
      console.error('Error loading slides:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const call = async (url: string, method: string, body?: unknown) => {
    setBusy(true)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Erreur')
        return false
      }
      return true
    } catch (error) {
      toast.error('Erreur réseau')
      return false
    } finally {
      setBusy(false)
    }
  }

  const validate = (form: SlideForm) => {
    if (!form.image) {
      toast.error('Ajoutez une image')
      return false
    }
    if (!form.alt.trim()) {
      toast.error('Décrivez l’image en quelques mots')
      return false
    }
    return true
  }

  const handleAdd = async () => {
    if (!validate(addForm)) return
    const ok = await call('/api/admin/hero-slides', 'POST', {
      image: addForm.image,
      alt: addForm.alt,
      link: addForm.link || null,
    })
    if (ok) {
      toast.success('Image ajoutée au bandeau')
      setAdding(false)
      setAddForm(EMPTY_FORM)
      load()
    }
  }

  const startEdit = (s: Slide) => {
    setEditingId(s.id)
    setEditForm({ image: s.image, alt: s.alt, link: s.link || '' })
  }

  const handleEdit = async () => {
    if (!editingId || !validate(editForm)) return
    const ok = await call(`/api/admin/hero-slides/${editingId}`, 'PUT', {
      image: editForm.image,
      alt: editForm.alt,
      link: editForm.link || null,
    })
    if (ok) {
      toast.success('Image modifiée')
      setEditingId(null)
      load()
    }
  }

  const toggleActive = async (s: Slide) => {
    const ok = await call(`/api/admin/hero-slides/${s.id}`, 'PUT', { active: !s.active })
    if (ok) {
      toast.success(s.active ? 'Image masquée sur le site' : 'Image affichée sur le site')
      load()
    }
  }

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= slides.length) return
    const ids = slides.map((s) => s.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    const ok = await call('/api/admin/hero-slides/reorder', 'PUT', { ids })
    if (ok) load()
  }

  const remove = async (s: Slide) => {
    if (!window.confirm(`Supprimer définitivement cette image ?\n\n${s.alt}`)) return
    const ok = await call(`/api/admin/hero-slides/${s.id}`, 'DELETE')
    if (ok) {
      toast.success('Image supprimée')
      load()
    }
  }

  const importDefaults = async () => {
    setBusy(true)
    let created = 0
    for (const d of DEFAULT_HERO_SLIDES) {
      const res = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: d.image, alt: d.alt, link: d.link }),
      })
      if (res.ok) created++
    }
    setBusy(false)
    toast.success(`${created} image${created > 1 ? 's' : ''} reprise${created > 1 ? 's' : ''}`)
    load()
  }

  const inputClass =
    'w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'

  const renderForm = (
    form: SlideForm,
    setForm: (f: SlideForm) => void,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string
  ) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Image <span className="text-red-500">*</span>
        </label>
        <ImageUpload
          value={form.image || null}
          onChange={(url) => setForm({ ...form, image: url || '' })}
          category="slides"
          maxSizeMB={8}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Format paysage, 1600 × 1066 pixels conseillé (mêmes proportions que les images
          actuelles). Le texte éventuel doit être dans l’image elle-même.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.alt}
          onChange={(e) => setForm({ ...form, alt: e.target.value })}
          className={inputClass}
          placeholder="Ex : Nouvelle collection Tabaski 2026"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Lue par Google et par les lectrices malvoyantes : dites ce que montre l’image.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Page ouverte au clic (optionnel)
        </label>
        <input
          type="text"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          className={inputClass}
          placeholder="Ex : /catalogue ou /categorie/robes"
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saveLabel}
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  const activeCount = slides.filter((s) => s.active).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GalleryHorizontal className="h-6 w-6 text-primary-500" />
              Bandeau de l’accueil
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Les grandes images qui défilent en haut de cechemoi.com
            </p>
          </div>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          Voir le site
        </a>
      </div>

      {/* Explication */}
      <div className="flex items-start gap-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-5 py-4">
        <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Les images s’affichent sur le site dans l’ordre ci-dessous, dès l’enregistrement.
          Pour retirer une image sans la perdre, masquez-la.
          {slides.length === 0 && (
            <>
              {' '}
              <span className="font-semibold">Aucune image n’a encore été ajoutée ici</span> :
              le site affiche les trois images d’origine. Reprenez-les pour pouvoir les
              réordonner, les masquer ou les remplacer.
            </>
          )}
          {slides.length > 0 && activeCount === 0 && (
            <>
              {' '}
              <span className="font-semibold text-red-600 dark:text-red-400">
                Toutes les images sont masquées
              </span>{' '}
              : le site affiche les trois images d’origine.
            </>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une image
          </button>
        )}
        {slides.length === 0 && (
          <button
            type="button"
            onClick={importDefaults}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GalleryHorizontal className="h-4 w-4" />}
            Reprendre les 3 images actuelles
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nouvelle image</h2>
          {renderForm(addForm, setAddForm, handleAdd, () => { setAdding(false); setAddForm(EMPTY_FORM) }, 'Ajouter au bandeau')}
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`bg-white dark:bg-dark-800 border rounded-lg p-4 ${
              s.active ? 'border-gray-200 dark:border-dark-700' : 'border-dashed border-gray-300 dark:border-dark-600 opacity-70'
            }`}
          >
            {editingId === s.id ? (
              renderForm(editForm, setEditForm, handleEdit, () => setEditingId(null), 'Enregistrer')
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.alt}
                  className="w-full sm:w-48 aspect-[3/2] rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-dark-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        s.active
                          ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                          : 'bg-gray-500/15 text-gray-500'
                      }`}
                    >
                      {s.active ? 'Affichée' : 'Masquée'}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-gray-900 dark:text-white">{s.alt}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {s.link ? `Au clic : ${s.link}` : 'Pas de lien au clic'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 disabled:opacity-40"
                      title="Monter"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === slides.length - 1}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 disabled:opacity-40"
                      title="Descendre"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(s)}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      {s.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {s.active ? 'Masquer' : 'Afficher'}
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(s)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length === 0 && !adding && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-dark-600 rounded-lg">
          <X className="h-6 w-6 mx-auto mb-2 opacity-50" />
          Aucune image enregistrée ici pour le moment.
        </div>
      )}
    </div>
  )
}
