'use client'

import {
  Info,
  PlusCircle,
  ShoppingBag,
  Shirt,
  PackagePlus,
  Boxes,
  FolderTree,
  Images,
  MessageSquareText,
  Ticket,
  GalleryHorizontal,
} from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

// Hub « Boutique en ligne » : tout ce qui touche au prêt-à-porter vendu sur
// cechemoi.com. Les actions de mise à jour du catalogue (tenues, stock,
// catégories, photos, avis) sont ouvertes au Personnel par la matrice de
// droits ; les codes promo restent réservés à la direction et au
// gestionnaire boutique en ligne, dont ce hub est l'accueil.

export default function OwnerBoutiquePage() {
  return (
    <OwnerHub
      title="Boutique en ligne"
      subtitle="Le site cechemoi.com — ventes au comptoir, commandes et mise à jour du catalogue"
      actions={[
        {
          key: 'new-sale',
          label: 'Vendre au comptoir',
          sublabel: 'Une cliente au magasin veut un article de la boutique : créez sa commande ici',
          href: '/admin/orders/new',
          icon: PlusCircle,
          primary: true,
          permission: 'orders.create',
        },
        {
          key: 'new-product',
          label: 'Ajouter une tenue',
          sublabel: 'Nouvelle pièce au catalogue : photos, prix, tailles, stock',
          href: '/admin/products/new',
          icon: PackagePlus,
          permission: 'products.manage',
        },
        {
          key: 'stock',
          label: 'Mettre à jour le stock',
          sublabel: 'Arrivage, retour, pièce abîmée ou correction — avec historique',
          href: '/admin/inventory/adjust',
          icon: Boxes,
          permission: 'inventory.adjust',
        },
        {
          key: 'products',
          label: 'Toutes les tenues',
          sublabel: 'Modifier, publier ou retirer du site, mettre en vedette sur l’accueil',
          href: '/admin/products',
          icon: Shirt,
          permission: 'products',
        },
        {
          key: 'orders',
          label: 'Commandes du site',
          sublabel: 'Commandes passées en ligne sur cechemoi.com',
          href: '/admin/orders',
          icon: ShoppingBag,
          permission: 'orders',
        },
        {
          key: 'categories',
          label: 'Catégories',
          sublabel: 'Les rayons du site : robes, ensembles, accessoires…',
          href: '/admin/categories',
          icon: FolderTree,
          permission: 'categories',
        },
        {
          key: 'media',
          label: 'Photos',
          sublabel: 'Médiathèque : envoyer et retrouver les photos des tenues',
          href: '/admin/media',
          icon: Images,
          permission: 'media',
        },
        {
          key: 'storefront',
          label: 'Bandeau de l’accueil',
          sublabel: 'Les grandes images qui défilent en haut de cechemoi.com',
          href: '/admin/storefront',
          icon: GalleryHorizontal,
          permission: 'storefront',
        },
        {
          key: 'reviews',
          label: 'Avis des clientes',
          sublabel: 'Approuver ou masquer les avis laissés sur le site',
          href: '/admin/reviews',
          icon: MessageSquareText,
          permission: 'reviews.moderate',
        },
        {
          key: 'coupons',
          label: 'Codes promo',
          sublabel: 'Réductions et promotions du site',
          href: '/admin/coupons',
          icon: Ticket,
          permission: 'coupons.manage',
        },
      ]}
      notice={
        <>
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Ici, tout concerne le prêt-à-porter de la boutique. Les commandes
            sur mesure avec suivi de confection sont dans{' '}
            <span className="font-semibold">Commandes atelier</span>. Une tenue
            publiée est visible sur le site immédiatement ; pour la retirer sans
            la supprimer, passez-la en brouillon depuis « Toutes les tenues ».
            L&apos;argent des deux se retrouve au même endroit : la caisse et les
            rapports.
          </p>
        </>
      }
    />
  )
}
