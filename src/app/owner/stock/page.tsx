'use client'

import {
  ArrowLeftRight,
  Boxes,
  PackageMinus,
  PackagePlus,
  Plus,
} from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerStockPage() {
  return (
    <OwnerHub
      title="Stock matériels"
      subtitle="Tissus, fournitures et mouvements de stock"
      actions={[
        {
          key: 'out',
          label: 'Sortie de stock',
          sublabel: 'Tissu ou fourniture utilisé pour une commande',
          href: '/admin/materials/out',
          icon: PackageMinus,
          primary: true,
        },
        {
          key: 'in',
          label: 'Entrée de stock',
          sublabel: 'Nouvel arrivage de tissus ou fournitures',
          href: '/admin/materials/in',
          icon: PackagePlus,
        },
        {
          key: 'list',
          label: 'Tous les matériels',
          sublabel: 'Liste des matériels et niveaux de stock',
          href: '/admin/materials',
          icon: Boxes,
        },
        {
          key: 'new',
          label: 'Nouveau matériel',
          sublabel: 'Ajouter un matériel au catalogue',
          href: '/admin/materials/new',
          icon: Plus,
        },
        {
          key: 'movements',
          label: 'Mouvements',
          sublabel: 'Historique des entrées et sorties',
          href: '/admin/materials/movements',
          icon: ArrowLeftRight,
        },
      ]}
    />
  )
}
