import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  Users,
  Megaphone,
  Settings,
  Boxes,
  Send,
  TrendingUp,
  FileBarChart,
  CalendarDays,
  Scissors,
  UsersRound,
  BarChart3,
  Calculator,
  Ticket,
  Star,
  Wallet,
  Lock,
} from 'lucide-react'
import type { UserRole } from '@prisma/client'

// =====================================================================
// Types
// =====================================================================

export type AllowedRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'TAILOR'

export interface SubMenuItem {
  href: string
  label: string
  badge?: string
  allowedRoles?: AllowedRole[]
}

export interface MenuGroup {
  label: string
  items: SubMenuItem[]
  allowedRoles?: AllowedRole[]
}

export interface MenuItem {
  href?: string
  label: string
  icon: LucideIcon
  items?: SubMenuItem[]
  groups?: MenuGroup[]
  allowedRoles?: AllowedRole[]
}

export interface SearchEntry {
  path: string
  title: string
  description: string
  keywords: string[]
  icon: LucideIcon
  allowedRoles: AllowedRole[]
  section: string
  action?: 'create' | 'view' | 'configure'
}

// =====================================================================
// MENU — source of truth consumed by AdminHeader
// =====================================================================

export const MENU: MenuItem[] = [
  {
    href: '/admin',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
  },
  {
    label: 'Clients',
    icon: Users,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    groups: [
      {
        label: 'Gestion des clients',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/customers', label: 'Voir/Chercher des clients' },
          { href: '/admin/customers/new', label: 'Ajouter un nouveau client', badge: 'NEW' },
          { href: '/admin/customers/import', label: 'Importer / Exporter' },
          { href: '/admin/customers/sources', label: "Sources d'acquisition", allowedRoles: ['ADMIN'] },
        ],
      },
      {
        label: 'Contacter les clients',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/customers/send-sms', label: 'Envoyez un SMS à un client' },
          { href: '/admin/customers/send-whatsapp', label: 'Envoyez un message WhatsApp' },
        ],
      },
    ],
  },
  {
    label: 'Rendez-vous',
    icon: CalendarDays,
    allowedRoles: ['ADMIN', 'MANAGER'],
    items: [
      { href: '/admin/appointments', label: 'Tableau de bord' },
      { href: '/admin/appointments/list', label: 'Tous les rendez-vous' },
      { href: '/admin/appointments?status=pending', label: 'En attente', badge: 'NEW' },
      { href: '/admin/appointments?status=confirmed', label: 'Confirmés' },
      { href: '/admin/appointments?status=completed', label: 'Terminés' },
      { href: '/admin/appointments/availability', label: 'Définir disponibilités', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
      { href: '/admin/appointments/services', label: 'Types de consultation', allowedRoles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    label: 'Sur-Mesure',
    icon: Scissors,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
    groups: [
      {
        label: 'Commandes',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
        items: [
          { href: '/admin/custom-orders', label: 'Toutes les commandes' },
          { href: '/admin/custom-orders/new', label: 'Nouvelle commande', badge: 'NEW', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
          { href: '/admin/custom-orders/audit', label: 'Audit & Statistiques', allowedRoles: ['ADMIN'] },
          { href: '/admin/production', label: 'Suivi Production' },
          { href: '/admin/custom-orders/fiche-suivi-confection', label: 'Fiche de Suivi Confection' },
        ],
      },
      {
        label: 'Stock Atelier',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/materials', label: 'Matériels' },
          { href: '/admin/materials/out', label: 'Enregistrer sortie', badge: 'NEW' },
          { href: '/admin/materials/in', label: 'Enregistrer entrée' },
          { href: '/admin/materials/movements', label: 'Historique' },
          { href: '/admin/materials/reports', label: 'Rapports' },
          { href: '/admin/materials/categories', label: 'Catégories' },
        ],
      },
    ],
  },
  {
    label: 'Caisse',
    icon: TrendingUp,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    groups: [
      {
        label: 'Factures',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/invoices', label: 'Toutes les factures' },
          { href: '/admin/invoices/new', label: 'Créer une facture', badge: 'NEW' },
          { href: '/admin/invoices/standalone-payments', label: 'Paiements autonomes', badge: 'NEW' },
        ],
      },
      {
        label: 'Reçus',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/receipts', label: 'Tous les reçus' },
          { href: '/admin/receipts?today=true', label: "Reçus d'aujourd'hui" },
        ],
      },
      {
        label: 'Ventes',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/sales', label: 'Toutes les ventes', badge: 'NEW' },
        ],
      },
      {
        label: 'Dépenses',
        allowedRoles: ['ADMIN', 'MANAGER'],
        items: [
          { href: '/admin/expenses/categories', label: 'Catégories' },
          { href: '/admin/expenses', label: 'Toutes les dépenses' },
          { href: '/admin/expenses/new', label: 'Ajouter une dépense', badge: 'NEW' },
          { href: '/admin/expenses/reports', label: 'Rapports', badge: 'NEW' },
          { href: '/admin/transactions', label: 'Transactions' },
        ],
      },
    ],
  },
  {
    label: 'Rapports',
    icon: FileBarChart,
    allowedRoles: ['ADMIN', 'MANAGER'],
    items: [
      { href: '/admin/reports', label: 'Tous les rapports financiers', badge: 'NEW' },
      { href: '/admin/reports?tab=online-sales', label: 'Ventes boutique en ligne' },
      { href: '/admin/reports?tab=custom-orders', label: 'Commandes sur mesure' },
      { href: '/admin/reports?tab=invoices', label: 'Factures' },
      { href: '/admin/reports?tab=transactions', label: 'Transactions' },
      { href: '/admin/reports?tab=refunds', label: 'Remboursements' },
      { href: '/admin/reports?tab=expenses', label: 'Dépenses' },
      { href: '/admin/reports?tab=clients', label: 'Clients', badge: 'NEW' },
    ],
  },
  {
    label: 'Boutique',
    icon: Package,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    groups: [
      {
        label: 'Commandes',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/orders', label: 'Voir toutes les commandes' },
          { href: '/admin/orders?status=pending', label: 'Commandes en attente' },
          { href: '/admin/orders?status=active', label: 'Commandes actives' },
          { href: '/admin/orders?status=cancelled', label: 'Commandes annulées' },
          { href: '/admin/orders/new', label: 'Créer une commande', badge: 'NEW' },
        ],
      },
      {
        label: 'Produits',
        allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
        items: [
          { href: '/admin/products', label: 'Tous les produits' },
          { href: '/admin/products/new', label: 'Ajouter un produit' },
          { href: '/admin/categories', label: 'Gestion des catégories' },
          { href: '/admin/categories/new', label: 'Ajouter une catégorie' },
          { href: '/admin/tags', label: 'Gestion des étiquettes' },
        ],
      },
      {
        label: 'Stock et Prix',
        allowedRoles: ['ADMIN', 'MANAGER'],
        items: [
          { href: '/admin/inventory', label: 'Gestion du stock' },
          { href: '/admin/coupons', label: 'Codes promo' },
        ],
      },
      {
        label: 'Médias',
        allowedRoles: ['ADMIN', 'MANAGER'],
        items: [
          { href: '/admin/media', label: "Galerie d'images" },
        ],
      },
    ],
  },
  {
    label: 'Communication',
    icon: Send,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    groups: [
      {
        label: 'Campagnes',
        items: [
          { href: '/admin/campaigns', label: 'Tableau de bord' },
          { href: '/admin/campaigns/sms', label: 'SMS' },
          { href: '/admin/campaigns/whatsapp', label: 'WhatsApp Business' },
          { href: '/admin/campaigns/whatsapp-cloud', label: 'WhatsApp Cloud' },
          { href: '/admin/campaigns/push', label: 'Notifications Push', badge: 'NEW' },
          { href: '/admin/campaigns/reports', label: 'Rapports' },
        ],
      },
      {
        label: 'Notifications',
        items: [
          { href: '/admin/notifications', label: 'Tableau de bord' },
          { href: '/admin/notifications/logs', label: 'Logs' },
          { href: '/admin/notifications/templates', label: 'Modèles de message' },
          { href: '/admin/notifications/follow-up', label: 'Messages de relance' },
          { href: '/admin/notifications/birthdays', label: 'Anniversaires', badge: 'NEW' },
          { href: '/admin/notifications/settings', label: 'Paramètres' },
        ],
      },
      {
        label: 'Blog',
        items: [
          { href: '/admin/blog', label: 'Tableau de bord' },
          { href: '/admin/blog/posts', label: 'Tous les articles' },
          { href: '/admin/blog/posts/new', label: 'Nouvel article', badge: 'NEW' },
          { href: '/admin/blog/categories', label: 'Catégories' },
          { href: '/admin/blog/tags', label: 'Étiquettes' },
        ],
      },
    ],
  },
  {
    label: 'Équipe',
    icon: UsersRound,
    allowedRoles: ['ADMIN', 'MANAGER'],
    items: [
      { href: '/admin/team', label: 'Gestion du staff' },
      { href: '/admin/tailors', label: 'Gestion des couturiers' },
      { href: '/admin/staff-performance', label: 'Performance équipe' },
    ],
  },
  {
    label: 'Réglages',
    icon: Settings,
    allowedRoles: ['ADMIN', 'MANAGER'],
    items: [
      { href: '/admin/settings', label: 'Configuration de la boutique' },
      { href: '/admin/shipping', label: 'Gestion des livraisons' },
      { href: '/admin/coupons', label: 'Gestion des coupons' },
    ],
  },
]

