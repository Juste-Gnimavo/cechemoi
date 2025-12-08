'use client'

import { useState } from 'react'
import { MessageSquare, Plus, User, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface OrderNote {
  id: string
  content: string
  noteType: string
  authorName: string
  createdAt: string
}

interface OrderNotesProps {
  orderId: string
  notes: OrderNote[]
  onUpdate: () => void
}

export default function OrderNotes({ orderId, notes, onUpdate }: OrderNotesProps) {
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState<'private' | 'customer'>('private')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Veuillez entrer une note')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          noteType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Note ajoutée avec succès')
        setContent('')
        setNoteType('private')
        setShowForm(false)
        onUpdate()
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajout de la note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Erreur lors de l\'ajout de la note')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary-500" />
          Notes de commande
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une note
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Add Note Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 pb-6 border-b border-gray-200 dark:border-dark-800">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Type de note</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="noteType"
                      value="private"
                      checked={noteType === 'private'}
                      onChange={(e) => setNoteType(e.target.value as 'private')}
                      className="text-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Privée
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="noteType"
                      value="customer"
                      checked={noteType === 'customer'}
                      onChange={(e) => setNoteType(e.target.value as 'customer')}
                      className="text-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Client (notification envoyée)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Entrez votre note ici..."
                  rows={4}
                  className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none border border-gray-200 dark:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setContent('')
                    setNoteType('private')
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Ajout...' : 'Ajouter la note'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucune note pour cette commande
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="pb-4 border-b border-gray-200 dark:border-dark-800 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-medium">{note.authorName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                        note.noteType === 'private'
                          ? 'bg-gray-500/10 text-gray-500 dark:text-gray-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {note.noteType === 'private' ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Privée
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" />
                          Client
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
