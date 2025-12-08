'use client'

import { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: number | string
  icon?: LucideIcon
  color?: 'default' | 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'purple'
  description?: string
}

interface AdminStatsHeaderProps {
  stats: StatItem[]
  title?: string
}

const colorClasses = {
  default: 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white',
  primary: 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400',
  green: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
  red: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
}

const iconColorClasses = {
  default: 'text-gray-500 dark:text-gray-400',
  primary: 'text-primary-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
  blue: 'text-blue-500',
  purple: 'text-purple-500',
}

export function AdminStatsHeader({ stats, title }: AdminStatsHeaderProps) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {stats.map((stat, index) => {
          const color = stat.color || 'default'
          const Icon = stat.icon

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${colorClasses[color]}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {Icon && (
                  <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />
                )}
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium truncate">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {typeof stat.value === 'number'
                  ? stat.value.toLocaleString()
                  : stat.value}
              </p>
              {stat.description && (
                <p className="text-gray-500 text-xs mt-1 truncate">
                  {stat.description}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
