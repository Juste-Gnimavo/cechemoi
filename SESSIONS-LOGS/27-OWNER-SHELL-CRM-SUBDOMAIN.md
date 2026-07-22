# Session 27 — Shell propriétaire sur gestion.cechemoi.com

**Date** : 2026-07-22
**Objectif** : Créer une interface propriétaire aérée (grille de tuiles + hubs intermédiaires) sur un sous-domaine dédié, sans toucher à l'admin complet existant sur cechemoi.com/admin.
**Statut** : Déployé et validé en production sur gestion.cechemoi.com.

---

## Contexte

L'admin compte 81 liens / ~108 entrées de menu (`src/lib/admin-search/registry.ts`). La propriétaire ne s'y retrouve pas malgré la barre de recherche ⌘K et appelle le CEO à chaque action. Décision : la recherche est une UX de rappel, la propriétaire fonctionne par reconnaissance → grille de tuiles style launcher, activation progressive des tuiles à la demande (via WhatsApp → commit d'une ligne).

Problème métier identifié : elle crée des factures directement puis revient créer la commande, alors que le flow commande génère la facture automatiquement. Le shell la guide vers « Commandes » et les hubs Caisse/Commandes contiennent un rappel explicite.

## Architecture

**Un seul déploiement Next.js, deux shells selon le host** (`src/lib/owner/host.ts` : sous-domaines `gestion` et `crm`) :

- `cechemoi.com` → boutique + `/admin` complet, strictement inchangés.
- `gestion.cechemoi.com` (et alias `crm.`) → shell propriétaire via rewrites middleware :
  - `/` → accueil tuiles (`/owner`)
  - `/admin` exact → redirect vers `/` (la page de login 2FA renvoie en dur vers `/admin`)
  - `/owner/*`, `/admin/*`, `/auth/*`, `/api/*`, fichiers statiques → passent tels quels
  - tout autre chemin → alias `/admin/*` (ex. `gestion.cechemoi.com/customers`)
- Sur un host owner, `src/app/admin/layout.tsx` (server component, lit `headers().host`) remplace le header dense par `OwnerHeader` et masque la bottom bar (`src/app/admin/layout-client.tsx`, prop `shell`).

**Pourquoi `gestion.` en principal** : l'ancien redirect crm → cechemoi.com était un 301 permanent, potentiellement en cache dans les navigateurs. Un sous-domaine vierge garantit un premier chargement propre. Vérifié en prod : premier essai OK.

## Navigation propriétaire (état de fin de session)

Accueil (`/owner`) → 6 tuiles (`src/lib/owner/tiles.ts`, flag `enabled` par tuile) :

1. **Clients** → hub `/owner/clients` : Ajouter un client (principale), Tous les clients, Envoyer un WhatsApp, Envoyer un SMS
2. **Commandes** → hub `/owner/commandes` : Nouvelle commande (principale, « facture générée automatiquement »), Toutes les commandes, Fiche de suivi confection, Commandes boutique + encart anti-confusion facture
3. **Stock matériels** → hub `/owner/stock` : Sortie de stock (principale), Entrée de stock, Tous les matériels, Nouveau matériel, Mouvements
4. **Caisse** → hub `/owner/caisse` : Ajouter une dépense (principale), Toutes les dépenses, Reçus d'aujourd'hui, Toutes les factures + encart anti-confusion facture
5. **Rapports** → hub `/owner/rapports` : 7 cartes, une par famille comptable, deep links `?tab=` (déjà supportés par la page reports) ; pas de carte principale (consultation, pas d'action dominante)
6. **Anniversaires** → lien direct `/admin/notifications/birthdays` (2 onglets clairs, un hub serait un clic inutile)

Les hubs partagent le composant `src/components/owner/owner-hub.tsx` (action principale pleine largeur + cartes secondaires + encart optionnel).

**Mobile** : grille 2 colonnes compacte sur iPhone (3 colonnes desktop pour l'accueil), icônes/paddings/typo réduits, logo header 40px. La propriétaire utilise surtout iPhone/iPad.

## Authentification

- **Bug corrigé** : les gardes admin et owner redirigeaient les non-connectés vers `/auth/login` (= login client par téléphone). Corrigé vers `/auth/admin`. Bug préexistant, jamais visible car les admins étaient toujours déjà connectés.
- **OTP admin désactivé** : la page `/auth/admin` forçait le flow OTP SMS pour tous (gateway peu fiable → admins bloqués dehors). Elle utilise maintenant le provider `credentials` (session directe email + mot de passe). Le flow OTP est conservé en fallback uniquement pour les comptes avec `twoFactorEnabled = true` en base — le 2FA devient opt-in par compte. **Si un second facteur est souhaité plus tard : TOTP (Google Authenticator), jamais le gateway SMS.**
- Cookie NextAuth host-only, aucun changement : la propriétaire se connecte directement sur gestion.cechemoi.com.

## Commits de la session

| Commit | Contenu |
|--------|---------|
| `7033b12` | Shell owner : middleware rewrites, tuiles, hub Caisse, header minimal, layout admin host-aware |
| `4a3a9b3` | Fix redirections auth (`/auth/admin`) + redirect `/admin` exact → tuiles sur host owner |
| `647e927` | Sous-domaine `gestion.` en principal, `crm.` en alias (`src/lib/owner/host.ts`) |
| `d1c3fba` | Hubs Clients, Commandes, Stock + composant partagé `OwnerHub` |
| `2739a08` | Hub Rapports (deep links `?tab=`) |
| `ca604ad` | Connexion admin directe sans OTP forcé (fallback 2FA par compte) |
| `414caa5` | Layout mobile compact (grille 2 colonnes, tailles réduites) |

## Infra (fait par le CEO en cours de session)

- Redirection Easypanel crm → cechemoi.com/admin supprimée.
- `gestion.cechemoi.com` ajouté (DNS + domaine Easypanel sur le même service Next.js). Validé en prod.

## Workflow d'évolution convenu

La propriétaire remonte ses besoins au CEO sur WhatsApp → le CEO revient en session → on active/ajoute une tuile ou une carte de hub (`src/lib/owner/tiles.ts` ou la page hub concernée). Ne jamais tout exposer d'un coup : le strict minimum, à la demande.

## Reste à faire / points ouverts

- Vérifier qu'aucun compte admin n'a `twoFactorEnabled = true` en base (sinon ce compte reçoit encore un OTP).
- Audit responsive des formulaires métier les plus utilisés sur iPhone (nouvelle dépense, nouveau client, nouvelle commande) — le shell est mobile-friendly, les pages `/admin/*` derrière n'ont pas été auditées écran par écran.
- Compteurs sur les tuiles (« 3 rendez-vous aujourd'hui ») via petites APIs de comptage.
- Éventuel branchement des tuiles sur `registry.ts` (flag `ownerTile`) pour une source de vérité unique.
- Fichiers de la session 26 toujours non commités (package.json, scripts/md-to-html.mjs, doc-web/*, RECRUTEMENT/, log 26).
