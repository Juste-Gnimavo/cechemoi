'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react'

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface AuthMessageModalProps {
  isOpen: boolean
  onClose: () => void
  type: MessageType
  title: string
  message: string
  secondaryMessage?: string
  actionLabel?: string
  onAction?: () => void
  autoClose?: number // Auto close after X milliseconds
  showCloseButton?: boolean
}

export function AuthMessageModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  secondaryMessage,
  actionLabel,
  onAction,
  autoClose,
  showCloseButton = true,
}: AuthMessageModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, onClose])

  if (!isOpen) return null

  const config = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      titleColor: 'text-green-400',
    },
    error: {
      icon: XCircle,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      titleColor: 'text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      titleColor: 'text-yellow-400',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      titleColor: 'text-blue-400',
    },
    loading: {
      icon: Loader2,
      iconBg: 'bg-primary-500/20',
      iconColor: 'text-primary-400',
      borderColor: 'border-primary-500/30',
      titleColor: 'text-primary-400',
    },
  }

  const { icon: Icon, iconBg, iconColor, borderColor, titleColor } = config[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={showCloseButton ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative bg-white dark:bg-dark-900 rounded-2xl border ${borderColor} shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Close button */}
        {showCloseButton && type !== 'loading' && (
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
            <Icon className={`h-8 w-8 ${iconColor} ${type === 'loading' ? 'animate-spin' : ''}`} />
          </div>

          {/* Title */}
          <h2 className={`text-xl font-bold ${titleColor} mb-3`}>
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {message}
          </p>

          {/* Secondary message */}
          {secondaryMessage && (
            <p className="text-gray-500 text-sm mb-4">
              {secondaryMessage}
            </p>
          )}

          {/* Action button */}
          {actionLabel && onAction && type !== 'loading' && (
            <button
              onClick={onAction}
              className="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {actionLabel}
            </button>
          )}

          {/* Close button for non-action modals */}
          {!actionLabel && showCloseButton && type !== 'loading' && (
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
export function SuccessModal(props: Omit<AuthMessageModalProps, 'type'>) {
  return <AuthMessageModal {...props} type="success" />
}

export function ErrorModal(props: Omit<AuthMessageModalProps, 'type'>) {
  return <AuthMessageModal {...props} type="error" />
}

export function WarningModal(props: Omit<AuthMessageModalProps, 'type'>) {
  return <AuthMessageModal {...props} type="warning" />
}

export function InfoModal(props: Omit<AuthMessageModalProps, 'type'>) {
  return <AuthMessageModal {...props} type="info" />
}

export function LoadingModal(props: Omit<AuthMessageModalProps, 'type' | 'showCloseButton'>) {
  return <AuthMessageModal {...props} type="loading" showCloseButton={false} />
}
