# Session 23 — Cohérence des chiffres financiers admin

**Date** : 2026-06-01
**Focus** : Corriger les chiffres financiers faux et incohérents entre toutes les pages admin (home, Caisse, Rapports, Analytics, Transactions, Sales, Reçus)

---

## Contexte

Quatre cas concrets remontés par le CEO :

1. **Rapports > Ventes en ligne** : une commande PENDING de 205 000 CFA jamais payée apparaissait dans "Chiffre d'affaires TTC".
2. **Homepage `/admin`** "Revenu Net" = 38 157 000 CFA (faux et trop élevé).
3. **Caisse `/admin/invoices`** "Revenu" = 16 006 000 CFA (lifetime, pas de période, incomparable aux autres).
4. **Rapports > Factures** "Total facturé TTC" = 19 969 000 CFA (incluait DRAFT/CANCELLED).

Et derrière : "plein d'autres cas du même genre" → audit complet demandé.

---

## Racine technique des incohérences

Trois concepts comptables étaient mélangés sous des labels inconsistants :

| Concept | Définition |
|---|---|
| **Facturé** | `Invoice.total` toutes factures émises (≠ DRAFT/CANCELLED/REFUNDED) |
| **Encaissé** | Argent réellement reçu (somme des paiements, sans double comptage) |
| **CA réalisé** | Ventes confirmées (orders payés, factures payées, custom livrés) |

Deux bugs critiques causaient le 38M vs 16M :

1. **Online sales** : pas de filtre `paymentStatus` — toutes les commandes (y compris PENDING) entraient dans le CA.
2. **Analytics overview** : double comptage `paidStandaloneInvoices.total` (16M) + `standaloneInvoicePayments.amount` (~16M qui paient ces mêmes factures) → 32M au lieu de 16M.

---

## Stratégie : source de vérité unique

Création d'un helper canonique `src/lib/finance/aggregations.ts` avec trois fonctions pures que toutes les pages consomment :

- `computeCashReceipts({ start, end })` — encaissé dé-dupliqué
- `computeBookedRevenue({ start, end })` — CA réalisé sur la période
- `computeBilled({ start, end, source? })` — facturé hors DRAFT/CANCELLED/REFUNDED

Le principe clé pour `computeCashReceipts` : ne **jamais** sommer `invoice.total` ET les `InvoicePayment.amount` correspondants — on somme uniquement les FLUX DE PAIEMENT (Payment, CustomOrderPayment, InvoicePayment standalone, StandalonePayment, Appointment.paidAmount).

---

## Fichiers livrés

### Créés

- `src/lib/finance/aggregations.ts` — helpers canoniques + types `CashReceipts`, `BookedRevenue`, `Billed`

### Modifiés

**Queries (rapports)**

- `src/lib/exports/queries/online-sales.ts` — nouveau filtre `paymentStatus` (défaut : Payées). Résumé séparé en deux blocs : "CA réalisé (commandes payées)" + "Commandes en attente". Plus jamais de PENDING dans le CA.
- `src/lib/exports/queries/invoices.ts` — `where.status: { notIn: ['DRAFT', 'CANCELLED', 'REFUNDED'] }` par défaut. Override respecté si l'utilisateur sélectionne un statut explicite.
- `src/lib/exports/queries/transactions.ts` — `invoicePayment` filtré à `invoice.orderId IS NULL AND invoice.customOrderId IS NULL`. Les paiements de factures liées à un Order/CustomOrder sont déjà comptés via Payment / CustomOrderPayment.
- `src/lib/exports/types.ts` — ajout `paymentStatus?: string` à `ReportFilters`.

**Endpoints**

- `src/app/api/admin/analytics/overview/route.ts` — réécrit via `computeCashReceipts`. `revenue.total` = encaissements dé-dupliqués. `revenue.fromInvoicePayments` déprécié (vaut 0, valeur fusionnée dans `fromStandaloneInvoices`). `averageOrderValue` corrigé (divisait totalRevenue / paidOrdersCount → maintenant orderRevenue / paidOrdersCount).
- `src/app/api/admin/invoices/stats/route.ts` — accepte `?period` / `?startDate` / `?endDate`. Plus de KPI lifetime non scopé. Expose `billedTotal`, `cashReceipts`, `outstanding`, `period`.
- `src/app/api/admin/reports/financial/[family]/route.ts` — propage `paymentStatus`.
- `src/app/api/admin/receipts/route.ts` — stats reorganisées en Aujourd'hui / Ce mois / Cette année / Toute la période (au lieu de Aujourd'hui / Cette semaine / Ce mois — la semaine était inutile car les reçus dataient majoritairement du mois précédent).

**Pages frontend**

- `src/app/admin/page.tsx` — "Revenu Net" → "Encaissements (30j)". Sous-libellé "X factures payées" qui lisait `stats.orders.paid` (compte d'orders, pas de factures) → remplacé par "30 derniers jours".
- `src/app/admin/invoices/page.tsx` (Caisse) — sélecteur de période ajouté (défaut 30j). Cards renommées "Facturé (période)", "Encaissé (période)", "Reste dû (période)". Mention explicite "Compteurs en bleu : depuis le début. Montants en vert : <période>".
- `src/app/admin/analytics/page.tsx` et `src/app/admin/analytics/revenue/page.tsx` — "Revenu Total" → "Encaissements (période)".
- `src/app/admin/transactions/page.tsx` — suppression du bloc "Acomptes fact." devenu redondant après la dédup serveur (la valeur était déjà dans "Factures").
- `src/app/admin/reports/page.tsx` — onglet Ventes en ligne : nouveau sélecteur "Paiement" (Payées / En attente / Toutes), défaut "Payées".
- `src/app/admin/receipts/page.tsx` — quatre cards alignées sur le nouveau backend.
- `src/app/admin/sales/page.tsx` — ajout d'une notice contextuelle quand 0 commande (la page ne comptait que les commandes EN LIGNE PAYÉES, mais sans explication on croyait à un bug). Liens vers `/admin/orders` (pipeline complet) et `/admin/reports` (hub canonique).

---

## Vérifications

- `npx tsc --noEmit` : 0 erreur
- `npm run build` : OK

---

## Décisions actées avec le CEO

1. **Renommer "Revenu Net" en "Encaissements (30j)"** — "Revenu Net" en compta = revenu - charges. Le calcul réel est l'encaissement brut → label trompeur, corrigé.
2. **Sélecteur de période sur `/admin/invoices`** — alignement avec le reste du système, plus de lifetime non scopé.
3. **Audit complet** — pas que les 4 cas remontés. Toutes les pages financières admin auditées et alignées sur les trois concepts comptables.

---

## Hors scope (non touché)

- Pas de migration Prisma
- Pas de refonte UI des rapports
- Pas de modification du flux de paiement ni de la création de factures
- Pas de nettoyage de `RECRUTEMENT/` ni de fichiers untracked tiers
