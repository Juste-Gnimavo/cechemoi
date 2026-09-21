import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@prisma/client'
import { hasPermission, type Permission } from '@/lib/role-permissions'
import {
  Users,
  Scissors,
  Boxes,
  Wallet,
  FileBarChart,
  Cake,
  ShoppingBag,
  UserCog,
  MessagesSquare,
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
  /**
   * Droit requis pour voir la tuile. Absent = visible par tout compte admin.
   * Les tuiles « Caisse », « Rapports » et « Personnel » exposent la trésorerie
   * et la masse salariale : elles restent réservées à la direction.
   */
  permission?: Permission
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
    label: 'Commandes atelier',
    sublabel: 'Sur mesure — suivi de confection, facture automatique',
    href: '/owner/commandes',
    icon: Scissors,
    enabled: true,
  },
  {
    key: 'online-shop',
    label: 'Boutique en ligne',
    sublabel: 'Commandes du site, produits, ventes au comptoir',
    href: '/owner/boutique',
    icon: ShoppingBag,
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
    permission: 'finance.expenses.create',
    icon: Wallet,
    enabled: true,
  },
  {
    key: 'reports',
    label: 'Rapports',
    sublabel: 'Chiffres et rapports, exports Excel et PDF',
    href: '/owner/rapports',
    permission: 'reports.financial',
    icon: FileBarChart,
    enabled: true,
  },
  {
    key: 'personnel',
    label: 'Personnel',
    sublabel: 'Équipe, couturiers, performances, comptes',
    href: '/owner/personnel',
    permission: 'team',
    icon: UserCog,
    enabled: true,
  },
  {
    key: 'messages',
    label: 'Messages',
    sublabel: 'SMS et WhatsApp — à un client ou à tous',
    href: '/owner/messages',
    icon: MessagesSquare,
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

export function getEnabledTiles(role?: UserRole): OwnerTile[] {
  return OWNER_TILES.filter((t) => {
    if (!t.enabled) return false
    if (!t.permission) return true
    if (!role) return false
    return hasPermission(role, t.permission)
  })
}
