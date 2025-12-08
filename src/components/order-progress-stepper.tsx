'use client'

import { CheckCircle, Circle, Loader2, XCircle, ShoppingCart, FileText, MessageSquare, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Step {
  id: number
  label: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  icon: 'cart' | 'invoice' | 'sms' | 'whatsapp' | 'payment' | 'check'
}

interface OrderProgressStepperProps {
  steps: Step[]
  className?: string
}

const iconMap = {
  cart: ShoppingCart,
  invoice: FileText,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  payment: CreditCard,
  check: CheckCircle,
}

export function OrderProgressStepper({ steps, className }: OrderProgressStepperProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const Icon = iconMap[step.icon] || Circle
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-5 top-10 w-0.5 h-12',
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300 dark:bg-dark-700'
                )}
              />
            )}

            {/* Step content */}
            <div className="flex items-start gap-4 pb-8">
              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                  step.status === 'pending' && 'border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-800',
                  step.status === 'in_progress' && 'border-primary-500 bg-primary-500/20',
                  step.status === 'completed' && 'border-green-500 bg-green-500',
                  step.status === 'failed' && 'border-red-500 bg-red-500/20'
                )}
              >
                {step.status === 'in_progress' ? (
                  <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                ) : step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : step.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Icon className="h-5 w-5 text-gray-400 dark:text-dark-400" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 pt-1">
                <h3
                  className={cn(
                    'font-medium transition-colors duration-300',
                    step.status === 'pending' && 'text-gray-500 dark:text-dark-400',
                    step.status === 'in_progress' && 'text-gray-900 dark:text-white',
                    step.status === 'completed' && 'text-green-600 dark:text-green-400',
                    step.status === 'failed' && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {step.label}
                </h3>
                <p
                  className={cn(
                    'text-sm transition-colors duration-300',
                    step.status === 'pending' && 'text-gray-400 dark:text-dark-500',
                    step.status === 'in_progress' && 'text-gray-500 dark:text-gray-400',
                    step.status === 'completed' && 'text-green-600/70 dark:text-green-400/70',
                    step.status === 'failed' && 'text-red-600/70 dark:text-red-400/70'
                  )}
                >
                  {step.description}
                </p>
              </div>

              {/* Status indicator */}
              <div className="pt-1">
                {step.status === 'completed' && (
                  <span className="text-green-600 dark:text-green-500 text-sm font-medium">Fait</span>
                )}
                {step.status === 'in_progress' && (
                  <span className="text-primary-500 dark:text-primary-400 text-sm">En cours...</span>
                )}
                {step.status === 'failed' && (
                  <span className="text-red-500 dark:text-red-400 text-sm">Erreur</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Default steps for CASH_ON_DELIVERY
export const cashOnDeliverySteps: Step[] = [
  {
    id: 1,
    label: 'Création de la commande',
    description: 'Votre commande est en cours de création',
    status: 'pending',
    icon: 'cart',
  },
  {
    id: 2,
    label: 'Génération de la facture',
    description: 'Votre facture est générée',
    status: 'pending',
    icon: 'invoice',
  },
  {
    id: 3,
    label: 'Envoi SMS',
    description: 'Confirmation envoyée par SMS',
    status: 'pending',
    icon: 'sms',
  },
  {
    id: 4,
    label: 'Envoi WhatsApp',
    description: 'Confirmation envoyée par WhatsApp avec facture',
    status: 'pending',
    icon: 'whatsapp',
  },
  {
    id: 5,
    label: 'Commande confirmée',
    description: 'Votre commande est prête!',
    status: 'pending',
    icon: 'check',
  },
]

// Default steps for PAIEMENTPRO
export const paiementProSteps: Step[] = [
  {
    id: 1,
    label: 'Création de la commande',
    description: 'Votre commande est en cours de création',
    status: 'pending',
    icon: 'cart',
  },
  {
    id: 2,
    label: 'Génération de la facture',
    description: 'Votre facture est générée',
    status: 'pending',
    icon: 'invoice',
  },
  {
    id: 3,
    label: 'Préparation du paiement',
    description: 'Redirection vers la page de paiement',
    status: 'pending',
    icon: 'payment',
  },
]
