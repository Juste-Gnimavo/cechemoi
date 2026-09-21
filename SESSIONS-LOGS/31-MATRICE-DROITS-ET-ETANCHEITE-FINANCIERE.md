# Session 31 — Matrice de droits unifiée et étanchéité financière

**Date** : 21/09/2026
**Déclencheur** : le Personnel ne pouvait pas créer de facture sur `/admin/invoices/new`.
**Portée finale** : bien au-delà du symptôme — refonte du contrôle d'accès de l'administration.

---

## 1. Le symptôme et sa cause

`POST /api/admin/invoices` exigeait `['ADMIN', 'MANAGER']` alors que la matrice
`src/lib/role-permissions.ts` accordait `invoices.create` au rôle `STAFF`.

La cause n'était pas un droit mal réglé mais une architecture à deux vérités :

- la matrice de droits n'était lue **qu'à huit endroits**, tous dans
  `src/app/admin/page.tsx` (affichage des tuiles du tableau de bord) ;
- les **234 gardes** des routes API réimplémentaient chacune leur propre
  tableau de rôles codé en dur.

L'interface promettait donc des droits que le serveur refusait. Le formulaire de
création de facture s'affichait, se remplissait, et renvoyait 401 à la soumission.

## 2. Fuites de trésorerie découvertes

Consigne de la direction : le Personnel ne doit jamais voir l'argent en caisse
— un retard de salaire se transforme en conflit si l'équipe sait ce que contient
la caisse. Le tableau de bord masquait bien ces chiffres à l'écran
(`isAdminOrManager`), mais les routes qui les servaient répondaient quand même.
L'onglet Réseau du navigateur, ou l'URL tapée directement, suffisait.

| Endpoint | Était ouvert à | Exposait |
|---|---|---|
| `GET /api/admin/transactions` | STAFF | journal de caisse complet |
| `GET /api/admin/analytics/revenue-summary` | STAFF, **TAILOR** | chiffre d'affaires total, annuel, 30 jours |
| `GET /api/admin/analytics/overview` | STAFF, **TAILOR** | recettes détaillées, CA par jour, top produits |
| `GET /api/admin/analytics/products` | STAFF | chiffre d'affaires par produit |
| `GET /api/admin/expenses`, `/expenses/reports` | STAFF | dépenses, donc masse salariale |
| `GET /api/admin/invoices/stats` | STAFF | encaissements cumulés du mois |
| `GET /api/admin/reports/analytics`, `/reports/export` | STAFF | rapports financiers complets |

## 3. Travaux réalisés

### 3.1 Matrice de droits — source de vérité unique

`src/lib/role-permissions.ts` réécrite : permissions structurées par domaine,
séparation lecture / écriture / suppression, et un bloc « Argent » réservé à la
direction (`sales`, `finance.revenue`, `finance.expenses`, `reports.financial`,
`analytics`).

Permissions de suppression distinctes (`customers.delete`, `materials.delete`,
`custom-orders.delete`, `invoices.delete`, `media.delete`), conformes à la
doctrine du projet : on désactive, on ne supprime pas.

### 3.2 Gardes serveur

Nouveau `src/lib/api-permissions.ts` :

- `denyUnlessPermitted(session, permission)` — garde principale des routes ;
- `requirePermission(permission)` — variante qui récupère elle-même la session ;
- `sessionCan(session, permission)` — lecture simple, pour le filtrage de payload ;
- `unauthenticated()` — réponse 401 standard.

Nouveau `src/lib/page-permissions.tsx` : `requirePagePermission()`, utilisée par
les `layout.tsx` serveur ajoutés sur `sales`, `transactions`, `expenses`,
`reports`, `analytics`, `staff-performance`, `marketing`, `settings`, `tax`,
`shipping`. Les routes API restent la vraie frontière de sécurité ; ces gardes
évitent simplement d'afficher au Personnel des écrans vides ou en erreur.

### 3.3 Migration

**232 gardes sur 132 fichiers** migrées vers la matrice. Il ne reste plus aucun
tableau de rôles codé en dur dans `src/app/api/admin`.

Les réponses passent de **401 à 403** en cas de droit manquant — un 401 est
interprété comme session expirée côté client et provoquait des déconnexions
parasites.

### 3.4 Étanchéité des payloads

Deux endpoints alimentent des écrans dont le Personnel a besoin. Plutôt que de
les fermer et de casser ces écrans, ils renvoient un payload expurgé :

- `analytics/overview` : sans `finance.revenue`, tous les montants passent à
  zéro et `revenueByDay` est vidé. **La forme du payload est préservée** — les
  clés existent, elles valent zéro — pour ne casser aucun consommateur.
- `invoices/stats` : les cumuls encaissés sont neutralisés. Les compteurs et le
  reste dû restent visibles, ce sont des outils de relance, pas une vue de caisse.

### 3.5 Interface

- `src/app/admin/page.tsx` : `isAdminOrManager` entièrement supprimé, remplacé
  par `hasPermission(...)`. La matrice fait désormais autorité des deux côtés.
