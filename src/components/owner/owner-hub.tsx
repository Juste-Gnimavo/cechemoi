'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Page intermédiaire du shell propriétaire : un titre, une action
// principale (grande carte pleine couleur) et quelques actions
// secondaires. Utilisé par les hubs Caisse, Clients, Commandes, Stock.

export interface OwnerHubAction {
  key: string
  label: string
  sublabel: string
  href: string
  icon: LucideIcon
  primary?: boolean
}

export function OwnerHub({
  title,
  subtitle,
  actions,
  notice,
}: {
  title: string
  subtitle: string
  actions: OwnerHubAction[]
  notice?: ReactNode
}) {
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
          {title}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.key}
              href={action.href}
              className={
                action.primary
                  ? 'group flex flex-col items-center text-center rounded-2xl px-3 py-6 sm:px-6 sm:py-8 shadow-sm hover:shadow-md transition-all bg-primary-700 hover:bg-primary-800 text-white col-span-2'
                  : 'group flex flex-col items-center text-center rounded-2xl px-3 py-6 sm:px-6 sm:py-8 shadow-sm hover:shadow-md transition-all bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 hover:border-primary-300 dark:hover:border-primary-700'
              }
            >
              <div
                className={
                  action.primary
                    ? 'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 text-white'
                    : 'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors'
                }
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span
                className={
                  action.primary
                    ? 'mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-white'
                    : 'mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white'
                }
              >
                {action.label}
              </span>
              <span
                className={
                  action.primary
                    ? 'mt-1 text-xs sm:text-sm text-white/80'
                    : 'mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400'
                }
              >
                {action.sublabel}
              </span>
            </Link>
          )
        })}
      </div>

      {notice && (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-5 py-4">
          {notice}
        </div>
      )}
    </div>
  )
}
