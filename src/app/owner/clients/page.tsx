'use client'

import { MessageCircle, MessageSquare, UserPlus, Users } from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerClientsPage() {
  return (
    <OwnerHub
      title="Clients"
      subtitle="Ajouter, retrouver et contacter vos clientes"
      actions={[
        {
          key: 'new',
          label: 'Ajouter un client',
          sublabel: 'Nouvelle cliente : nom, téléphone, mensurations…',
          href: '/admin/customers/new',
          icon: UserPlus,
          primary: true,
        },
        {
          key: 'list',
          label: 'Tous les clients',
          sublabel: 'Rechercher une cliente, voir sa fiche',
          href: '/admin/customers',
          icon: Users,
        },
        {
          key: 'whatsapp',
          label: 'Envoyer un WhatsApp',
          sublabel: 'Message WhatsApp à une ou plusieurs clientes',
          href: '/admin/customers/send-whatsapp',
          icon: MessageCircle,
        },
        {
          key: 'sms',
          label: 'Envoyer un SMS',
          sublabel: 'Message SMS à une ou plusieurs clientes',
          href: '/admin/customers/send-sms',
          icon: MessageSquare,
        },
      ]}
    />
  )
}
