import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Scissors,
  Boxes,
  Wallet,
  FileBarChart,
  Cake,
} from 'lucide-react'

// =====================================================================
// Tuiles de l'accueil propriétaire (crm.cechemoi.com)
//
// Liste volontairement courte : on n'active une tuile que lorsque la
// propriétaire en exprime le besoin. Pour activer/désactiver une tuile,
// changer `enabled` — une ligne, un commit.
// =====================================================================

export interface OwnerTile {
  key: string
  label: string
  sublabel: string
  href: string
  icon: LucideIcon
  enabled: boolean
}

export const OWNER_TILES: OwnerTile[] = [
  {
    key: 'customers',
    label: 'Clients',
    sublabel: 'Ajouter un client, voir la liste, envoyer un message',
    href: '/owner/clients',
    icon: Users,
    enabled: true,
  },
  {
    key: 'custom-orders',
    label: 'Commandes',
    sublabel: 'Commandes sur mesure — la facture est créée automatiquement',
    href: '/owner/commandes',
    icon: Scissors,
    enabled: true,
  },
  {
    key: 'materials',
    label: 'Stock matériels',
    sublabel: 'Liste, entrées et sorties de stock',
    href: '/owner/stock',
    icon: Boxes,
    enabled: true,
  },
  {
    key: 'caisse',
    label: 'Caisse',
    sublabel: 'Dépenses du jour, reçus et factures',
    href: '/owner/caisse',
    icon: Wallet,
    enabled: true,
  },
  {
    key: 'reports',
    label: 'Rapports',
    sublabel: 'Chiffres et rapports, exports Excel et PDF',
    href: '/owner/rapports',
    icon: FileBarChart,
    enabled: true,
  },
  {
    key: 'birthdays',
    label: 'Anniversaires',
    sublabel: 'Messages d’anniversaire envoyés aux clientes',
    href: '/admin/notifications/birthdays',
    icon: Cake,
    enabled: true,
  },
]

export function getEnabledTiles(): OwnerTile[] {
  return OWNER_TILES.filter((t) => t.enabled)
}
