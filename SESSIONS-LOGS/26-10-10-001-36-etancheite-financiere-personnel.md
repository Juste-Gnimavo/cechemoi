---
phase: 36-etancheite-financiere-personnel
---

# 26-10-10-001 — Session 36 : étanchéité financière du Personnel

**Session prompt :** `docs/plan/sessions/36-ETANCHEITE-FINANCIERE-PERSONNEL.md`.
**Previous session end :** `0590c96` (arbitrage solo de la phase 36, session `cto-36`).
**Delegation :** exécutée en ligne. Arbitrage solo : base Postgres de prod unique, push sur `main` = déploiement Easypanel, tous les MUST passent par `role-permissions.ts`.
**State at session start :** arbre propre, aligné sur `origin/main`, cockpit casp 0.19.0 à jour. Affirmations du prompt rejouées dans le code : toutes exactes (`finance.revenue` aux lignes citées, `category` non validée dans `POST /api/upload`, `role !== 'ADMIN'` en dur dans le DELETE des paiements de facture).

**Commits :** `7d7c1fb` (upload), `65e030e` (anniversaires, paiement de facture), `8ce725d` (cumuls et boutons Supprimer), `a220562` (guides).

**Préalable hérité de la 35 : déjà levé.** `SESSIONS-LOGS/NEXT-STEP.md` consigne le déploiement relancé à la main et le `db push` « already in sync » du 09/10/2026. Le prompt 36, rédigé avant, ne le savait pas. Non re-constaté d'ici (pas d'accès au conteneur ; base de prod injoignable depuis le poste, port 5432 fermé). Reste ouvert de la 35 : la checklist du compte ECOMMERCE de test.

## Scope shipped this session

### MUST 1 — Cumuls d'argent expurgés côté API (`finance.revenue`)

Le modèle de la session 31 (`invoices/stats`) renvoyait `0` : l'écran affichait alors « 0 F », exactement ce que le prompt interdit. **Convention retenue partout : `null` côté API, la carte est masquée côté écran.** `invoices/stats` a été aligné sur cette convention.

| Écran | Route | Expurgé sans `finance.revenue` | Reste visible |
|---|---|---|---|
| `/admin/custom-orders` | `custom-orders/stats` | Année, Toute la période (non calculés) | Aujourd'hui, 30 derniers jours |
| `/admin/receipts` | `receipts` (GET) | Cette année, Toute la période (non calculés) | Aujourd'hui, Ce mois, montant de chaque reçu |
| `/admin/invoices` | `invoices/stats` | Facturé, Encaissé, **Reste dû**, overdue/pending, panier moyen | compteurs par statut |
| `/admin/materials` | `materials` (GET) | Valeur totale du stock | prix unitaire (sert à saisir les mouvements) |
| `/admin/materials/movements` | `materials/movements` | Valeur totale | coût de chaque mouvement |
| `/admin/materials/reports` + tuile du tableau de bord | `materials/reports` | tous les `totalCost` agrégés, `totalStockValue` | quantités, compteurs |
| `/admin/inventory` (STAFF **et** ECOMMERCE) | `inventory/overview` | valeur du stock globale et par catégorie | unités en stock |
| `/admin/customers` | `customers` (GET) | colonnes Valeur totale, Panier moyen (`revenueVisible: false`) | nombre de commandes |
| fiche cliente | `customers/[id]` | Valeur vie client, Panier moyen, montants de `monthlySpending` | montant de chaque commande et facture |
| (aucun écran) | `customers/stats` | `totalLifetimeValue`, `averageCustomerValue`, `lifetimeValue` du top 10 | compteurs de segments |

Hors liste du prompt mais même famille, traités : `materials/reports` (et la tuile « Valeur stock » de `/admin`), `inventory/overview` (lu par ECOMMERCE, signalé par le prompt), `customers/stats`.

Liste des commandes du site (`orders`, lue par ECOMMERCE) : vérifiée, les stats ne sont que des compteurs. Rien à expurger.

### MUST 2 — Boutons « Supprimer » alignés sur le serveur

