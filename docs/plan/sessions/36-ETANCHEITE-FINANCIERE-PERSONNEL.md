---
status: queued
session_id: pending
session_log: pending
drafted_at: 2026-10-08
next_after: 35-role-gestionnaire-boutique-en-ligne
---

# Session 36 — Étanchéité financière du Personnel (constats de la session 33)

> **Status : QUEUED.** Rédigé à la clôture de la session 34 (commit `911482f`) à partir des constats non corrigés de la session 33.
>
> **Goal.** Un compte Personnel ne voit plus aucun cumul d'argent, ni à l'écran ni dans les réponses d'API, et ne voit plus de bouton « Supprimer » que le serveur lui refuse.
>
> **Why now.** La règle CEO (le Personnel ne voit jamais la trésorerie) est contredite en production depuis la session 31 : encaissements cumulés (≈ 30 M FCFA sur `/admin/receipts`) visibles par tout le Personnel.

**Project root.** `/Users/juste/Desktop/DOSSIER-BUREAU/PROJETS-ENCOURS/0-CECHEMOI-COM`
**Branch.** `main` (push = déploiement Easypanel ; vérifier qu'un build part, sinon webhook manuel — voir session 34).
**Session log target.** `SESSIONS-LOGS/36-ETANCHEITE-FINANCIERE-PERSONNEL.md`.
**Expected size.** Demi-journée. Pas de changement de schéma.

---

## CONTEXTE

- **Session 31** a fermé `transactions`, `expenses`, `reports`, `analytics/revenue-summary`, `analytics/products` au Personnel et expurgé les montants de `analytics/overview` et `invoices/stats` via `sessionCan(session, 'finance.revenue')` (`src/app/api/admin/invoices/stats/route.ts:123`, `src/app/api/admin/analytics/overview/route.ts:327`). C'est le modèle à reproduire : **expurger côté API**, jamais seulement masquer à l'écran.
- **Session 33** (`SESSIONS-LOGS/33-GUIDES-UTILISATEURS-BOUTIQUE-ET-CRM.md`, section « Constats ») a relevé les fuites restantes en faisant les captures des guides.
- **Préalables hérités de la session 35** (journal `SESSIONS-LOGS/26-10-09-001-35-role-gestionnaire-boutique-en-ligne.md`, commits `6a06ceb` et `138aed3`) : au démarrage, vérifier que le conteneur de production contient `/app/.next/server/app/api/admin/orders/customer-search`. Sinon, le déploiement de la 35 n'a jamais été lancé (le push ne déclenche aucun build) : consigner le fait, puis travailler. Si le déploiement est là, lancer `npx -y prisma@5.22.0 db push` depuis le conteneur (attendu : already in sync, la valeur d'enum `ECOMMERCE` a été ajoutée par SQL le 09/10) et jouer la checklist ECOMMERCE de la 35 si un accès administrateur est disponible.
- **Session 35** a ajouté le rôle `ECOMMERCE` (périmètre limité au hub Boutique ; le compte réel du gestionnaire ne sera créé qu'après le déploiement de cette session). Il lit `/api/admin/inventory/overview` (`inventory`) et la liste `/admin/orders` (`orders`) : vérifier qu'aucun cumul d'argent n'y passe sans `finance.revenue` : toute expurgation doit se baser sur la permission (`finance.revenue`), pas sur le nom du rôle, pour couvrir les deux.

---

## SCOPE

### MUST HAVE

1. **Cumuls d'argent expurgés côté API** pour qui n'a pas `finance.revenue` :
   - `/admin/custom-orders` : cartes « Année » et « Toute la période » (encaissements cumulés) — `src/app/api/admin/custom-orders/stats/route.ts`.
   - `/admin/receipts` : « Cette année » et « Toute la période ».
   - `/admin/invoices` : « Reste dû (30 derniers jours) ».
   - `/admin/materials` et `/admin/materials/movements` : valeur totale du stock et des mouvements.
   - `/admin/customers` et fiche cliente : « Valeur totale », « Valeur vie client », « Panier moyen ».
   Chaque écran concerné masque la carte proprement (pas de « 0 F » trompeur, pas de « Aucune donnée »).
   Les montants **unitaires** nécessaires au travail (montant d'une facture, d'un reçu, d'un paiement) restent visibles : seuls les cumuls sont visés.
2. **Boutons « Supprimer » alignés sur le serveur** : masqués quand la permission ou le test serveur refuse. Point de départ : catégories (`DELETE /api/admin/categories/[id]` exige `role === 'ADMIN'`) ; auditer clientes, commandes du site, commandes sur mesure, avis, campagnes. Consigner chaque écran dans le journal.
3. **Codes promo** — décidé le 09/10/2026, ne pas rouvrir : `ECOMMERCE` a `coupons` + `coupons.manage` (CEO, session 35). `STAFF` garde le statu quo : `coupons` seul (lecture et validation d'un code pendant une vente), **sans** `coupons.manage` ; la tuile Codes promo du hub, gardée par `coupons.manage`, lui reste donc masquée. Vérifier seulement que l'écran `/admin/coupons` n'offre pas à `STAFF` de bouton de création ou de modification que le serveur refuserait.

### SHOULD HAVE

4. **Anniversaires** : la colonne « Âge » affiche « 0 ans » pour toutes les clientes — corriger le calcul.
5. **Suppression d'un paiement côté facture** : remplacer le test `role === 'ADMIN'` en dur (`src/app/api/admin/invoices/[id]/payments/route.ts`, DELETE) par `denyUnlessPermitted(session, 'invoices.delete')`, comme côté commande (constat session 34).

### DEFER

- Médiathèque (les photos produits ne s'y retrouvent pas) : sujet fonctionnel distinct.

---

## VALIDATION

- `npx tsc --noEmit` vert.
- En production avec un compte Personnel : chaque écran listé n'affiche plus de cumul, et la réponse JSON de l'API correspondante ne contient plus le montant (`curl` avec le cookie de session). Un compte Administrateur voit toujours tout.
- Guides utilisateurs (`doc-web/guides-utilisateurs/`) mis à jour si une capture change.
- Journal écrit, `casp/state.json` et `SESSIONS-LOGS/NEXT-STEP.md` à jour, `casp check` vert.

---

## Rappels de discipline (CLAUDE.md global §19-21)

Lire par plage (`grep -n` puis `sed -n`), éditer chirurgicalement, borner toute sortie de commande à ~20 lignes (`> /tmp/out.log 2>&1; echo "exit=$?"`).
