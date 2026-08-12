# Session 29 — Lot 1 du backlog propriétaire (problèmes 03 à 17)

**Date** : 2026-08-12 (même journée que la session 28, à la suite)
**Origine** : Le CEO a listé les signalements de la propriétaire (17 au total avec ceux de la session 28) et a demandé de **tout implémenter d'un bloc** avant de lui livrer. Catalogue complet : `messages/00-INDEX.md`.
**Statut** : Implémenté, typé, commité. À déployer.

---

## Ce qui a été livré

### A — Correctifs rapides
- **05** : encart bleu de `/admin/custom-orders/new` réécrit — facture automatique, suivi des étapes, notifications cliente.
- **14** : `/admin/customers/send-sms` et `send-whatsapp` affichaient « undefined undefined » (mappage `firstName/lastName` alors que l'API renvoie `name`) et exigeaient 2 caractères. Corrigé : noms affichés, recherche dès 1 lettre.

### B — Shell propriétaire (gestion.cechemoi.com) : 6 → 9 tuiles
- **03+16** : tuile **Personnel** → hub (Ajouter un membre, Toute l'équipe, Performance équipe `/admin/staff-performance`, Gestion des couturiers `/admin/tailors`) + encart pédagogique « désactiver ≠ supprimer » (analogie banque du CEO).
- **13** : tuile **Messages** → hub (WhatsApp/SMS à une cliente, campagnes WhatsApp/SMS, rapports d'envois). ⚠ Tout WhatsApp passe par le proxy smsing/Baileys — jamais le Cloud API (aucun template approuvé).
- **08** : séparation **Commandes atelier** (sur mesure + carte Suivi de production) / **Boutique en ligne** (vendre au comptoir en action principale, commandes du site, produits) avec encarts croisés. Sous-domaine boutique. : seulement si le besoin persiste après usage.

### C — Commandes / factures
- **06** : page commande → gros boutons « Voir la facture », « Fiche de suivi » (téléchargement direct via `/api/admin/custom-orders/[id]/fiche-suivi-confection`) ; page facture → « Voir la commande associée » (customOrder ajouté à l'include de l'API facture).
- **07 — cause trouvée** : le POST de création avalait silencieusement l'échec de génération de facture (`// Return the order even if invoice creation fails`). Correctifs : retry automatique + message d'avertissement explicite, bannière « Facture manquante » + bouton « Générer la facture » sur la commande (endpoint idempotent `generate-invoice`), script `scripts/backfill-missing-invoices.ts` (rapport puis `--apply`).

### D — Stock
- **15** : barre de recherche par nom sur `/admin/materials/movements` (param `search` API) + **fiche matériel** `/admin/materials/[id]` (stock, valeur, cumuls entrées/sorties, utilisation par couturier via `?stats=true`, 50 derniers mouvements) — nom cliquable depuis la liste.
- **10** : **fiche de sortie par couturier** `/admin/materials/fiche-sortie-couturier` (couturier + période → tableau imprimable, astuce CSS `@media print`) + carte hub Stock + lien page matériels.
- **12** : bouton **Corriger** sur les mouvements IN/OUT → modal (quantité réelle + motif obligatoire) → mouvement `ADJUST` (stock absolu recalculé, l'historique n'est jamais modifié). Validation API corrigée (ADJUST à 0 autorisé). Textes « Action irréversible » reformulés pour pointer vers Corriger.

### E — Production + notifications (04)
- **Page `/admin/production` refondue** : étapes en menu latéral (chips horizontales sur mobile) avec compteurs, contenu de l'étape à droite en grille de cartes. Le drag & drop est remplacé par des **sélecteurs Étape et Couturier sur chaque carte** — utilisable au doigt sur iPhone/iPad (l'assignation couturier depuis le board est nouvelle).
- **Notifications automatiques** (`src/lib/custom-order-status-notifications.ts`) branchées sur le changement de statut de la commande (PUT `/api/admin/custom-orders/[id]`) :
  - Cliente : SMS + WhatsApp (sendDual via proxy smsing) pour En production, Essayage, Retouches, Prêt, Livré — messages en dur (pas de dépendance aux templates DB jamais seedés).
  - Propriétaire : copie WhatsApp de chaque changement de statut (qui a changé quoi).
- **Coordonnées propriétaire en env** (`src/lib/owner-contact.ts`) : `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PHONE` — ajoutées au `.env` local, **à ajouter dans Easypanel**.

## Vérifications
- `npx tsc --noEmit` : propre après chaque bloc.
- Pas de migration : aucun changement de schéma dans ce lot (le type `ADJUST` existait déjà).

## À faire au déploiement (CEO)
1. Variables Easypanel : `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PHONE` (valeurs dans `.env` local).
2. `scripts/backfill-missing-invoices.ts` (rapport puis `--apply`) pour les factures manquantes historiques.
3. Vérifier en réel : un changement de statut d'une commande → SMS/WhatsApp cliente + copie propriétaire.
4. Envoyer les messages `messages/01-17` à la propriétaire par petits paquets, avec captures.

## Points d'attention
- Les notifications de statut partent depuis le **statut de la commande** (pas les étapes des articles du board production — Coupe/Couture/Finitions restent internes à l'atelier, la cliente ne reçoit que les étapes qui la concernent).
- Le hub Rapports du shell conserve ses 7 cartes ; la fiche par couturier est dans le hub Stock.
