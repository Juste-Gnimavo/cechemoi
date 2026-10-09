---
status: shipped
session_id: 26-10-09-001-35-role-gestionnaire-boutique-en-ligne
session_log: SESSIONS-LOGS/26-10-09-001-35-role-gestionnaire-boutique-en-ligne.md
drafted_at: 2026-10-08
next_after: 34
---

# Session 35 — Rôle « Gestionnaire boutique en ligne »

> **Status : QUEUED.** Rédigé à la clôture de la session 34 (synchronisation commande ↔ facture, commit `911482f`).
>
> **Goal.** Un nouveau rôle d'équipe qui n'accède qu'à la boutique en ligne : le hub `/owner/boutique` et les écrans `/admin/*` vers lesquels ses tuiles pointent, rien d'autre (ni atelier, ni clients hors commandes, ni caisse, ni rapports, ni équipe).
>
> **Why now.** La propriétaire veut confier le site cechemoi.com à une personne dédiée. Aujourd'hui le seul rôle possible est « Personnel », qui ouvre tout l'opérationnel : atelier, clients, factures, dépenses.

**Project root.** `/Users/juste/Desktop/DOSSIER-BUREAU/PROJETS-ENCOURS/0-CECHEMOI-COM`
**Branch.** `main` (push = déploiement Easypanel ; vérifier qu'un build part, sinon webhook manuel — voir session 34).
**Session log target.** `SESSIONS-LOGS/35-ROLE-GESTIONNAIRE-BOUTIQUE-EN-LIGNE.md`.
**Expected size.** Demi-journée. **Changement de schéma** : nouvelle valeur d'enum `UserRole`. Pas de migration versionnée : le projet applique le schéma par `npx -y prisma@5.22.0 db push` depuis le conteneur (version épinglée obligatoire, cf. NEXT-STEP).

---

## CONTEXTE

- **Matrice de droits unifiée** (session 31) : `src/lib/role-permissions.ts` est la source de vérité unique. `ROLE_PERMISSIONS: Record<UserRole, Permission[] | '*'>` ; les routes API lisent `denyUnlessPermitted`, les pages `requirePagePermission`. Ajouter une valeur à l'enum fera échouer le typage partout où un `Record<UserRole, …>` est exhaustif : c'est voulu, chaque erreur est un endroit à décider.
- **Hub Boutique** (session 32) : `src/app/owner/boutique/page.tsx` — 10 tuiles vers `/admin/orders/new` (vente au comptoir), `/admin/products/new`, `/admin/inventory/adjust`, `/admin/products`, `/admin/orders`, `/admin/categories`, `/admin/media`, `/admin/storefront`, `/admin/reviews`, `/admin/coupons`.
- **Accueil `/owner`** : tuiles filtrées par rôle via `getEnabledTiles` (`src/lib/owner/tiles.ts`). `src/middleware.ts` réécrit les hôtes gestion vers `/owner` et `/admin/*`.
- **Équipe** : le sélecteur de rôle (`src/app/admin/team/page.tsx`) ne propose que Personnel / Manager / Administrateur ; `src/app/api/admin/team/route.ts` filtre et valide sur `['ADMIN','MANAGER','STAFF']` en dur (lignes ~25 et ~96), de même `team/[id]`. Création et modification de comptes réservées à `role === 'ADMIN'`.
- **Une vingtaine de fichiers** testent encore `'STAFF'` / `'TAILOR'` en dur (auth admin, 2FA, reset mot de passe, team, tailors, production, staff-performance…). Chacun doit être relu : un rôle oublié dans l'un d'eux = connexion impossible ou fuite.
- **Règle CEO permanente** : un rôle non-direction ne voit jamais la trésorerie ni la masse salariale (`finance.*`, `reports.financial`, `analytics`, `sales`).

---

## FICHIERS DE RÉFÉRENCE

1. `src/lib/role-permissions.ts` — matrice, libellés et couleurs de badge, `canAccessAdmin`.
2. `src/lib/api-permissions.ts`, `src/lib/page-permissions.tsx` — gardes API et pages.
3. `src/lib/owner/tiles.ts`, `src/app/owner/page.tsx`, `src/app/owner/layout.tsx`, `src/app/owner/boutique/page.tsx`.
4. `src/app/admin/team/page.tsx`, `src/app/api/admin/team/route.ts`, `src/app/api/admin/team/[id]/route.ts`.
5. Layout et navigation `/admin` (barre latérale, palette de recherche) : ce qui s'affiche pour un rôle sans permission.
6. `SESSIONS-LOGS/31-MATRICE-DROITS-ET-ETANCHEITE-FINANCIERE.md` — méthode d'audit des 232 gardes.

---

## DÉCISIONS DU CEO (09/10/2026) — tranchées, ne pas les rouvrir

Le CEO a précisé le métier : le gestionnaire **met à jour la boutique** — tenues, catégories, stock, photos, bandeau, avis, commandes du site et vente au comptoir. Il accède **directement** à `/owner/boutique` et à ses sous-écrans, à rien d'autre.

1. **Vente au comptoir** (`orders.create`) : **incluse**.
2. **Clientes** : **pas** de permission `customers` (ni annuaire, ni fiche, ni mensurations, ni valeur client, ni export). La vente au comptoir passe par une recherche dédiée (voir MUST HAVE 3 bis).
3. **Codes promo** : **`coupons` + `coupons.manage`** — le gestionnaire crée et gère les codes.
4. **Hors périmètre, explicitement** : commandes sur mesure (atelier), factures, reçus, caisse, dépenses, salaires, rapports, clients, stock matériels, personnel, messages, anniversaires. Une proposition antérieure « STAFF moins la caisse » a été **rejetée** par le CEO : le gestionnaire irait créer des commandes dans l'atelier.

---

## SCOPE

### MUST HAVE

1. **Enum** : `UserRole.ECOMMERCE` dans `prisma/schema.prisma` ; libellé « Gestionnaire boutique en ligne », couleur de badge propre.
2. **Matrice** : `ECOMMERCE` = `orders`, `orders.create`, `products`, `products.manage`, `categories`, `categories.manage`, `inventory`, `inventory.adjust`, `coupons`, `coupons.manage`, `media`, `reviews.moderate`, `storefront`, `storefront.manage`. **Aucune** permission `finance.*`, `reports.*`, `analytics`, `sales`, `team*`, `customers*`, `custom-orders`, `production`, `invoices*`, `receipts`, `materials*`, `appointments*`, `campaigns*`, `notifications*`, `blog*`, `shipping`, `orders.refund`, aucune suppression définitive.
3. **Accueil** : un `ECOMMERCE` qui arrive sur `/owner` est **redirigé** vers `/owner/boutique` (le CEO veut un accès direct, pas un accueil à une tuile) ; le hub n'affiche que les tuiles autorisées ; le lien « Retour à l'accueil » ne doit pas créer de boucle.
3 bis. **Vente au comptoir sans l'annuaire** (constaté le 09/10 en lisant `src/app/admin/orders/new/page.tsx`) : l'écran appelle `GET /api/admin/customers?search=` et `GET /api/admin/customers/[id]` (gardés par `customers`), `GET /api/admin/shipping/methods` (gardé par `shipping`) et `POST /api/admin/coupons/validate` (gardé par `coupons`). Créer une route de recherche dédiée gardée par `orders.create`, qui ne renvoie que l'identifiant, le nom, le téléphone et les adresses de la cliente, et y brancher l'écran ; ouvrir la **lecture** des modes de livraison à `orders.create`. Ne pas donner `customers` au rôle. Vérifier au passage que la vente au comptoir de `STAFF` (qui n'a pas `shipping`) fonctionne, et la réparer de la même façon sinon.
4. **Navigation `/admin`** : barre latérale et palette de recherche n'exposent que les écrans autorisés ; une URL tapée à la main hors périmètre renvoie la page d'accès refusé, et l'API un 403.
5. **Équipe** : option « Gestionnaire boutique en ligne » dans le sélecteur ; listes et validations de `team/route.ts` et `team/[id]/route.ts` passent par une constante partagée des rôles d'équipe au lieu de tableaux en dur.
6. **Audit des tests de rôle en dur** : relire chaque occurrence de `'STAFF'` / `'TAILOR'` hors matrice ; décider pour `ECOMMERCE` (connexion admin, 2FA, reset mot de passe doivent l'accepter). Consigner la liste dans le journal.
7. **Schéma en production** : `npx -y prisma@5.22.0 db push` depuis le conteneur après déploiement, avant de créer le compte.

### SHOULD HAVE

- Mettre à jour le guide Boutique (`doc-web/guides-utilisateurs/content-boutique.js`) : section « Votre accès » pour ce rôle.

### DEFER

- Restreindre le gestionnaire aux seules commandes du site (exclure les ventes au comptoir de la liste) : à rediscuter si la propriétaire le demande.

---

## VALIDATION (obligatoire avant de clore)

- `npx tsc --noEmit` vert.
- En production, avec un compte `ECOMMERCE` **de test** créé depuis `/admin/team` (le désactiver en fin de session ; le compte réel du gestionnaire ne sera créé par le CEO qu'après le déploiement de la session 36, qui expurge les cumuls d'argent restants) : les 10 tuiles du hub fonctionnent (création de tenue, stock, commande comptoir **jusqu'au bout, cliente retrouvée et code promo appliqué**, avis, bandeau, codes promo…) ; `/owner/caisse`, `/owner/rapports`, `/admin/custom-orders`, `/admin/invoices`, `/admin/customers`, `/admin/team`, `/admin/expenses` sont refusés à l'écran **et** en API (`curl` avec le cookie de session : 403).
- Journal de session écrit, `casp/state.json` et `SESSIONS-LOGS/NEXT-STEP.md` mis à jour, `casp check` vert.

---

## Rappels de discipline (CLAUDE.md global §19-21)

Lire par plage (`grep -n` puis `sed -n`), éditer chirurgicalement, borner toute sortie de commande à ~20 lignes (`> /tmp/out.log 2>&1; echo "exit=$?"`). Accès base : `ssh zerosuite` puis `docker exec` dans `cechemoi_postgres` (Postgres non exposé, et ne doit pas l'être).
