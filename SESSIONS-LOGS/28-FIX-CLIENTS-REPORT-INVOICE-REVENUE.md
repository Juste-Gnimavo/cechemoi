# Session 28 — Fix rapport Clients : revenu basé sur les factures + suppression colonne Fidélité

**Date** : 2026-06-10
**Fichier modifié** : `src/lib/exports/queries/clients.ts`

## Problème

Le tab Clients de `/admin/reports?tab=clients` affichait 0 F CFA pour tous les clients quelle que soit la période, alors que le tab Factures listait bien 117 factures payées.

**Cause** : le rapport Clients calculait le « Total dépensé » uniquement à partir de `Order.paymentStatus = COMPLETED` (commandes en ligne). Or l'activité réelle de la boutique passe par les factures (sur-mesure et autonomes) — il n'y a quasiment aucune commande en ligne encaissée. Le modèle `Invoice` n'a pas de `userId`, donc aucun rattachement client n'était fait.

## Solution

Le revenu par client est désormais calculé à partir des **factures** (source de vérité du CA, cohérent avec le tab Factures) :

1. **Rattachement facture → client** (attribution unique, pas de double comptage) :
   - facture de commande en ligne → `order.userId`
   - facture sur-mesure → `customOrder.customerId`
   - facture autonome → `customerPhone == user.phone` (même approche que `/api/admin/customers`)

2. **Sémantique « encaissé »** identique au rapport Factures :
   - statut `PAID` → total TTC (source de vérité = status, pas `amountPaid`, à cause des dérives historiques)
   - sinon → `amountPaid` (acomptes des partielles)
   - exclusion de `DRAFT` / `CANCELLED` / `REFUNDED`
   - facture liée à une commande en ligne `COMPLETED` → considérée payée même si le statut facture a dérivé

3. **Complément** : commandes en ligne `COMPLETED` **sans** facture (historique) ajoutées en plus — celles avec facture sont déjà comptées via la facture.

4. **Mode `dateBasis = 'active'`** : un client est « actif sur la période » s'il a une commande en ligne encaissée OU un versement facture (`paidDate` ou `InvoicePayment.paidAt`) dans la période.

## Changements UI (colonnes / labels)

- **Colonne « Fidélité » supprimée** (demande CEO) — le select `loyaltyPoints` et `labelTier()` ont été retirés.
- Renommages pour refléter que les achats incluent les factures : « Cmd. payées » → « Achats payés », « Dernière cmd. » → « Dernier achat », « Commandes payées (cumul) » → « Achats payés (cumul) », « VIP (5+ cmd ou 100k+) » → « VIP (5+ achats ou 100k+) », « Valeur (CA réalisé…) » → « Valeur (CA encaissé…) ».
- Un « achat payé » = une facture avec encaissement > 0 (ou une commande encaissée sans facture). Les segments (VIP, Fidèle, Acheteur, Sans achat, Inactif) s'appuient désormais sur ces achats.

## Notes techniques

- Les exports Excel/PDF passent par le même `fetchClientsReport` → corrigés automatiquement.
- La page `reports/page.tsx` rend les colonnes dynamiquement depuis l'API → aucun changement front nécessaire.
- Le rapprochement par téléphone des factures autonomes est un match exact (comme la page Clients admin). Si des factures autonomes ont un numéro saisi dans un format différent de `User.phone`, elles ne seront pas rattachées — limite connue, à normaliser si le besoin apparaît.
- `npx tsc --noEmit` : propre.

## Vérification à faire par le CEO

Recharger `/admin/reports?tab=clients` (période « 12 derniers mois ») : les totaux par client doivent maintenant refléter les factures encaissées, et la colonne Fidélité a disparu.
