'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Info,
  PlusCircle,
  Receipt,
  Wallet,
} from 'lucide-react'

const actions = [
  {
    key: 'add-expense',
    label: 'Ajouter une dépense',
    sublabel: 'Eau, électricité, internet, achats du jour…',
    href: '/admin/expenses/new',
    icon: PlusCircle,
    primary: true,
  },
  {
    key: 'expenses',
    label: 'Toutes les dépenses',
    sublabel: 'Historique des dépenses enregistrées',
    href: '/admin/expenses',
    icon: Wallet,
    primary: false,
  },
  {
    key: 'receipts-today',
    label: 'Reçus d’aujourd’hui',
    sublabel: 'Les encaissements de la journée',
    href: '/admin/receipts?today=true',
    icon: Receipt,
    primary: false,
  },
  {
    key: 'invoices',
    label: 'Toutes les factures',
    sublabel: 'Consulter les factures existantes',
    href: '/admin/invoices',
    icon: FileText,
    primary: false,
  },
]

export default function OwnerCaissePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l’accueil
      </Link>

      <div className="text-center mb-8 mt-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
          Caisse
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Dépenses, reçus et factures
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.key}
              href={action.href}
              className={
                action.primary
                  ? 'group flex flex-col items-center text-center rounded-2xl px-6 py-8 shadow-sm hover:shadow-md transition-all bg-primary-700 hover:bg-primary-800 text-white sm:col-span-2'
                  : 'group flex flex-col items-center text-center rounded-2xl px-6 py-8 shadow-sm hover:shadow-md transition-all bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 hover:border-primary-300 dark:hover:border-primary-700'
              }
            >
              <div
                className={
                  action.primary
                    ? 'flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white'
                    : 'flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors'
                }
              >
                <Icon className="w-7 h-7" />
              </div>
              <span
                className={
                  action.primary
                    ? 'mt-4 text-lg font-semibold text-white'
                    : 'mt-4 text-lg font-semibold text-gray-900 dark:text-white'
                }
              >
                {action.label}
              </span>
              <span
                className={
                  action.primary
                    ? 'mt-1 text-sm text-white/80'
                    : 'mt-1 text-sm text-gray-500 dark:text-gray-400'
                }
              >
                {action.sublabel}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-5 py-4">
        <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Pour créer une facture, ne passez pas par la caisse :{' '}
          <Link
            href="/admin/custom-orders/new"
            className="font-semibold text-primary-700 dark:text-primary-400 underline underline-offset-2"
          >
            créez une commande
          </Link>{' '}
          — la facture est générée automatiquement avec la commande.
        </p>
      </div>
    </div>
  )
}
