'use client'

import {
  BarChart3,
  Info,
  MessageCircle,
  MessageSquare,
  Radio,
  Send,
} from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerMessagesPage() {
  return (
    <OwnerHub
      title="Messages"
      subtitle="Écrire à une cliente ou à toutes — SMS et WhatsApp"
      actions={[
        {
          key: 'whatsapp-one',
          label: 'WhatsApp à une cliente',
          sublabel: 'Cherchez la cliente par son nom et envoyez le message',
          href: '/admin/customers/send-whatsapp',
          icon: MessageCircle,
          primary: true,
        },
        {
          key: 'sms-one',
          label: 'SMS à une cliente',
          sublabel: 'Message texte individuel',
          href: '/admin/customers/send-sms',
          icon: MessageSquare,
        },
        {
          key: 'campaign-whatsapp',
          label: 'Campagne WhatsApp',
          sublabel: 'À toutes les clientes ou à une liste de numéros',
          href: '/admin/campaigns/whatsapp',
          icon: Send,
        },
        {
          key: 'campaign-sms',
          label: 'Campagne SMS',
          sublabel: 'À toutes les clientes ou à une liste de numéros',
          href: '/admin/campaigns/sms',
          icon: Radio,
        },
        {
          key: 'reports',
          label: 'Rapports d’envois',
          sublabel: 'Ce qui a été envoyé, reçu ou échoué',
          href: '/admin/campaigns/reports',
          icon: BarChart3,
        },
      ]}
      notice={
        <>
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Les messages d&apos;anniversaire et les notifications de commande
            (tenue prête, en production…) partent automatiquement — pas besoin
            de les envoyer à la main ici.
          </p>
        </>
      }
    />
  )
}
