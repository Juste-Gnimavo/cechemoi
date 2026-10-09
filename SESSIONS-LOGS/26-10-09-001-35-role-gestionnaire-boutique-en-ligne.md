---
phase: 35-role-gestionnaire-boutique-en-ligne
---

# 26-10-09-001 — Session 35 : rôle « Gestionnaire boutique en ligne » (ECOMMERCE)

**Session prompt :** `docs/plan/sessions/35-ROLE-GESTIONNAIRE-BOUTIQUE-EN-LIGNE.md`.
**Previous session end :** `3579cf5` (arbitrage solo de la phase 35).
**Delegation :** exécutée en ligne, session autonome de chaîne (arbitrage solo : base de prod unique, déploiement par push sur `main`, un seul arbre `tsc`).
**State at session start :** arbre propre, cockpit casp 0.19.0 à jour, prompt 35 `queued` avec les décisions CEO du 09/10/2026.

**Commits :** `6a06ceb` (implémentation), `138aed3` (route de recherche en rendu dynamique).

## Scope shipped this session

### MUST 1 — Enum et libellés

- `prisma/schema.prisma` : `UserRole.ECOMMERCE`.
- `src/lib/role-permissions.ts` : libellé « Gestionnaire boutique en ligne », badge ambre.

### MUST 2 — Matrice

`ECOMMERCE` = `account`, `orders`, `orders.create`, `products`, `products.manage`, `categories`, `categories.manage`, `inventory`, `inventory.adjust`, `coupons`, `coupons.manage`, `media`, `reviews.moderate`, `storefront`, `storefront.manage`. Ni `dashboard`, ni `finance.*`, `reports.*`, `analytics`, `sales`, `team*`, `customers*`, atelier, factures, reçus, matériels, rendez-vous, campagnes, notifications, blog, `shipping`, `orders.refund`, ni aucune suppression.

**Nouvelle permission `account`** (profil, sécurité, 2FA). Ces six routes (`/api/admin/profile`, `/api/admin/account/security`, `/api/admin/account/2fa/{enable,disable,backup-codes}`) étaient gardées par `dashboard`. Donner `dashboard` au gestionnaire aurait ouvert le tableau de bord et ses cumuls d'argent ; le lui refuser l'empêchait de gérer son propre mot de passe. `account` est accordée à STAFF, TAILOR et ECOMMERCE. ADMIN et MANAGER l'ont via `'*'`.

### Garde d'URL unique — `src/lib/route-permissions.ts` (NEW)

Une table chemin → permission, qui reprend la permission de la route API de lecture de chaque écran, couvre les 32 sections `/admin/*` et les 7 hubs `/owner/*`. Le préfixe le plus long l'emporte. Un chemin `/admin` ou `/owner` non déclaré est **refusé** aux rôles à liste explicite : une nouvelle section doit être déclarée pour leur devenir visible. `canAccessPath(role, path)` sert à :

- `src/app/admin/layout-client.tsx` et `src/app/owner/layout.tsx` : page « Accès refusé » (`src/components/admin/access-denied.tsx`, NEW) pour toute URL tapée hors périmètre. Le chemin réécrit par le middleware (`/customers` → `/admin/customers` sur gestion.cechemoi.com) est normalisé avant le test ;
- `getEnabledTiles` (accueil `/owner`) ;
- `filterMenuByRole` et la palette de recherche (`registry.ts`, `search.ts`) ;
- la barre mobile `/admin` (`admin-bottom-bar.tsx`) : liens et actions rapides filtrés, bouton « + » masqué s'il n'y a aucune action.

Mesuré (script tsx jetable sur `canAccessPath`) :

