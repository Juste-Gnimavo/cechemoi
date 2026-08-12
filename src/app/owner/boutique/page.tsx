'use client'

import { Info, PlusCircle, ShoppingBag, Shirt } from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerBoutiquePage() {
  return (
    <OwnerHub
      title="Boutique en ligne"
      subtitle="Le site cechemoi.com — commandes, produits et ventes au comptoir"
      actions={[
        {
          key: 'new-sale',
          label: 'Vendre au comptoir',
          sublabel: 'Une cliente au magasin veut un article de la boutique : créez sa commande ici',
          href: '/admin/orders/new',
          icon: PlusCircle,
          primary: true,
        },
        {
          key: 'orders',
          label: 'Commandes du site',
          sublabel: 'Commandes passées en ligne sur cechemoi.com',
          href: '/admin/orders',
          icon: ShoppingBag,
        },
        {
          key: 'products',
          label: 'Produits',
          sublabel: 'Les tenues prêtes-à-porter du catalogue',
          href: '/admin/products',
          icon: Shirt,
        },
      ]}
      notice={
        <>
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Ici, tout concerne le prêt-à-porter de la boutique. Les commandes
            sur mesure avec suivi de confection sont dans{' '}
            <span className="font-semibold">Commandes atelier</span>. L&apos;argent
            des deux se retrouve au même endroit : la caisse et les rapports.
          </p>
        </>
      }
    />
  )
}
