'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2, Trash2 } from 'lucide-react'

export type AdminMessageType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'confirm' | 'delete'

interface AdminMessageModalProps {
  isOpen: boolean
  onClose: () => void
  type: AdminMessageType
  title: string
  message: string
  secondaryMessage?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  autoClose?: number // Auto close after X milliseconds
  showCloseButton?: boolean
  isProcessing?: boolean
}

export function AdminMessageModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  secondaryMessage,
  confirmLabel,
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  autoClose,
  showCloseButton = true,
  isProcessing = false,
}: AdminMessageModalProps) {
  useEffect(() => {
    if (isOpen && autoClose && type !== 'confirm' && type !== 'delete') {
      const timer = setTimeout(() => {
        onClose()
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, onClose, type])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, isProcessing])

  if (!isOpen) return null

  const config = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      titleColor: 'text-green-400',
      buttonBg: 'bg-green-500 hover:bg-green-600',
    },
    error: {
      icon: XCircle,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      titleColor: 'text-red-400',
      buttonBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      titleColor: 'text-yellow-400',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      titleColor: 'text-blue-400',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
    },
    loading: {
      icon: Loader2,
      iconBg: 'bg-primary-500/20',
      iconColor: 'text-primary-400',
      borderColor: 'border-primary-500/30',
      titleColor: 'text-primary-400',
      buttonBg: 'bg-primary-500 hover:bg-primary-600',
    },
    confirm: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      titleColor: 'text-yellow-400',
      buttonBg: 'bg-primary-500 hover:bg-primary-600',
    },
    delete: {
      icon: Trash2,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      titleColor: 'text-red-400',
      buttonBg: 'bg-red-500 hover:bg-red-600',
    },
  }

  const { icon: Icon, iconBg, iconColor, borderColor, titleColor, buttonBg } = config[type]
  const isConfirmationType = type === 'confirm' || type === 'delete'
  const isLoading = type === 'loading' || isProcessing

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isLoading && showCloseButton ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative bg-white dark:bg-dark-900 rounded-2xl border ${borderColor} shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Close button */}
        {showCloseButton && !isLoading && !isConfirmationType && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mb-5`}>
            <Icon className={`h-8 w-8 ${iconColor} ${type === 'loading' || isProcessing ? 'animate-spin' : ''}`} />
          </div>

          {/* Title */}
          <h2 className={`text-xl font-bold ${titleColor} mb-3`}>
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            {message}
          </p>

          {/* Secondary message */}
          {secondaryMessage && (
            <p className="text-gray-500 text-sm mb-4">
              {secondaryMessage}
            </p>
          )}

          {/* Confirmation buttons */}
          {isConfirmationType && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg transition-colors border border-gray-200 dark:border-dark-700 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className={`flex-1 ${buttonBg} text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmLabel || (type === 'delete' ? 'Supprimer' : 'Confirmer')}
              </button>
            </div>
          )}

          {/* Single action button for non-confirmation modals */}
          {!isConfirmationType && confirmLabel && onConfirm && !isLoading && (
            <button
              onClick={onConfirm}
              className={`mt-4 w-full ${buttonBg} text-white font-semibold py-3 rounded-lg transition-colors`}
            >
              {confirmLabel}
            </button>
          )}

          {/* Close button for non-action, non-loading modals */}
          {!isConfirmationType && !confirmLabel && showCloseButton && !isLoading && (
            <button
              onClick={onClose}
              className="mt-4 w-full bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg transition-colors border border-gray-200 dark:border-dark-700"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Convenience components for common use cases
export function AdminSuccessModal(props: Omit<AdminMessageModalProps, 'type'>) {
  return <AdminMessageModal {...props} type="success" />
}

export function AdminErrorModal(props: Omit<AdminMessageModalProps, 'type'>) {
  return <AdminMessageModal {...props} type="error" />
}

export function AdminWarningModal(props: Omit<AdminMessageModalProps, 'type'>) {
  return <AdminMessageModal {...props} type="warning" />
}

export function AdminInfoModal(props: Omit<AdminMessageModalProps, 'type'>) {
  return <AdminMessageModal {...props} type="info" />
}

export function AdminLoadingModal(props: Omit<AdminMessageModalProps, 'type' | 'showCloseButton'>) {
  return <AdminMessageModal {...props} type="loading" showCloseButton={false} />
}

export function AdminConfirmModal(props: Omit<AdminMessageModalProps, 'type'>) {
  return <AdminMessageModal {...props} type="confirm" />
}

export function AdminDeleteModal(props: Omit<AdminMessageModalProps, 'type'>) {
  return <AdminMessageModal {...props} type="delete" />
}
