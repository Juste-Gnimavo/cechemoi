'use client'

import { useState } from 'react'
import { X, DollarSign, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RefundModalProps {
  orderId: string
  orderTotal: number
  totalRefunded: number
  onClose: () => void
  onSuccess: () => void
}

export default function RefundModal({
  orderId,
  orderTotal,
  totalRefunded,
  onClose,
  onSuccess,
}: RefundModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState(orderTotal - totalRefunded)
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const maxRefundAmount = orderTotal - totalRefunded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à zéro')
      return
    }

    if (amount > maxRefundAmount) {
      toast.error('Le montant dépasse le maximum remboursable')
      return
    }

    if (!reason.trim()) {
      toast.error('Veuillez fournir une raison pour le remboursement')
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          reason: reason.trim(),
          refundType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Remboursement traité avec succès')
        onSuccess()
      } else {
        toast.error(data.error || 'Erreur lors du traitement du remboursement')
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error('Erreur lors du traitement du remboursement')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-500" />
            Traiter un remboursement
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-200">
                <p className="font-semibold mb-1">Attention</p>
                <p>
                  Cette action traitera un remboursement et ne peut pas être annulée. Le client
                  sera notifié par WhatsApp/SMS.
                </p>
              </div>
            </div>
          </div>

          {/* Refund Info */}
          <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total commande:</span>
              <span className="text-gray-900 dark:text-white font-medium">{orderTotal.toLocaleString()} CFA</span>
            </div>
            {totalRefunded > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Déjà remboursé:</span>
                <span className="text-red-400">-{totalRefunded.toLocaleString()} CFA</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-dark-700">
              <span className="text-gray-500 dark:text-gray-400">Maximum remboursable:</span>
              <span className="text-gray-900 dark:text-white font-bold">{maxRefundAmount.toLocaleString()} CFA</span>
            </div>
          </div>

          {/* Refund Type */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-3">Type de remboursement</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={(e) => {
                    setRefundType('full')
                    setAmount(maxRefundAmount)
                  }}
                  className="text-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Remboursement complet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={(e) => {
                    setRefundType('partial')
                    setAmount(0)
                  }}
                  className="text-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Remboursement partiel</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
              Montant du remboursement (CFA)
            </label>
            <input
              type="number"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              min="0"
              max={maxRefundAmount}
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={refundType === 'full' || isProcessing}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-transparent"
              placeholder="Montant"
            />
            {refundType === 'partial' && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {maxRefundAmount.toLocaleString()} CFA
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Raison du remboursement *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez la raison du remboursement..."
              rows={3}
              required
              disabled={isProcessing}
              className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none border border-gray-200 dark:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isProcessing || amount <= 0 || amount > maxRefundAmount || !reason.trim()}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isProcessing ? 'Traitement...' : `Rembourser ${amount.toLocaleString()} CFA`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
