'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getEnabledTiles } from '@/lib/owner/tiles'

export default function OwnerHomePage() {
  const { data: session } = useSession()
  const tiles = getEnabledTiles()
  const firstName = session?.user?.name?.split(' ')[0]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10 mt-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
          {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Que souhaitez-vous faire aujourd’hui ?
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Link
              key={tile.key}
              href={tile.href}
              className="group flex flex-col items-center text-center bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl px-3 py-6 sm:px-6 sm:py-8 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            >
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <span className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {tile.label}
              </span>
              <span className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {tile.sublabel}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
