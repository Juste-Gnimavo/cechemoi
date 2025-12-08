'use client'

import { useEffect, useRef, useState } from 'react'

export type ModalType = 'success' | 'warning' | 'error' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  type: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  autoClose?: number // Auto close after X seconds (for success messages)
  redirectUrl?: string
  onRedirect?: () => void
}

const modalConfig = {
  success: {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    ringColor: 'ring-green-500/30',
  },
  warning: {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
    ringColor: 'ring-amber-500/30',
  },
  error: {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    buttonBg: 'bg-red-600 hover:bg-red-700',
    ringColor: 'ring-red-500/30',
  },
  info: {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    ringColor: 'ring-blue-500/30',
  },
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  showCancel = true,
  autoClose,
  redirectUrl,
  onRedirect,
}: ConfirmationModalProps) {
  const config = modalConfig[type]
  const modalRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && autoClose) {
      timerRef.current = setTimeout(() => {
        if (redirectUrl && onRedirect) {
          onRedirect()
        } else {
          onClose()
        }
      }, autoClose * 1000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isOpen, autoClose, redirectUrl, onRedirect, onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    if (redirectUrl && onRedirect) {
      onRedirect()
    } else {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-2xl ring-1 ${config.ringColor} animate-scale-in`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mb-6`}>
            <div className={config.iconColor}>{config.icon}</div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-3">{title}</h3>

          {/* Message */}
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">{message}</p>

          {/* Auto-close indicator */}
          {autoClose && (
            <div className="mb-6">
              <div className="h-1 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.buttonBg} animate-progress`}
                  style={{ animationDuration: `${autoClose}s` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Redirection automatique dans {autoClose} secondes...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex gap-3 ${showCancel ? '' : 'justify-center'}`}>
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors font-medium"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${showCancel ? 'flex-1' : 'px-12'} py-3 ${config.buttonBg} text-white rounded-xl transition-colors font-medium`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </div>
  )
}

// Hook to manage modal state
interface ModalState {
  isOpen: boolean
  type: ModalType
  title: string
  message: string
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  autoClose?: number
  redirectUrl?: string
}

export function useConfirmationModal() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  const showModal = (options: Omit<ModalState, 'isOpen'>) => {
    setModal({ ...options, isOpen: true })
  }

  const hideModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }))
  }

  const showSuccess = (title: string, message: string, options?: Partial<ModalState>) => {
    showModal({ type: 'success', title, message, showCancel: false, confirmText: 'OK', ...options })
  }

  const showWarning = (title: string, message: string, onConfirm: () => void, options?: Partial<ModalState>) => {
    showModal({ type: 'warning', title, message, onConfirm, showCancel: true, confirmText: 'Confirmer', ...options })
  }

  const showError = (title: string, message: string, options?: Partial<ModalState>) => {
    showModal({ type: 'error', title, message, showCancel: false, confirmText: 'Fermer', ...options })
  }

  const showInfo = (title: string, message: string, options?: Partial<ModalState>) => {
    showModal({ type: 'info', title, message, showCancel: false, confirmText: 'OK', ...options })
  }

  return {
    modal,
    showModal,
    hideModal,
    showSuccess,
    showWarning,
    showError,
    showInfo,
  }
}

