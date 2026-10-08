# Session 34 — Synchronisation commande sur mesure ↔ facture : paiements, modes de paiement, articles (08/10/2026)

## Demande du CEO

SM-081026-0001 : l'onglet Paiements de la commande est vide (0 FCFA payé) alors que sa facture FAC-081026-0001 a reçu une avance de 100 000 FCFA. Comment ajouter un paiement, ou les deux doivent-ils se synchroniser ?

## Diagnostic

La synchronisation commande ↔ facture était incomplète sur trois axes :

1. **Paiements, sens facture → commande absent.** Un paiement saisi sur la commande était recopié vers la facture (`syncPaymentToInvoice`), jamais l'inverse. La suppression côté facture laissait aussi le paiement compté côté commande.
2. **Mode de paiement.** Le formulaire de la commande enregistrait le libellé (« Wave », « Orange Money ») ; `mapPaymentMethod` ne reconnaissait que les codes et retombait sur `CASH`. Les paiements Wave / Orange Money / virement apparaissaient en « Espèces » sur les factures et dans les rapports.
3. **Articles.** Modifier les articles d'une commande ne mettait à jour que `totalCost`, jamais la facture. L'équipe modifiait donc la facture directement et la commande restait à l'ancien total (SM-240226-0001 : commande 80 000, facture 245 000).

Les agrégats financiers (`src/lib/finance/aggregations.ts`, exports, stats) étaient justes en montant : ils comptaient déjà les paiements de facture « orphelins » et dédupliquent via `CustomOrderPayment.invoicePaymentId`. Seule la page commande et la ventilation par mode de paiement étaient fausses.

## Livré

| Commit | Contenu |
|---|---|
| `f985a86` | `mirrorInvoicePaymentToCustomOrder` (idempotent, reçu rattaché aux deux côtés) ; POST/DELETE `/api/admin/invoices/[id]/payments` synchronisés avec historique commande ; `scripts/backfill-custom-order-payments.ts` (rapport / `--apply`) |
| `3991d29` | `src/lib/payment-methods.ts` (codes, normalisation des anciens libellés, libellés d'affichage, importable côté client) ; formulaire et affichage commande en codes ; route POST et `mapPaymentMethod` normalisent |
| `66a0804` | `syncInvoiceItemsFromCustomOrder` : la commande est la seule source des articles ; appelée à l'ajout / modification / suppression d'article et au changement de coût matériel ; taxe, livraison et remise de la facture conservées ; statut recalculé sauf facture annulée ou remboursée. Facture liée : articles en lecture seule avec lien vers la commande ; l'API refuse `items` (400) |
| `911482f` | `PUT /api/admin/custom-orders/[id]` refuse `totalCost` (400) : le total découle des articles. Aucun écran ne l'envoyait |

Typage `tsc --noEmit` vert à chaque commit. Aucun test manuel dans l'interface par Claude.

## Données de production corrigées (SQL, transactions)

- **Paiements de facture recopiés vers la commande** : 4 paiements sur SM-081026-0001 (100 000), SM-270226-0003 (75 000), SM-270326-0002 (50 000 + 35 000).
- **Modes de paiement** : 25 `CustomOrderPayment` passés du libellé au code ; 9 `InvoicePayment` réalignés (5 Wave, 3 Orange Money, 1 virement, tous en `CASH` auparavant) ; 23 reçus alignés. 2 anciens paiements sans mode renseigné laissés tels quels.
- **SM-040326-0006** (validé par le CEO) : doublon de 40 000 du 27/03/2026 supprimé sur FAC-040326-0006 avec son reçu REC-270326-0007. Cause : paiement du 05/03 saisi sur la commande dont la sync avait échoué, ressaisi sur la facture le 27/03, puis resynchronisé par le backfill du 04/04.
- **SM-240226-0001** (validé par le CEO) : commande alignée sur sa facture — Combinaison verte (90 000) et Pantalon en pagne baoulé (75 000) ajoutés sans tailleur, total 245 000, paiements 200 000 + 45 000 repris.

Chaque correction laisse une entrée « Correction de données » dans l'historique de la commande. Contrôle final : sur les 5 commandes touchées, total commande = total facture et payé commande = payé facture.

## Infrastructure

- La base a migré de `thales.deblo.app:5460` vers le serveur Easypanel `ssh zerosuite` (46.62.185.82), service Swarm `cechemoi_postgres`. Le nom `*.zerosuite.dev` passe par le proxy Cloudflare : Postgres n'est pas joignable de l'extérieur, et ne doit pas l'être. Accès : `ssh zerosuite` puis `docker exec -i $(docker ps -qf name=cechemoi_postgres.1) psql -U postgres -d postgres`.
- `.env` et `.env.production` locaux pointent encore vers l'ancien hôte — à mettre à jour.
- Le conteneur applicatif est un build Next.js standalone : pas de `scripts/`, pas de ts-node. Les scripts de rattrapage ne s'y exécutent pas ; le SQL via `psql` est la voie praticable.
- **Déploiement automatique irrégulier** : le push de `f985a86` a déclenché un build, ceux de `3991d29`, `66a0804` et `911482f` non. Les quatre commits sont en production (vérifié dans le conteneur). Déploiement relancé à la main via le webhook Easypanel du service (onglet Deployments). À diagnostiquer.

## Décisions

- **La commande sur mesure est la source de vérité** des articles et du total ; la facture en est une projection. Pas de modification bidirectionnelle des articles : elle recréerait la divergence.
- **Les paiements restent saisissables des deux côtés**, avec miroir dans les deux sens, parce que l'équipe utilise les deux écrans.
- Corrections de données ambiguës (doublon, total divergent) **jamais appliquées sans validation du CEO**.

## Points ouverts

- Facture : deux boutons font la même chose (« AJOUTER UN ACOMPTE » en haut, « Ajouter un paiement » dans l'historique). Recommandation : n'en garder qu'un.
- Suppression d'un paiement côté facture : test `role === 'ADMIN'` codé en dur, alors que côté commande elle passe par `invoices.delete`. À aligner sur la matrice.
- `paymentMethodLabels` (`src/lib/receipt-generator.ts`) contient des libellés sans accents (« Especes », « Cheque »).
- SM-240226-0001 : statut « En attente » alors qu'elle est entièrement payée ; tailleur à assigner sur les 2 articles ajoutés.
