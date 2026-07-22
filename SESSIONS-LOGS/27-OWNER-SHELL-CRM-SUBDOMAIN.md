# Session 27 — Shell propriétaire sur crm.cechemoi.com

**Date** : 2026-07-22
**Objectif** : Créer une interface propriétaire aérée sur crm.cechemoi.com (grille de tuiles), sans toucher à l'admin complet existant sur cechemoi.com/admin.

---

## Contexte

L'admin compte 81 liens / ~108 entrées de menu (`src/lib/admin-search/registry.ts`). La propriétaire ne s'y retrouve pas malgré la barre de recherche ⌘K (session précédente) et appelle le CEO à chaque action. Décision : la recherche est une UX de rappel, la propriétaire fonctionne par reconnaissance → grille de tuiles style launcher, activation progressive des tuiles à la demande (via WhatsApp → commit d'une ligne).

Problème métier identifié : elle crée des factures directement puis revient créer la commande, alors que le flow commande génère la facture automatiquement. Le shell la guide donc vers « Commandes » et le hub Caisse contient un rappel explicite.

## Architecture

**Un seul déploiement Next.js, deux shells selon le host** :

- `cechemoi.com` → boutique + `/admin` complet, strictement inchangés.
- `crm.cechemoi.com` → shell propriétaire (rewrite middleware, pas de redirect) :
  - `/` → accueil tuiles (`/owner`)
  - `/owner/*`, `/admin/*`, `/auth/*`, `/api/*` → passent tels quels
  - tout autre chemin sans extension → alias `/admin/*` (ex. `crm.cechemoi.com/customers`)
  - chemins avec extension (logos, images) → passent tels quels
- Sur `crm.`, le layout admin (`headers()` côté serveur) remplace le header dense par le header minimal et masque la bottom bar d'actions rapides.

**Auth** : aucune modification. Cookie NextAuth host-only ; la propriétaire se connecte directement sur crm.cechemoi.com (les pages `/auth/*` y sont servies), donc le cookie vit sur ce host. Pas besoin de domaine `.cechemoi.com`.

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/owner/tiles.ts` | Config des tuiles (`enabled` par tuile — activation en un commit) |
| `src/components/owner/owner-header.tsx` | Header minimal : logo, Accueil, recherche (⌘K, réutilise `AdminSearch`), thème, déconnexion |
| `src/app/owner/layout.tsx` | Layout du shell propriétaire (même garde de session que l'admin) |
| `src/app/owner/page.tsx` | Accueil tuiles (« Bonjour {prénom} — Que souhaitez-vous faire aujourd'hui ? ») |
| `src/app/owner/caisse/page.tsx` | Hub Caisse : Ajouter une dépense (action principale), Toutes les dépenses, Reçus d'aujourd'hui, Toutes les factures + encart « la facture est générée automatiquement avec la commande » |
| `src/app/admin/layout-client.tsx` | Ancien contenu du layout admin, paramétré par `shell: 'owner' \| 'full'` |

## Fichiers modifiés

- `src/middleware.ts` : suppression du redirect 301 `crm.` → `cechemoi.com/auth/admin`, remplacé par les rewrites host-based ci-dessus.
- `src/app/admin/layout.tsx` : devenu server component qui lit `headers().host` et choisit le shell.

## Tuiles v1 (6, toutes activées — validées par le CEO comme quotidien de la propriétaire)

1. **Clients** → `/admin/customers`
2. **Commandes** (sur mesure, « la facture est créée automatiquement ») → `/admin/custom-orders`
3. **Stock matériels** → `/admin/materials`
4. **Caisse** → `/owner/caisse` (hub simplifié)
5. **Rapports** → `/admin/reports`
6. **Anniversaires** → `/admin/notifications/birthdays`

## Vérification

- `npx tsc --noEmit` : aucun diagnostic.
- Aucun conflit de route (`src/app/owner` était libre).

## Actions hors code (CEO)

1. **Easypanel** : supprimer la redirection crm.cechemoi.com → cechemoi.com/admin et pointer le domaine crm.cechemoi.com directement sur le service Next.js (même service, pas de nouveau déploiement).
2. **Cache 301** : l'ancien redirect était un 301 permanent — le navigateur de la propriétaire peut l'avoir mis en cache. Si crm.cechemoi.com redirige encore chez elle après la mise en prod, vider le cache du navigateur (ou navigation privée une fois).

## Suites possibles

- Compteurs sur les tuiles (« 3 rendez-vous aujourd'hui ») via petites APIs de comptage.
- Brancher les tuiles sur le registre (`ownerTile: true` dans `registry.ts`) pour une source de vérité unique.
- Activer de nouvelles tuiles à la demande de la propriétaire (rendez-vous, campagnes…).
