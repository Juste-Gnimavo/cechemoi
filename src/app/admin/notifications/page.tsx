'use client'

import { useRouter } from 'next/navigation'
import { Bell, FileText, Settings } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()

  const sections = [
    {
      href: '/admin/notifications/templates',
      icon: Bell,
      title: 'Templates de Notifications',
      description: 'Gérer les templates de notifications SMS et WhatsApp (40 templates)',
      color: 'blue',
    },
    {
      href: '/admin/notifications/settings',
      icon: Settings,
      title: 'Paramètres',
      description: 'Configurer les canaux de notification et les destinataires admin',
      color: 'purple',
    },
    {
      href: '/admin/notifications/logs',
      icon: FileText,
      title: 'Logs & Historique',
      description: 'Consulter l\'historique de toutes les notifications envoyées',
      color: 'green',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary-500" />
          Système de Notifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Gérer les notifications SMS et WhatsApp pour les clients et les administrateurs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon
          const colorClasses = {
            blue: 'bg-blue-500 hover:bg-blue-600',
            purple: 'bg-purple-500 hover:bg-purple-600',
            green: 'bg-green-500 hover:bg-green-600',
          }

          return (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30 hover:border-primary-500/30 transition-all duration-200 overflow-hidden group"
            >
              <div className={`p-6 ${colorClasses[section.color as keyof typeof colorClasses]} text-white`}>
                <Icon className="h-12 w-12 mb-3 opacity-90" />
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-all duration-200">
                  {section.description}
                </p>
                <div className="mt-4">
                  <span className="text-sm font-medium text-primary-500 dark:text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300">
                    Accéder →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vue d'ensemble</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-100 dark:bg-dark-800/50 rounded-lg">
            <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">40</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Templates Disponibles</p>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-dark-800/50 rounded-lg">
            <p className="text-3xl font-bold text-green-500 dark:text-green-400">20</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Triggers Configurés</p>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-dark-800/50 rounded-lg">
            <p className="text-3xl font-bold text-purple-500 dark:text-purple-400">3</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Canaux Actifs</p>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-dark-800/50 rounded-lg">
            <p className="text-3xl font-bold text-orange-500 dark:text-orange-400">100%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Système Opérationnel</p>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mt-8 bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-dark-700/50 shadow-lg shadow-black/10 dark:shadow-black/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fonctionnalités</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-dark-800/30 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Notifications Multi-Canal</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">SMS, WhatsApp Business, WhatsApp Cloud</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-dark-800/30 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Basculement Automatique</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failover intelligent entre canaux</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-dark-800/30 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Templates Personnalisables</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Variables dynamiques et édition en direct</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-dark-800/30 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Logs Complets</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Traçabilité et export CSV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