// =====================================================================
// filterMenuByRole — used by both AdminHeader and admin search
// =====================================================================

export function filterMenuByRole(items: MenuItem[], role: UserRole): MenuItem[] {
  if (role === 'ADMIN' || role === 'MANAGER') {
    return items
  }
  return items
    .filter((item) => {
      if (!item.allowedRoles) return false
      return item.allowedRoles.includes(role as AllowedRole)
    })
    .map((item) => {
      if (item.groups) {
        const filteredGroups = item.groups
          .filter((group) => {
            if (!group.allowedRoles) return true
            return group.allowedRoles.includes(role as AllowedRole)
          })
          .map((group) => ({
            ...group,
            items: group.items.filter((subItem) => {
              if (!subItem.allowedRoles) return true
              return subItem.allowedRoles.includes(role as AllowedRole)
            }),
          }))
          .filter((group) => group.items.length > 0)
        return { ...item, groups: filteredGroups }
      }
      if (item.items) {
        const filteredItems = item.items.filter((subItem) => {
          if (!subItem.allowedRoles) return true
          return subItem.allowedRoles.includes(role as AllowedRole)
        })
        return { ...item, items: filteredItems }
      }
      return item
    })
    .filter((item) => {
      if (item.groups && item.groups.length === 0) return false
      if (item.items && item.items.length === 0) return false
      return true
    })
}

