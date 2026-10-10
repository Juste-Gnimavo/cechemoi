'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Image, Link2Off, Loader2, Music, Send, Video, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TailorSummary {
  id: string
  name: string
  phone: string | null
  itemCount: number
  lastSentAt: string | null
  lastSentBy: string | null
  activeShareId: string | null
}

interface Overview {
  tailors: TailorSummary[]
  unassignedItems: Array<{ id: string; label: string }>
  lastSentAt: string | null
}

interface Preview {
  phone: string | null
  message: string
  items: Array<{ label: string; quantity: number }>
  measurementCount: number
  materials: Array<{ name: string; color: string | null; quantity: number; unit: string }>
  attachments: Array<{ name: string; category: 'image' | 'audio' | 'video'; description: string | null }>
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ATTACHMENT_ICONS = { image: Image, audio: Music, video: Video }

/**
 * Bouton « Informer le couturier » de la fiche commande sur mesure : aperçu
 * exact (numéro, message, PDF) puis envoi WhatsApp, uniquement sur clic.
 * À n'afficher qu'avec la permission `production` (l'API la vérifie aussi).
 */
export function NotifyTailorButton({
  orderId,
  assignmentKey,
  onChange,
}: {
  orderId: string
  /** Change quand les couturiers assignés changent, pour recharger l'état. */
  assignmentKey: string
  /** Appelé après un envoi ou une révocation (rafraîchir l'historique). */
  onChange?: () => void
}) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [open, setOpen] = useState(false)
  const [tailorId, setTailorId] = useState('')
  const [note, setNote] = useState('')
  const [debouncedNote, setDebouncedNote] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const base = `/api/admin/custom-orders/${orderId}/notify-tailor`

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch(base)
      if (res.ok) setOverview(await res.json())
    } catch (error) {
      console.error('Envoi couturier : état indisponible', error)
    }
  }, [base])

  useEffect(() => {
    loadOverview()
  }, [loadOverview, assignmentKey])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedNote(note), 600)
    return () => clearTimeout(t)
  }, [note])

  useEffect(() => {
    if (!open || !tailorId) return
    let cancelled = false
    setLoadingPreview(true)
    setPreviewError(null)
    const qs = new URLSearchParams({ tailorId, note: debouncedNote })
    fetch(`${base}?${qs}`)
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setPreview(null)
          setPreviewError(data.error || "Impossible de préparer l'aperçu")
        } else setPreview(data)
      })
      .catch(() => !cancelled && setPreviewError("Impossible de préparer l'aperçu"))
      .finally(() => !cancelled && setLoadingPreview(false))
    return () => {
      cancelled = true
    }
  }, [open, tailorId, debouncedNote, base])

  const openModal = () => {
    setNote('')
    setDebouncedNote('')
    setPreview(null)
    setConfirmRevoke(false)
    setTailorId(overview?.tailors[0]?.id ?? '')
    setOpen(true)
    loadOverview()
  }

  const send = async () => {
    setSending(true)
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Le bouton est inactif tant que l'aperçu n'a pas rattrapé la saisie :
        // ce qui part est exactement ce qui a été montré.
        body: JSON.stringify({ tailorId, note }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "L'envoi a échoué")
        return
      }
      toast.success('Fiche envoyée au couturier par WhatsApp')
      setOpen(false)
      await loadOverview()
      onChange?.()
    } catch {
      toast.error("L'envoi a échoué : vérifiez votre connexion")
    } finally {
      setSending(false)
    }
  }

  const revoke = async () => {
    setRevoking(true)
    try {
      const res = await fetch(`${base}?tailorId=${encodeURIComponent(tailorId)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'La révocation a échoué')
        return
      }
      toast.success('Lien révoqué : le PDF ne s\'ouvre plus')
      setConfirmRevoke(false)
      await loadOverview()
      onChange?.()
    } finally {
      setRevoking(false)
    }
  }

  const selected = overview?.tailors.find((t) => t.id === tailorId)
  const hasTailors = (overview?.tailors.length ?? 0) > 0
  const pdfSrc = tailorId
    ? `${base}/preview-pdf?${new URLSearchParams({ tailorId, note: debouncedNote })}`
    : ''

  return (
    <>
      <div className="flex flex-col items-end">
        <button
          onClick={openModal}
          disabled={!overview}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
          title="Envoyer au couturier sa fiche par WhatsApp (aucun montant)"
        >
          <Send className="h-4 w-4" />
          <span>Informer le couturier</span>
        </button>
        {overview?.lastSentAt && (
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Dernier envoi le {formatDateTime(overview.lastSentAt)}
          </span>
        )}
      </div>

      {open && overview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !sending && setOpen(false)} />
          <div className="relative bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informer le couturier</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chaque couturier ne reçoit que ses articles. Aucun montant n&apos;est envoyé.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {overview.unassignedItems.length > 0 && (
              <div className="mb-4 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 p-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Assignez un couturier</strong> à{' '}
                  {overview.unassignedItems.length > 1 ? 'ces articles' : 'cet article'} pour pouvoir l&apos;envoyer :{' '}
                  {overview.unassignedItems.map((i) => i.label).join(', ')}.
                </div>
              </div>
            )}

            {!hasTailors ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Aucun article n&apos;est encore assigné à un couturier. Assignez-les dans l&apos;onglet Articles.
              </p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Couturier destinataire</label>
                    <select
                      value={tailorId}
                      onChange={(e) => {
                        setTailorId(e.target.value)
                        setConfirmRevoke(false)
                      }}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      {overview.tailors.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.itemCount} article{t.itemCount > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    {selected && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        WhatsApp :{' '}
                        {selected.phone ? (
                          <span className="font-medium">{selected.phone}</span>
                        ) : (
                          <span className="text-red-500">aucun numéro, renseignez-le dans la fiche du couturier</span>
                        )}
                      </p>
                    )}
                    {selected?.lastSentAt && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Dernier envoi le {formatDateTime(selected.lastSentAt)}
                          {selected.lastSentBy && ` par ${selected.lastSentBy}`}
                          {!selected.activeShareId && ' (lien révoqué)'}
                        </span>
                        {selected.activeShareId &&
                          (confirmRevoke ? (
                            <span className="flex items-center gap-2">
                              <button
                                onClick={revoke}
                                disabled={revoking}
                                className="text-red-600 font-semibold hover:underline disabled:opacity-50"
                              >
                                {revoking ? 'Révocation…' : 'Confirmer la révocation'}
                              </button>
                              <button onClick={() => setConfirmRevoke(false)} className="hover:underline">
                                Annuler
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmRevoke(true)}
                              className="flex items-center gap-1 text-red-500 hover:underline"
                            >
                              <Link2Off className="h-3 w-3" /> Révoquer le lien du PDF
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Note pour le couturier <span className="font-normal text-gray-400">(facultatif)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white"
                      placeholder="Ex. : la cliente préfère des manches un peu plus amples."
                    />
                    <p className="text-xs text-gray-400 mt-1">Reprise dans le message et dans le PDF. N&apos;y écrivez aucun prix.</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-white mb-1">Message WhatsApp</p>
                    {loadingPreview && !preview ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Préparation de l&apos;aperçu…
                      </div>
                    ) : previewError ? (
                      <p className="text-sm text-red-500">{previewError}</p>
                    ) : preview ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm rounded-lg bg-[#e7ffdb] dark:bg-emerald-900/30 text-gray-900 dark:text-gray-100 p-3">
                        {preview.message}
                      </pre>
                    ) : null}
                  </div>

                  {preview && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p className="font-medium text-gray-700 dark:text-white">Contenu de la fiche PDF</p>
                      <p>
                        {preview.items.length} article{preview.items.length > 1 ? 's' : ''},{' '}
                        {preview.measurementCount > 0
                          ? `${preview.measurementCount} mesures`
                          : 'aucune mesure rattachée'}
                        , {preview.materials.length} matière{preview.materials.length > 1 ? 's' : ''} (sans coût).
                      </p>
                      {preview.attachments.length > 0 ? (
                        <ul className="space-y-0.5">
                          {preview.attachments.map((a, i) => {
                            const Icon = ATTACHMENT_ICONS[a.category]
                            return (
                              <li key={i} className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate">{a.description || a.name}</span>
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p>Aucune photo, aucun vocal joint.</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Les documents joints (devis, reçus…) ne sont jamais envoyés.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-700 dark:text-white mb-1">Aperçu du PDF</p>
                  {pdfSrc && !previewError ? (
                    <iframe
                      key={pdfSrc}
                      src={pdfSrc}
                      title="Aperçu de la fiche couturier"
                      className="w-full flex-1 min-h-[420px] rounded-lg border border-gray-200 dark:border-dark-700 bg-white"
                    />
                  ) : (
                    <div className="flex-1 min-h-[420px] rounded-lg border border-dashed border-gray-300 dark:border-dark-700" />
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={send}
                disabled={sending || !preview || !selected?.phone || loadingPreview || note !== debouncedNote}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{selected?.lastSentAt ? 'Renvoyer' : 'Envoyer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
