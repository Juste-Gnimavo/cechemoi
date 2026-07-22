'use client'

import {
  BarChart3,
  FileText,
  Globe,
  RefreshCcw,
  Scissors,
  Users,
  Wallet,
} from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerRapportsPage() {
  return (
    <OwnerHub
      title="Rapports"
      subtitle="Chaque rapport s’exporte en Excel ou en PDF"
      actions={[
        {
          key: 'custom-orders',
          label: 'Sur mesure',
          sublabel: 'Chiffres des commandes sur mesure',
          href: '/admin/reports?tab=custom-orders',
          icon: Scissors,
        },
        {
          key: 'online-sales',
          label: 'Ventes en ligne',
          sublabel: 'Ventes de la boutique cechemoi.com',
          href: '/admin/reports?tab=online-sales',
          icon: Globe,
        },
        {
          key: 'invoices',
          label: 'Factures',
          sublabel: 'Rapport des factures émises',
          href: '/admin/reports?tab=invoices',
          icon: FileText,
        },
        {
          key: 'transactions',
          label: 'Transactions',
          sublabel: 'Historique des paiements reçus',
          href: '/admin/reports?tab=transactions',
          icon: BarChart3,
        },
        {
          key: 'expenses',
          label: 'Dépenses',
          sublabel: 'Rapport des dépenses enregistrées',
          href: '/admin/reports?tab=expenses',
          icon: Wallet,
        },
        {
          key: 'refunds',
          label: 'Remboursements',
          sublabel: 'Remboursements effectués',
          href: '/admin/reports?tab=refunds',
          icon: RefreshCcw,
        },
        {
          key: 'clients',
          label: 'Clients',
          sublabel: 'Statistiques sur vos clientes',
          href: '/admin/reports?tab=clients',
          icon: Users,
        },
      ]}
    />
  )
}