// =====================================================================
// Helper to attach enrichments (keywords, description, action) to MENU-derived entries
// =====================================================================

interface Enrichment {
  description?: string
  keywords?: string[]
  action?: SearchEntry['action']
}

// Keyed by path (with query-string intact). Lookups during flatten.
const ENRICHMENTS: Record<string, Enrichment> = {
  '/admin': {
    description: 'Vue d\'ensemble du business : KPI, ventes, alertes',
    keywords: ['dashboard', 'accueil', 'home', 'kpi', 'apercu', 'overview'],
  },

  // ----- Clients -----
  '/admin/customers': {
    description: 'Rechercher, filtrer et consulter la base clients',
    keywords: ['clientele', 'fichier client', 'crm', 'base clients', 'liste clients'],
  },
  '/admin/customers/new': {
    description: 'Créer une fiche client (manuelle ou import)',
    keywords: ['ajouter', 'creer', 'nouveau', 'inscription', 'enregistrer'],
    action: 'create',
  },
  '/admin/customers/import': {
    description: 'Import CSV / export Excel de la base clients',
    keywords: ['csv', 'excel', 'import', 'export', 'migration', 'bulk'],
  },
  '/admin/customers/sources': {
    description: 'D\'où viennent les clients : réseaux, bouche-à-oreille, pub',
    keywords: ['acquisition', 'origine', 'how did you hear', 'canal', 'tracking'],
  },
  '/admin/customers/send-sms': {
    description: 'Envoyer un SMS individuel à un client',
    keywords: ['contact', 'message', 'texto', 'sms individuel'],
  },
  '/admin/customers/send-whatsapp': {
    description: 'Envoyer un WhatsApp individuel à un client',
    keywords: ['whatsapp', 'wa', 'contact', 'message direct'],
  },

  // ----- Rendez-vous -----
  '/admin/appointments': {
    description: 'Vue calendrier et stats des rendez-vous',
    keywords: ['rdv', 'consultation', 'agenda', 'calendrier', 'planning'],
  },
  '/admin/appointments/list': {
    description: 'Liste complète des rendez-vous (filtres avancés)',
    keywords: ['rdv', 'liste', 'historique', 'tous'],
  },
  '/admin/appointments?status=pending': {
    description: 'Rendez-vous en attente de confirmation',
    keywords: ['en attente', 'pending', 'a confirmer', 'nouveaux rdv'],
  },
  '/admin/appointments?status=confirmed': {
    description: 'Rendez-vous confirmés à venir',
    keywords: ['confirmes', 'a venir', 'prevus'],
  },
  '/admin/appointments?status=completed': {
    description: 'Rendez-vous passés et terminés',
    keywords: ['termines', 'passes', 'historique rdv'],
  },
  '/admin/appointments/availability': {
    description: 'Configurer les créneaux de disponibilité',
    keywords: ['horaires', 'creneaux', 'disponibilites', 'planning'],
    action: 'configure',
  },
  '/admin/appointments/services': {
    description: 'Types de consultations proposées (durée, prix)',
    keywords: ['services', 'types consultation', 'offres', 'prestations'],
    action: 'configure',
  },

  // ----- Sur-Mesure -----
  '/admin/custom-orders': {
    description: 'Toutes les commandes sur mesure (couture, broderie, retouche)',
    keywords: ['couture', 'sur mesure', 'commandes ateliers', 'confection'],
  },
  '/admin/custom-orders/new': {
    description: 'Saisir une nouvelle commande sur mesure',
    keywords: ['nouvelle', 'creer', 'ajouter', 'commande couture'],
    action: 'create',
  },
  '/admin/custom-orders/audit': {
    description: 'Audit & statistiques des commandes sur mesure',
    keywords: ['stats', 'audit', 'rapport', 'analyse'],
  },
  '/admin/production': {
    description: 'Suivi de production en atelier (étapes, deadlines)',
    keywords: ['atelier', 'fabrication', 'workflow', 'etapes', 'production'],
  },
  '/admin/custom-orders/fiche-suivi-confection': {
    description: 'Fiche de suivi confection imprimable',
    keywords: ['fiche', 'suivi', 'confection', 'pdf', 'impression'],
  },

  // ----- Stock Atelier (Materials) -----
  '/admin/materials': {
    description: 'Stock matières premières de l\'atelier (tissus, fils, accessoires)',
    keywords: ['matieres premieres', 'tissus', 'stock atelier', 'fournitures', 'inventaire'],
  },
  '/admin/materials/out': {
    description: 'Enregistrer une sortie de matière (consommation)',
    keywords: ['sortie', 'consommation', 'utilisation', 'destock'],
    action: 'create',
  },
  '/admin/materials/in': {
    description: 'Enregistrer une entrée de matière (achat, réception)',
    keywords: ['entree', 'reception', 'achat', 'reapprovisionnement'],
    action: 'create',
  },
  '/admin/materials/movements': {
    description: 'Historique des mouvements de stock matières',
    keywords: ['historique', 'mouvements', 'log', 'tracabilite'],
  },
  '/admin/materials/reports': {
    description: 'Rapports de consommation et valorisation du stock atelier',
    keywords: ['rapport', 'consommation', 'valorisation', 'stats matieres'],
  },
  '/admin/materials/categories': {
    description: 'Catégories de matières premières (tissus, fils, etc.)',
    keywords: ['categories', 'types', 'classification'],
    action: 'configure',
  },

  // ----- Caisse / Factures -----
  '/admin/invoices': {
    description: 'Toutes les factures émises (clients, sur-mesure, autonomes)',
    keywords: ['facturation', 'devis', 'factures clients'],
  },
  '/admin/invoices/new': {
    description: 'Créer une nouvelle facture',
    keywords: ['nouvelle', 'creer', 'emettre', 'facturer'],
    action: 'create',
  },
  '/admin/invoices/standalone-payments': {
    description: 'Paiements reçus sans facture rattachée',
    keywords: ['paiements autonomes', 'orphelins', 'sans facture', 'libres'],
  },

  // ----- Reçus -----
  '/admin/receipts': {
    description: 'Tous les reçus émis (preuves de paiement)',
    keywords: ['recus', 'tickets', 'preuves paiement', 'justificatifs'],
  },
  '/admin/receipts?today=true': {
    description: 'Reçus émis aujourd\'hui uniquement',
    keywords: ['aujourdhui', 'jour', 'today', 'recettes du jour'],
  },

  // ----- Ventes -----
  '/admin/sales': {
    description: 'Vue agrégée de toutes les ventes (jour/semaine/mois/année)',
    keywords: ['ventes', 'chiffre affaires', 'ca', 'turnover', 'revenus'],
  },

  // ----- Dépenses -----
  '/admin/expenses/categories': {
    description: 'Catégories de dépenses (électricité, loyer, fournitures…)',
    keywords: ['categories depenses', 'rubriques', 'classification'],
    action: 'configure',
  },
  '/admin/expenses': {
    description: 'Toutes les dépenses enregistrées',
    keywords: ['couts', 'charges', 'sorties argent', 'frais', 'achats'],
  },
  '/admin/expenses/new': {
    description: 'Ajouter une nouvelle dépense (électricité, loyer, achat…)',
    keywords: ['nouvelle', 'ajouter', 'creer', 'enregistrer depense', 'frais', 'electricite', 'loyer'],
    action: 'create',
  },
  '/admin/expenses/reports': {
    description: 'Rapports de dépenses par catégorie et période',
    keywords: ['rapport depenses', 'analyse charges', 'breakdown'],
  },
  '/admin/transactions': {
    description: 'Journal de toutes les transactions financières',
    keywords: ['transactions', 'journal', 'mouvements financiers', 'tresorerie'],
  },

  // ----- Rapports financiers (hub) -----
  '/admin/reports': {
    description: 'Hub financier comptable — tous les onglets et exports',
    keywords: ['comptabilite', 'finance', 'bilan', 'rapports', 'exports excel pdf'],
  },
  '/admin/reports?tab=online-sales': {
    description: 'Rapport des ventes de la boutique en ligne',
    keywords: ['ecommerce', 'web', 'site', 'ventes en ligne', 'shop'],
  },
  '/admin/reports?tab=custom-orders': {
    description: 'Rapport des commandes sur mesure (CA, marges)',
    keywords: ['sur mesure', 'couture', 'commandes atelier', 'rapport'],
  },
  '/admin/reports?tab=invoices': {
    description: 'Rapport détaillé des factures (émises, payées, en attente)',
    keywords: ['factures rapport', 'breakdown factures', 'analyse facturation'],
  },
  '/admin/reports?tab=transactions': {
    description: 'Toutes les transactions encaissées par période',
    keywords: ['transactions', 'encaisse', 'cash flow', 'paiements recus', 'tresorerie', 'argent rentre', 'recettes'],
  },
  '/admin/reports?tab=refunds': {
    description: 'Rapport des remboursements clients',
    keywords: ['remboursements', 'refunds', 'avoirs', 'retours argent'],
  },
  '/admin/reports?tab=expenses': {
    description: 'Rapport des dépenses (vue comptable)',
    keywords: ['rapport depenses', 'charges', 'sorties'],
  },
  '/admin/reports?tab=clients': {
    description: 'Rapport clients — métriques, segments, LTV, panier moyen, par période',
    keywords: ['clients', 'crm', 'customers', 'ltv', 'fideles', 'vip', 'segments', 'acquisition', 'inactifs', 'panier moyen'],
  },

  // ----- Boutique / Commandes -----
  '/admin/orders': {
    description: 'Toutes les commandes boutique en ligne',
    keywords: ['commandes web', 'commandes boutique', 'ecommerce', 'orders'],
  },
  '/admin/orders?status=pending': {
    description: 'Commandes boutique en attente de traitement',
    keywords: ['en attente', 'a traiter', 'nouvelles commandes', 'pending'],
  },
  '/admin/orders?status=active': {
    description: 'Commandes en cours de préparation ou livraison',
    keywords: ['actives', 'en cours', 'preparation', 'expedition'],
  },
  '/admin/orders?status=cancelled': {
    description: 'Commandes annulées',
    keywords: ['annulees', 'cancelled', 'rejetees'],
  },
  '/admin/orders/new': {
    description: 'Créer une commande boutique manuellement',
    keywords: ['nouvelle', 'creer commande', 'ajouter commande'],
    action: 'create',
  },

  // ----- Produits / Catalogue -----
  '/admin/products': {
    description: 'Catalogue produits (vêtements, accessoires)',
    keywords: ['catalogue', 'articles', 'produits boutique', 'items'],
  },
  '/admin/products/new': {
    description: 'Ajouter un nouveau produit au catalogue',
    keywords: ['nouveau produit', 'creer produit', 'ajouter article'],
    action: 'create',
  },
  '/admin/categories': {
    description: 'Catégories produits (arborescence)',
    keywords: ['categories', 'rayons', 'classification', 'arborescence'],
  },
  '/admin/categories/new': {
    description: 'Ajouter une nouvelle catégorie produit',
    keywords: ['nouvelle categorie', 'creer rayon'],
    action: 'create',
  },
  '/admin/tags': {
    description: 'Étiquettes / tags produits',
    keywords: ['tags', 'etiquettes', 'labels', 'mots cles'],
  },

  // ----- Stock & Prix -----
  '/admin/inventory': {
    description: 'Gestion du stock produits boutique',
    keywords: ['stock', 'inventaire', 'quantites', 'rupture'],
  },
  '/admin/coupons': {
    description: 'Codes promo / coupons / pourcentages de réduction',
    keywords: ['coupon', 'promo', 'reduction', 'discount', 'pourcentage', 'remise', 'soldes'],
  },

  // ----- Médias -----
  '/admin/media': {
    description: 'Bibliothèque d\'images et médias',
    keywords: ['images', 'photos', 'medias', 'galerie', 'uploads'],
  },

  // ----- Communication / Campagnes -----
  '/admin/campaigns': {
    description: 'Tableau de bord des campagnes marketing',
    keywords: ['campagnes', 'marketing', 'mass message'],
  },
  '/admin/campaigns/sms': {
    description: 'Campagnes SMS de masse',
    keywords: ['sms campagne', 'bulk sms', 'sms marketing', 'envoi groupe'],
  },
  '/admin/campaigns/whatsapp': {
    description: 'Campagnes WhatsApp Business',
    keywords: ['whatsapp business', 'wa campagne', 'message groupe'],
  },
  '/admin/campaigns/whatsapp-cloud': {
    description: 'WhatsApp Cloud API (templates, broadcasts)',
    keywords: ['whatsapp cloud', 'meta', 'cloud api', 'template'],
  },
  '/admin/campaigns/push': {
    description: 'Notifications push mobile',
    keywords: ['push', 'notifications mobiles', 'app'],
  },
  '/admin/campaigns/reports': {
    description: 'Rapports de performance des campagnes',
    keywords: ['rapport campagne', 'roi', 'taux ouverture', 'delivery'],
  },

  // ----- Notifications -----
  '/admin/notifications': {
    description: 'Hub des notifications transactionnelles',
    keywords: ['notifications', 'alertes', 'transactionnel'],
  },
  '/admin/notifications/logs': {
    description: 'Journal des notifications envoyées',
    keywords: ['logs notif', 'historique envoi', 'debug'],
  },
  '/admin/notifications/templates': {
    description: 'Modèles de messages réutilisables',
    keywords: ['templates', 'modeles', 'patrons message', 'reutilisable'],
    action: 'configure',
  },
  '/admin/notifications/follow-up': {
    description: 'Messages de relance automatique',
    keywords: ['relance', 'follow up', 'rappel', 'automation'],
  },
  '/admin/notifications/birthdays': {
    description: 'Messages d\'anniversaire automatiques',
    keywords: ['anniversaire', 'birthday', 'voeux', 'automation'],
  },
  '/admin/notifications/settings': {
    description: 'Paramètres globaux des notifications',
    keywords: ['parametres notif', 'config notifications', 'reglages'],
    action: 'configure',
  },

  // ----- Blog -----
  '/admin/blog': {
    description: 'Tableau de bord du blog',
    keywords: ['blog', 'contenu', 'articles dashboard'],
  },
  '/admin/blog/posts': {
    description: 'Tous les articles du blog',
    keywords: ['articles', 'posts', 'publications', 'billets'],
  },
  '/admin/blog/posts/new': {
    description: 'Rédiger un nouvel article de blog',
    keywords: ['nouvel article', 'redaction', 'creer post'],
    action: 'create',
  },
  '/admin/blog/categories': {
    description: 'Catégories d\'articles du blog',
    keywords: ['categories blog', 'rubriques blog'],
  },
  '/admin/blog/tags': {
    description: 'Étiquettes d\'articles',
    keywords: ['tags blog', 'mots cles articles'],
  },

  // ----- Équipe -----
  '/admin/team': {
    description: 'Gestion du staff (membres, rôles, désactivation)',
    keywords: ['staff', 'employes', 'personnel', 'membres equipe', 'team'],
  },
  '/admin/tailors': {
    description: 'Gestion des couturiers (TAILOR role)',
    keywords: ['couturiers', 'tailleurs', 'artisans atelier'],
  },
  '/admin/staff-performance': {
    description: 'Indicateurs de performance par membre d\'équipe',
    keywords: ['performance', 'kpi staff', 'productivite', 'classement equipe'],
  },

  // ----- Réglages -----
  '/admin/settings': {
    description: 'Configuration générale de la boutique (infos, branding, SEO)',
    keywords: ['parametres', 'reglages', 'config boutique', 'infos magasin', 'branding'],
    action: 'configure',
  },
  '/admin/shipping': {
    description: 'Méthodes de livraison, zones et tarifs',
    keywords: ['livraison', 'expedition', 'shipping', 'transport', 'frais port'],
    action: 'configure',
  },
}

