# Roadmap

> **Updated** : 2026-10-08 (clôture de la session 34).
> **Source of truth** : this file + `docs/plan/sessions/*.md` (status frontmatter) + `session-logs/`.
> **Maintenance rule** : update at the end of every session that ships something or surfaces a blocker.

---

## Now — Next 3 to ship (in this order)

| # | Item | Prompt | Status |
|---|------|--------|--------|
| 1 | Discussion 38 : arbitrages après la 37 (rôle TAILOR, suppressions ADMIN en dur, anniversaires sans année, fiche de suivi « document interne », désignation de la cliente, prochaine feuille de route) | `docs/plan/sessions/DISCUSSION-38-ARBITRAGES-APRES-37.md` | queued |
| 2 | _(produit par la discussion 38)_ | — | — |
| 3 | _(produit par la discussion 38)_ | — | — |

If you reach for anything BELOW Next-3, stop and check why.

---

## In-flight (other agents working in parallel)

| Item | Owner | Expected close |
|------|-------|----------------|
| _(none)_ | _(none)_ | _(none)_ |

---

## Blocked

| Item | Blocker | Unblock action |
|------|---------|----------------|
| _(none)_ | _(none)_ | _(none)_ |

---

## Queued — launch-critical (do before public launch)

_(site et CRM déjà en production — aucun bloquant de lancement)_

---

## Queued — non-critical (post-launch deferable)

- Diagnostiquer le déploiement automatique Easypanel (push sans build) — contourné par le webhook manuel, rappelé dans chaque prompt.
- Facture : un seul bouton de paiement (« Ajouter un acompte » et « Ajouter un paiement » font la même chose).
- Système de notifications (templates, déclencheurs) — `SESSIONS-LOGS/08-NOTIFICATION-SYSTEM-AND-ADMIN-IMPROVEMENTS-PLAN.md`.
- Libellés sans accents dans `paymentMethodLabels` (`src/lib/receipt-generator.ts`).
- Mettre à jour `.env` / `.env.production` locaux vers le nouvel hôte de base.
- Application mobile (en pause).

---

## Shipped this week

| Date | Commit | Title | Notes |
|------|--------|-------|-------|
| 2026-10-10 | `f9d2819` | Informer le couturier | fiche sans montant, PDF à jeton révocable, table `TailorBriefShare` |
| 2026-10-10 | `4c47044` | Désignation de la cliente | 369 noms à civilité |
| 2026-10-08 | `f985a86` | Paiements facture → commande | 4 paiements recopiés en prod |
| 2026-10-08 | `3991d29` | Modes de paiement en code | 9 paiements facture réalignés |
| 2026-10-08 | `66a0804` | Commande source des articles de la facture | SM-240226-0001 alignée, doublon SM-040326-0006 supprimé |
| 2026-10-08 | `911482f` | Total commande non modifiable directement | — |

---

## Phase scoreboard

| Phase | Status | Session log | Notes |
|-------|--------|-------------|-------|
| Sessions 1-33 | shipped | `SESSIONS-LOGS/01…33-*.md` | Antérieures à CASP |
| 34 — Sync commande ↔ facture | shipped | `SESSIONS-LOGS/34-SYNC-COMMANDE-FACTURE-PAIEMENTS-ARTICLES.md` | CASP installé en clôture |
| 35 — Rôle gestionnaire boutique en ligne | queued | _(pending)_ | Schéma : enum `UserRole` |
| 36 — Étanchéité financière du Personnel | queued | _(pending)_ | Constats session 33 |
| 37 — Informer le couturier | queued | _(pending)_ | Schéma : jeton de partage du PDF |
