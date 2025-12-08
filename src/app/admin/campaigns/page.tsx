'use client'

import { Megaphone, MessageSquare, Smartphone, Cloud, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function CampaignsPage() {
  const campaignTypes = [
    {
      href: '/admin/campaigns/sms',
      icon: Smartphone,
      title: 'Campagne SMS',
      description: 'Envoyer des SMS en masse à vos clients',
      color: 'blue',
      stats: 'Simple & Direct',
    },
    {
      href: '/admin/campaigns/whatsapp',
      icon: MessageSquare,
      title: 'Campagne WhatsApp',
      description: 'Envoyer des messages WhatsApp avec images',
      color: 'green',
      stats: 'Texte + Média',
    },
    {
      href: '/admin/campaigns/whatsapp-cloud',
      icon: Cloud,
      title: 'WhatsApp Cloud',
      description: 'Envoyer via templates approuvés WhatsApp',
      color: 'purple',
      stats: 'Templates Officiels',
    },
    {
      href: '/admin/campaigns/reports',
      icon: BarChart3,
      title: 'Rapports',
      description: 'Voir les statistiques de toutes les campagnes',
      color: 'orange',
      stats: 'Analytics',
    },
  ]

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Megaphone className="h-8 w-8" />
          Campagnes Marketing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Envoyer des messages en masse à vos clients via SMS ou WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {campaignTypes.map((campaign) => {
          const Icon = campaign.icon
          return (
            <Link
              key={campaign.href}
              href={campaign.href}
              className="bg-white/80 dark:bg-dark-900/50 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group border border-gray-200 dark:border-transparent"
            >
              <div className={`p-6 ${colorClasses[campaign.color as keyof typeof colorClasses]} text-white`}>
                <Icon className="h-12 w-12 mb-3 opacity-90" />
                <h2 className="text-xl font-bold">{campaign.title}</h2>
                <p className="text-sm mt-1 opacity-90">{campaign.stats}</p>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-200">
                  {campaign.description}
                </p>
                <div className="mt-4">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    Accéder →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">À propos des Campagnes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">✉️ SMS</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Messages texte simples et directs. Idéal pour les promotions et rappels.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">📱 WhatsApp Business</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Messages avec images, documents et liens. Plus engageant et interactif.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">☁️ WhatsApp Cloud</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Templates pré-approuvés par WhatsApp. Taux de délivrabilité élevé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