// =====================================================================
// EXTRA_ENTRIES — pages non visibles dans le menu (analytics, marketing, sécurité, taxe)
// =====================================================================

const EXTRA_ENTRIES: SearchEntry[] = [
  {
    path: '/admin/marketing',
    title: 'Marketing',
    description: 'Hub marketing : campagnes, promotions, SEO',
    keywords: ['marketing', 'promotion', 'pub', 'communication'],
    icon: Megaphone,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Marketing',
  },
  {
    path: '/admin/analytics',
    title: 'Analytics',
    description: 'Statistiques globales : trafic, conversions, comportements',
    keywords: ['stats', 'analytics', 'traffic', 'audience', 'conversion'],
    icon: BarChart3,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Analytics',
  },
  {
    path: '/admin/analytics/products',
    title: 'Analytics produits',
    description: 'Performances détaillées par produit',
    keywords: ['stats produits', 'best sellers', 'top ventes'],
    icon: BarChart3,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Analytics',
  },
  {
    path: '/admin/analytics/revenue',
    title: 'Analytics revenus',
    description: 'Vue analytique des revenus et tendances',
    keywords: ['stats ca', 'revenus analyse', 'tendances'],
    icon: BarChart3,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Analytics',
  },
  {
    path: '/admin/sales/today',
    title: "Ventes d'aujourd'hui",
    description: 'Récap des ventes du jour en cours',
    keywords: ['ventes jour', 'today', 'aujourdhui', 'recettes du jour', 'caisse jour'],
    icon: Wallet,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    section: 'Caisse',
  },
  {
    path: '/admin/sales/week',
    title: 'Ventes de la semaine',
    description: 'Récap des ventes de la semaine en cours',
    keywords: ['ventes semaine', 'week', 'hebdomadaire'],
    icon: Wallet,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    section: 'Caisse',
  },
  {
    path: '/admin/sales/month',
    title: 'Ventes du mois',
    description: 'Récap des ventes du mois en cours',
    keywords: ['ventes mois', 'monthly', 'mensuel'],
    icon: Wallet,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    section: 'Caisse',
  },
  {
    path: '/admin/sales/year',
    title: "Ventes de l'année",
    description: 'Récap des ventes de l\'année en cours',
    keywords: ['ventes annee', 'annual', 'annuel'],
    icon: Wallet,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    section: 'Caisse',
  },
  {
    path: '/admin/coupons/new',
    title: 'Créer un coupon / code promo',
    description: 'Nouveau code promo avec pourcentage ou montant fixe',
    keywords: ['nouveau coupon', 'creer promo', 'pourcentage reduction', 'discount', 'soldes', 'remise'],
    icon: Ticket,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Boutique',
    action: 'create',
  },
  {
    path: '/admin/materials/new',
    title: 'Ajouter une matière première',
    description: 'Créer une nouvelle référence de matière (tissu, fil, accessoire)',
    keywords: ['nouvelle matiere', 'creer reference', 'ajouter tissu'],
    icon: Boxes,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'],
    section: 'Sur-Mesure',
    action: 'create',
  },
  {
    path: '/admin/inventory/movements',
    title: 'Mouvements de stock boutique',
    description: 'Historique des entrées / sorties du stock produits',
    keywords: ['mouvements stock', 'entrees sorties', 'historique inventaire'],
    icon: Boxes,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Boutique',
  },
  {
    path: '/admin/reviews',
    title: 'Avis clients',
    description: 'Modération des avis et commentaires produits',
    keywords: ['reviews', 'avis', 'commentaires', 'notes', 'moderation'],
    icon: Star,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Boutique',
  },
  {
    path: '/admin/tax',
    title: 'Paramètres TVA / Taxes',
    description: 'Configuration des taxes par zone',
    keywords: ['tva', 'taxes', 'tax', 'fiscalite'],
    icon: Calculator,
    allowedRoles: ['ADMIN', 'MANAGER'],
    section: 'Réglages',
    action: 'configure',
  },
  {
    path: '/admin/account/security',
    title: 'Sécurité du compte',
    description: 'Changer mot de passe, sessions actives, 2FA',
    keywords: ['securite', 'mot de passe', 'password', '2fa', 'compte', 'sessions'],
    icon: Lock,
    allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'],
    section: 'Compte',
    action: 'configure',
  },
]