| Rôle | Écrans ouverts parmi l'échantillon |
|---|---|
| ECOMMERCE | `/owner/boutique`, `/admin/orders/new`, `/admin/products/new`, `/admin/inventory/adjust`, `/admin/coupons`, `/admin/media`, `/admin/storefront`, `/admin/reviews`, `/admin/account/security` |
| STAFF | inchangé, hormis `/admin/sales/*`, désormais refusé (écran déjà refusé par son layout, et règle CEO sur l'argent) |
| TAILOR | `/admin`, `/admin/custom-orders`, `/admin/tailors`, `/admin/account/security` |

Refusés à ECOMMERCE : `/owner/caisse`, `/owner/rapports`, `/owner/clients`, `/admin`, `/admin/custom-orders`, `/admin/invoices`, `/admin/customers`, `/admin/team`, `/admin/expenses`. Côté API, chacune de ces routes est gardée par une permission absente de la matrice ECOMMERCE, donc 403.

### MUST 3 — Accueil direct

- `getRoleHome(role)` renvoie `/owner/boutique` pour ECOMMERCE. `/owner` et `/admin` le redirigent (`router.replace`) vers son hub. Pendant la redirection rien n'est rendu, donc pas de flash d'« Accès refusé ».
- Pas de boucle : `/owner/boutique` ne redirige jamais. Le lien « Retour à l'accueil » du hub est masqué quand le hub est l'accueil du rôle ; le logo et « Accueil » de l'en-tête pointent vers l'accueil du rôle.
- La tuile « Vendre au comptoir » porte désormais `orders.create`.

### MUST 3 bis — Vente au comptoir sans l'annuaire

- `GET /api/admin/orders/customer-search` (NEW), gardée par `orders.create`. `?search=` cherche sur le nom ou le téléphone (2 caractères minimum, 10 résultats au plus) ; `?id=` sert le préremplissage par l'URL. La route ne renvoie que l'identifiant, le nom, le téléphone et les adresses. Pas de recherche par email, pour ne pas révéler l'existence d'un compte par ce biais.
- `src/app/admin/orders/new/page.tsx` passe par cette route pour tout le monde, et la double requête recherche + fiche est supprimée (la recherche renvoie déjà les adresses).
- `GET /api/admin/shipping/methods` : lecture ouverte à `orders.create`, l'écriture reste réservée à `shipping`. **Bug constaté et réparé pour le Personnel** : STAFF n'a pas `shipping`, donc sa vente au comptoir chargeait une liste de livraisons vide, sans aucun message d'erreur.
- `POST /api/admin/coupons/validate` (`coupons`) et `POST /api/admin/orders` (`orders.create`) étaient déjà couverts.

### MUST 4 — Navigation `/admin`

Couverte par la garde d'URL : `ECOMMERCE` ajouté aux groupes Boutique du registre (Boutique, Commandes, Produits, Stock et Prix, Médias, Vitrine), ainsi qu'aux entrées de recherche codes promo, mouvements de stock, avis et sécurité du compte. Un second filtre `canAccessPath` retire ce que la matrice refuse : par exemple, `/admin/tags` (étiquettes clients) disparaît du groupe Produits pour ECOMMERCE.

### MUST 5 — Équipe

- `TEAM_ROLES` / `isTeamRole` / `TeamRole` / `TEAM_ROLE_OPTIONS` dans `role-permissions.ts`.
- `team/route.ts`, `team/[id]/route.ts`, `team/[id]/activity/route.ts` passent par la constante. Le sélecteur de `/admin/team` est généré depuis `TEAM_ROLE_OPTIONS` (Personnel, Gestionnaire boutique en ligne, Manager, Administrateur). Libellés et badges ajoutés dans `team/page.tsx`, `team/[id]/page.tsx` et `staff-performance/page.tsx`.

### MUST 6 — Audit des rôles codés en dur (86 occurrences, 27 fichiers)

| Fichier | Décision |
|---|---|
| `src/lib/auth-phone.ts` (connexion email, désactivation), `src/lib/auth.ts` | `TEAM_ROLES` / `isTeamRole` : ECOMMERCE peut se connecter, et un compte désactivé perd son rôle. |
| `api/auth/admin-2fa/send` (×2), `forgot-password`, `reset-password` (×2), `register` | `TEAM_ROLES` |
| `api/admin/team/*` (×6) | `TEAM_ROLES` / `isTeamRole` |
| `api/upload` (GET) | `isTeamRole`. Le POST n'exige qu'une session (préexistant, voir risques). |
| `api/admin/campaigns/push` (recherche de l'expéditeur), `api/admin/staff-performance` | `TEAM_ROLES` |
| `app/auth/admin/page.tsx` (×2), `components/user-profile-card.tsx` | ECOMMERCE ajouté à la liste qui inclut TAILOR. |
| `api/admin/custom-orders/[id]/items` | Inchangé : l'exclusion d'ECOMMERCE est voulue (atelier). |
| `api/admin/custom-orders/audit` | Inchangé : liste des auteurs de commandes sur mesure, ECOMMERCE n'en crée pas. |
| `api/admin/tailors/*`, `materials/movements`, `production` | Inchangés : tests `role: 'TAILOR'` sur la personne visée, pas sur l'appelant. |
| `app/admin/page.tsx` (`isTailor`, défaut STAFF) | Inchangé : ECOMMERCE n'atteint jamais le tableau de bord. |
| `materials/reports/page.tsx` | Inchangé : libellé d'affichage seulement. |
| `admin-search/registry.ts` (26), `admin-bottom-bar.tsx` (7), `admin/team/page.tsx` (8) | Traités en MUST 4 et 5. |

### MUST 7 — Schéma en production

- `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ECOMMERCE'` exécuté dans `cechemoi_postgres` **avant** le push. Après : `{CUSTOMER,ADMIN,MANAGER,STAFF,TAILOR,ECOMMERCE}`.
- Pourquoi cet ordre, et non « db push après déploiement » comme le disait le prompt : le nouveau client Prisma envoie `role IN (…, 'ECOMMERCE')` dès la connexion admin. Si la valeur n'existe pas encore en base, Postgres rejette la requête et plus personne ne peut se connecter entre le déploiement et le `db push`. L'ajout d'une valeur d'enum est additif et sans effet sur le code actuel. C'est exactement la seule instruction que `db push` aurait générée pour ce diff.
- Le `npx -y prisma@5.22.0 db push` de confirmation depuis le conteneur reste à faire après le déploiement, et doit répondre « already in sync » (voir Deferred).

### SHOULD — Guide Boutique

`doc-web/guides-utilisateurs/content-boutique.js` : note « Votre accès — Gestionnaire boutique en ligne ». Le `.docx` n'a pas été régénéré.

## Décisions prises sans le CEO (niveau 2)

1. **Garde d'URL côté client, dans les layouts**, plutôt que dans le middleware : le middleware tourne en edge et importerait la matrice et `@prisma/client`. Les API restent la frontière de sécurité, conformément à la doctrine de `page-permissions.tsx`.
2. **Refus par défaut** des chemins `/admin` et `/owner` non déclarés, pour tout rôle à liste explicite. Les 32 sections existantes sont toutes déclarées.
3. **Permission `account`** plutôt que `dashboard` pour le profil et la 2FA.
4. **Tuiles et menus de TAILOR** : il ne voit plus les tuiles Clients, Boutique, Stock, Messages et Anniversaires, ni les liens Clients et Caisse de la barre mobile. Toutes menaient à des 403. Il conserve exactement les écrans dont ses API lui répondent.
5. **Ventes (`/admin/sales/*`) retirées de la palette du Personnel** par le filtre `canAccessPath` : elles y étaient listées alors que le layout les lui refusait déjà.
6. **Écran de vente au comptoir unique** pour tous les rôles, via la recherche dédiée. L'email et la ville de la cliente ne s'y affichent donc plus, pour personne (spécification : identifiant, nom, téléphone, adresses).
7. **Journal unique** au nom CASP (`26-10-09-001-…`) dans `SESSIONS-LOGS/`, au lieu du nom `35-ROLE-…` prévu par le prompt : `casp new log` écrit dans `SESSIONS-LOGS/`, et deux fichiers pour un même journal auraient dérivé.
8. **Enum ajouté par SQL avant le push** (voir MUST 7).

## Deferred / risques (niveau 1)

1. **Déploiement non déclenché.** Les pushes de `6a06ceb` et `138aed3` n'ont lancé aucun build : l'image `easypanel/cechemoi/cechemoi` date du 08/10 à 19:28 UTC, après environ 8 minutes de scrutation à chaque fois. Le dépôt GitHub n'a aucun webhook, et les journaux Easypanel ne montrent aucun événement. La relance passe par l'interface Easypanel (onglet Deployments du service), à laquelle la session n'a pas accès. **Action CEO : relancer le déploiement depuis Easypanel.** Le build de production local est vert (`next build` exit 0).
2. **`db push` de confirmation** (`npx -y prisma@5.22.0 db push` depuis le conteneur), à lancer après le déploiement. Attendu : aucun changement.
3. **Validation en production avec un compte ECOMMERCE de test : non faite.** Elle exige le déploiement, puis une connexion administrateur (email, mot de passe, et éventuellement 2FA) pour créer le compte depuis `/admin/team`. La session n'a pas ces identifiants, et créer le compte par SQL contournerait le chemin à valider. Checklist à jouer : les 10 tuiles du hub, une vente au comptoir menée jusqu'au bout (cliente retrouvée, code promo appliqué), puis les refus à l'écran et en `curl` avec le cookie (403 attendu) sur `/owner/caisse`, `/owner/rapports`, `/admin/custom-orders`, `/admin/invoices`, `/admin/customers`, `/admin/team` et `/admin/expenses`. Désactiver le compte de test ensuite.
4. **Compte réel du gestionnaire** : seulement après le déploiement de la session 36 (décision CEO), qui expurge les cumuls d'argent restants. En particulier `/api/admin/inventory/overview` et les totaux de `/admin/orders`, que le gestionnaire lit avec `inventory` et `orders`.
5. **Préexistant, hors périmètre :** `POST /api/upload` n'exige qu'une session, n'importe quelle session, y compris celle d'une cliente. `GET /api/admin/tax`, appelé par le formulaire de tenue, n'existe pas (404 silencieux, seules `tax/classes` et `tax/rates` existent). À traiter dans une session de durcissement.

## Files touched

| File | Change |
|------|--------|
| `prisma/schema.prisma` | `UserRole.ECOMMERCE`. |
| `src/lib/role-permissions.ts` | Matrice ECOMMERCE, permission `account`, `TEAM_ROLES`, `isTeamRole`, `TEAM_ROLE_OPTIONS`, `getRoleHome`, libellé et badge. |
| `src/lib/route-permissions.ts` | NEW : carte chemin → permission, `canAccessPath`. |
| `src/components/admin/access-denied.tsx` | NEW : page « Accès refusé ». |
| `src/app/api/admin/orders/customer-search/route.ts` | NEW : recherche de cliente du comptoir. |
| `src/app/admin/layout-client.tsx`, `src/app/owner/layout.tsx` | Garde d'URL, redirection vers l'accueil du rôle. |
| `src/lib/owner/tiles.ts`, `src/components/owner/owner-hub.tsx`, `src/components/owner/owner-header.tsx`, `src/app/owner/boutique/page.tsx` | Tuiles filtrées, retour sans boucle, permission de la vente au comptoir. |
| `src/lib/admin-search/registry.ts`, `src/lib/admin-search/search.ts`, `src/components/admin-bottom-bar.tsx` | Navigation filtrée par la matrice. |
| `src/app/admin/orders/new/page.tsx`, `src/app/api/admin/shipping/methods/route.ts` | Vente au comptoir sans l'annuaire, livraisons lisibles avec `orders.create`. |
| `src/app/admin/team/page.tsx`, `src/app/admin/team/[id]/page.tsx`, `src/app/admin/staff-performance/page.tsx` | Option et libellés du rôle. |
| 6 routes `profile` / `account/*` | `dashboard` → `account`. |
| 12 routes ou bibliothèques auth, équipe, upload, push, performance | `TEAM_ROLES` / `isTeamRole`. |
| `src/app/auth/admin/page.tsx`, `src/components/user-profile-card.tsx` | ECOMMERCE accepté. |
| `doc-web/guides-utilisateurs/content-boutique.js` | Section « Votre accès ». |
| `docs/plan/sessions/35-…md` | `queued` → `shipped`. |
| `docs/plan/sessions/36-…md` | Contexte : préalables de déploiement hérités de la 35. |
| `SESSIONS-LOGS/NEXT-STEP.md`, `casp/state.json`, `casp/now.md` | Mis à jour. |

## Verify

- `npx tsc --noEmit` : exit 0 (après chaque lot de modifications, et après le correctif `138aed3`).
- `npx next build` (local) : exit 0.
- `canAccessPath` exercé par rôle (tableau ci-dessus).
- Enum de production relu après `ALTER TYPE`.
- `casp close --yes` : voir la clôture.
- **Non vérifié : la production** (Deferred 1 à 3).
