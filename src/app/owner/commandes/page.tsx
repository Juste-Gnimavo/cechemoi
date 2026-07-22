'use client'

import Link from 'next/link'
import {
  ClipboardList,
  Info,
  PlusCircle,
  Scissors,
  ShoppingBag,
} from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerCommandesPage() {
  return (
    <OwnerHub
      title="Commandes"
      subtitle="Commandes sur mesure et commandes de la boutique en ligne"
      actions={[
        {
          key: 'new',
          label: 'Nouvelle commande',
          sublabel: 'Commande sur mesure — la facture est générée automatiquement',
          href: '/admin/custom-orders/new',
          icon: PlusCircle,
          primary: true,
        },
        {
          key: 'list',
          label: 'Toutes les commandes',
          sublabel: 'Suivre les commandes sur mesure en cours',
          href: '/admin/custom-orders',
          icon: Scissors,
        },
        {
          key: 'fiche-suivi',
          label: 'Fiche de suivi confection',
          sublabel: 'Fiche de suivi pour l’atelier',
          href: '/admin/custom-orders/fiche-suivi-confection',
          icon: ClipboardList,
        },
        {
          key: 'shop-orders',
          label: 'Commandes boutique',
          sublabel: 'Commandes passées sur le site cechemoi.com',
          href: '/admin/orders',
          icon: ShoppingBag,
        },
      ]}
      notice={
        <>
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Chaque commande crée sa facture automatiquement. Inutile de créer
            une facture séparément dans la{' '}
            <Link
              href="/owner/caisse"
              className="font-semibold text-primary-700 dark:text-primary-400 underline underline-offset-2"
            >
              caisse
            </Link>
            .
          </p>
        </>
      }
    />
  )
}