- `src/lib/owner/tiles.ts` : les tuiles portent une `permission` optionnelle.
  « Caisse », « Rapports » et « Personnel » ne s'affichent plus qu'à la direction.
- `src/lib/admin-search/registry.ts` : section « Ventes » ramenée à ADMIN/MANAGER.

### 3.6 Demande annexe

`src/app/admin/materials/page.tsx` : bouton « Voir les commandes » vers
`/admin/custom-orders`, en tête de la barre d'actions, en style secondaire.

## 4. Différentiel d'accès du Personnel

**Retiré** (conforme à la consigne) : `transactions`, la vue complète des
dépenses et leurs cumuls, `expenses/categories` en écriture, `expenses/reports`,
`analytics/products`, `reports/analytics`, `reports/export`, `reports/saved`,
`reports/schedules`, et les montants dans `analytics/overview` et `invoices/stats`.

**Accordé** (incohérences du bloc A, validées) : factures (création, modification,
encaissement), rendez-vous (fiche, disponibilités, services, notification),
produits et catégories (création, modification, lot), ajustement de stock,
catégories de matériels, campagnes (gestion et envoi), notifications (modèles,
réglages, envoi, anniversaires, relances), export clients, coupons en lecture,
médiathèque en lecture, fusion et renommage de tags.

**Resté fermé** : toutes les suppressions définitives, les remboursements, les
réglages, l'équipe en écriture, la fiscalité, la livraison, le marketing,
la performance de l'équipe.

## 5. Limite connue

`ADMIN` et `MANAGER` ont tous deux `'*'` dans la matrice, qui ne permet donc pas
de les distinguer. Les quelques routes réservées à l'administrateur seul
(création et modification de comptes d'équipe, suppression d'un tag produit,
sources d'acquisition client) conservent volontairement un test
`role !== 'ADMIN'` explicite. Le documenter a été préféré à un contournement.

## 6. Saisie des dépenses par le Personnel — arbitré et implémenté

Point soulevé en cours de session : fermer les dépenses au Personnel lui retirait
la saisie quotidienne (eau, électricité, internet, achats du jour) que propose la
tuile « Caisse ». Décision de la direction : **la saisie est le minimum, le
Personnel doit pouvoir enregistrer les dépenses.**

Permission `finance.expenses.create` introduite, distincte de `finance.expenses` :

| | `finance.expenses.create` (Personnel) | `finance.expenses` (direction) |
|---|---|---|
| Créer une dépense | oui | oui |
| Liste des dépenses | **ses propres saisies seulement** | toutes |
| Cumul affiché | **aucun** (`totalAmount` forcé à 0) | complet |
| Relire / corriger une dépense | seulement les siennes | toutes |
| Supprimer une dépense | non | oui |
| Catégories de dépenses | lecture (le formulaire en a besoin) | gestion complète |
| Rapports de dépenses | non | oui |

Le filtrage repose sur `Expense.createdById`, déjà présent et indexé au schéma
et renseigné à la création.

**Détail de sécurité** : l'accès à une dépense d'autrui renvoie **404 et non
403**, pour ne pas confirmer son existence. Sans cela, le Personnel pourrait
énumérer les identifiants et déduire l'existence des écritures de salaire.

Conséquence concrète : un membre du Personnel qui saisit la facture d'électricité
la retrouve et peut la corriger, mais ne voit ni les salaires, ni le total des
dépenses du mois, ni les rapports.

Côté interface, `/admin/expenses` s'adapte au `scope` renvoyé par l'API : titre
« Vos saisies », carte de cumul retirée, boutons « Rapports » et « Catégories »
masqués. Les sous-sections `expenses/reports` et `expenses/categories` ont leur
propre garde de page.

## 7. Vérifications

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : succès. Les trois occurrences d'« error » dans le journal
  sont préexistantes et sans rapport (route publique `/api/consultations/slots`
  et page `/payer/failed`).
- Différentiel d'accès du Personnel calculé automatiquement avant/après et
  vérifié ligne à ligne.

## 8. Validation en production

Déployé sur `main` (`f00fea6..9d84bba`, 156 fichiers) et testé par le CEO avec
un compte de rôle `STAFF` sur `gestion.cechemoi.com`.

| Parcours | Résultat |
|---|---|
| `/admin/invoices/new` — créer une facture | validé |
| `/admin/custom-orders/new` — créer une commande sur mesure | validé |
| `/admin/expenses/new` — saisir une dépense | validé |

Non rejoués par le CEO, à vérifier à la prochaine occasion : la redirection des
pages fermées (`/admin/transactions`, `/admin/reports`, `/admin/sales`),
l'affichage du tableau de bord sans montants, et le bouton « Voir les
commandes » de `/admin/materials`.

## 9. Règle à ne pas casser

**Aucun tableau de rôles codé en dur dans une route d'administration.** Toute
nouvelle route passe par `denyUnlessPermitted`. L'écart entre ce que l'interface
montre et ce que le serveur autorise est exactement le bug de départ.