// =====================================================================
// Section labels — built once from MENU traversal
// =====================================================================

function getSectionLabel(parentMenuLabel: string, groupLabel?: string): string {
  // If menu item is grouped, "Caisse → Factures" reads nicer than "Caisse"
  if (groupLabel) return `${parentMenuLabel} · ${groupLabel}`
  return parentMenuLabel
}

// =====================================================================
// Flatten MENU into SearchEntry[], merging in ENRICHMENTS
// =====================================================================

function detectAction(label: string): SearchEntry['action'] | undefined {
  const l = label.toLowerCase()
  if (l.includes('ajouter') || l.includes('créer') || l.includes('creer') || l.includes('nouvelle') || l.includes('nouveau') || l.includes('nouvel') || l.includes('enregistrer ')) {
    return 'create'
  }
  if (l.includes('paramètres') || l.includes('parametres') || l.includes('configuration') || l.includes('définir') || l.includes('definir')) {
    return 'configure'
  }
  return undefined
}

function flattenMenu(menu: MenuItem[]): SearchEntry[] {
  const out: SearchEntry[] = []

  for (const top of menu) {
    const topRoles = top.allowedRoles ?? ['ADMIN', 'MANAGER', 'STAFF', 'TAILOR']

    if (top.href) {
      const enrich = ENRICHMENTS[top.href] ?? {}
      out.push({
        path: top.href,
        title: top.label,
        description: enrich.description ?? top.label,
        keywords: enrich.keywords ?? [],
        icon: top.icon,
        allowedRoles: topRoles,
        section: top.label,
        action: enrich.action ?? detectAction(top.label),
      })
    }

    if (top.items) {
      for (const sub of top.items) {
        const enrich = ENRICHMENTS[sub.href] ?? {}
        out.push({
          path: sub.href,
          title: sub.label,
          description: enrich.description ?? `${top.label} → ${sub.label}`,
          keywords: enrich.keywords ?? [],
          icon: top.icon,
          allowedRoles: sub.allowedRoles ?? topRoles,
          section: getSectionLabel(top.label),
          action: enrich.action ?? detectAction(sub.label),
        })
      }
    }

    if (top.groups) {
      for (const group of top.groups) {
        const groupRoles = group.allowedRoles ?? topRoles
        for (const sub of group.items) {
          const enrich = ENRICHMENTS[sub.href] ?? {}
          out.push({
            path: sub.href,
            title: sub.label,
            description: enrich.description ?? `${top.label} → ${group.label} → ${sub.label}`,
            keywords: enrich.keywords ?? [],
            icon: top.icon,
            allowedRoles: sub.allowedRoles ?? groupRoles,
            section: getSectionLabel(top.label, group.label),
            action: enrich.action ?? detectAction(sub.label),
          })
        }
      }
    }
  }

  return out
}

// =====================================================================
// SEARCH_ENTRIES — final flat searchable list
// =====================================================================

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...flattenMenu(MENU),
  ...EXTRA_ENTRIES,
]

// =====================================================================
// Default suggestions when search input is empty
// =====================================================================

export const DEFAULT_SUGGESTIONS: string[] = [
  '/admin/invoices/new',
  '/admin/sales/today',
  '/admin/reports?tab=transactions',
  '/admin/customers/new',
  '/admin/expenses/new',
]