Nouveau hook `src/hooks/useCan.ts` : `useCan(permission)` (même règle `hasPermission` que l'API) et `useIsAdmin()` pour les routes qui testent encore `role === 'ADMIN'` en dur. L'API reste la seule garde ; le hook n'évite que le clic suivi d'un 403.

Audit exhaustif : tous les écrans de `src/app/admin` qui appellent DELETE, croisés avec la garde de la route et la garde d'URL (`route-permissions.ts`). 23 écrans corrigés :

| Écran | Garde serveur | STAFF | ECOMMERCE |
|---|---|---|---|
| clientes (liste) | `customers.delete` | masqué | sans accès |
| commandes du site (liste, fiche) | `role === 'ADMIN'` | masqué | masqué |
| commandes sur mesure (liste, fiche) | `custom-orders.delete` | masqué | sans accès |
| avis | `reviews.delete` | masqué | visible |
| catégories (liste, édition) | `categories.delete` | masqué | visible |
| tenue (édition) | `products.delete` | masqué | visible |
| facture : paiement | `invoices.delete` (SHOULD 5) | masqué | sans accès |
| factures (liste) | `role === 'ADMIN'` | masqué | sans accès |
| reçu (fiche) | `role === 'ADMIN'` | masqué | sans accès |
| matériels, catégories de matériels | `materials.delete` | masqué | sans accès |
| couturiers | `tailors` | masqué | sans accès |
| dépenses, catégories de dépenses | `finance.expenses` | masqué | sans accès |
| blog : articles, étiquettes, catégories | `blog.manage` | masqué | sans accès |
| étiquettes clientes | `role === 'ADMIN'` | masqué | sans accès |
| journaux de notifications (purge) | `role === 'ADMIN'` | masqué | sans accès |
| médiathèque | `media.delete` | masqué | visible |

Écrans audités sans changement : campagnes et rapports de campagnes (`campaigns.manage`, accordé au Personnel), créneaux et prestations de rendez-vous (`appointments.availability`, accordé), anniversaires (`notifications.manage`, accordé), pièces jointes d'une commande sur mesure (`custom-orders`, accordé), bandeau d'accueil (déjà traité en 35).

### MUST 3 — Codes promo

`/admin/coupons` : « Nouveau coupon », « Créer votre premier coupon », Activer/Désactiver, Modifier et Supprimer sont masqués sans `coupons.manage`. Le Personnel a la liste en lecture seule. `/admin/coupons/new` était déjà gardée par l'URL.

### MUST 3 bis — Faille `POST /api/upload`

- Aucune session : 401, inchangé.
- Rôle d'équipe (`isTeamRole`) : comportement conservé, mais `category` doit respecter `^(?:[a-z0-9][a-z0-9-]{0,49}|custom-orders\/[a-z0-9]{1,40})$`, sinon 400.
- Toute autre session : `category` doit valoir `avatars`, le fichier doit faire 5 Mo au plus et être un JPEG, PNG ou WebP **reconnu sur ses octets** (signatures `FF D8 FF`, `89 50 4E 47 0D 0A 1A 0A`, `RIFF....WEBP`). L'extension et le `Content-Type` stockés découlent de la signature, jamais du nom ni du type déclarés. Tout le reste : 403.

**Écart assumé avec le prompt.** Le prompt demandait une « liste fermée pour tout le monde (aucun `..`, aucun `/`) ». Telle quelle, elle cassait deux usages réels : les pièces jointes des commandes sur mesure (`custom-orders/${orderId}`, avec un `/` par construction) et les dossiers libres de la médiathèque. La règle par format ferme la traversée de chemin sans casser l'un ni l'autre ; les 11 cas testés sous Node (traversées comprises) se comportent comme attendu. La médiathèque normalise désormais le nom d'un nouveau dossier (minuscules, sans accents, tirets) avant l'envoi.

**Non validé par `curl` en production** : aucun cookie de cliente n'est disponible depuis la session (connexion par OTP SMS). Voir la checklist ci-dessous.

### SHOULD 4 — Anniversaires « 0 ans »

Le calcul de l'âge était juste. « 0 ans » pour toutes signifie que l'année de naissance stockée est l'année en cours : l'équipe connaît le jour et le mois, pas l'année. **Hypothèse non vérifiée en base** (prod injoignable depuis le poste). Correctif : un âge hors de [5, 110] renvoie `null` et l'écran affiche « — ».

Bug voisin corrigé : l'anniversaire du jour était comparé à `now`, heure comprise, et basculait donc à l'année suivante. Il disparaissait de la liste le jour même. On compare désormais au début de la journée (UTC) ; l'écran prévoyait déjà « Aujourd'hui » pour `daysUntil === 0`.

### SHOULD 5 — Suppression d'un paiement de facture

`DELETE /api/admin/invoices/[id]/payments` : `denyUnlessPermitted(session, 'invoices.delete')` remplace `role !== 'ADMIN'`. Conséquence voulue : MANAGER (`'*'`) peut désormais supprimer un paiement de facture, comme côté commande.

### Guides utilisateurs

`content-crm.js` (clientes) et `content-boutique.js` (commandes, catégories) : le texte ne dit plus « n'utilisez pas Supprimer » mais « le bouton n'apparaît pas pour vous ». **Les `.docx` ne sont pas régénérés** (`node build.js crm` / `boutique`, captures inchangées).

## Validation

- `npx tsc --noEmit` : exit 0 après chaque lot.
- ESLint : non configuré dans le projet (`next lint` ouvre l'assistant de configuration), pas de gate lint.
- **Production : non jouée.** Elle exige un compte Personnel, un cookie de cliente et le déploiement de ce push.

### Checklist production (CEO, après le déploiement)

1. Vérifier qu'Easypanel a bien construit ce push (sinon relance manuelle, comme en 35). Aucun changement de schéma : pas de `db push`.
2. Compte Personnel : `/admin/custom-orders` (2 cartes), `/admin/receipts` (2 cartes), `/admin/invoices` (aucun montant), `/admin/materials` (3 cartes), `/admin/inventory` (« Unités en stock »), `/admin/customers` (pas de colonnes Valeur totale ni Panier moyen), fiche cliente (2 cartes). Aucune corbeille sur clientes, commandes et factures. Codes promo en lecture seule.
3. `curl -s -b '<cookie Personnel>' https://gestion.cechemoi.com/api/admin/receipts | jq .stats` : `year` et `all` à `null`.
4. Compte cliente : photo de profil PNG acceptée ; `curl -F file=@x.svg -F category=avatars` → 403 ; `-F file=@x.pdf` → 403 ; `-F file=@x.png -F category=products` → 403.
5. Compte Administrateur : toutes les cartes et toutes les corbeilles présentes.
6. Anniversaires : si la colonne Âge n'affiche que « — », l'hypothèse de l'année en cours est confirmée.

## Constats ouverts (non corrigés)

- **Routes de suppression encore en `role === 'ADMIN'` en dur** : `orders/[id]`, `orders/bulk`, `invoices/[id]`, `receipts/[id]`, `tags/[name]`, `notifications/logs`, `notifications/templates/[id]`. Elles refusent MANAGER, contrairement à la matrice (`'*'`). Recommandation : les passer sur une permission (`orders.delete`, `invoices.delete`, etc.). C'est une décision CEO (le gérant doit-il pouvoir supprimer une commande ?), pas un correctif technique ; l'écran suit pour l'instant le serveur via `useIsAdmin()`.
- **Anniversaires** : si l'hypothèse se confirme, le formulaire client devrait accepter une date sans année (JJ-MM) et stocker l'année comme inconnue, au lieu de laisser l'équipe saisir l'année en cours. Changement de schéma, à arbitrer.
- **Guides** : régénérer les `.docx`.

## What did NOT ship this session — and why

- **Médiathèque** (photos produits absentes) : DEFER du prompt, sujet fonctionnel distinct.
- **Validation en production** : impossible depuis la session (voir plus haut).
