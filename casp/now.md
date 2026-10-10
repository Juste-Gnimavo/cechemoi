# What I'm doing NOW

> **Updated** : 2026-10-10 (clôture de la session 36).

---

## Current focus (1 sentence)

La session 36 a livré **l'étanchéité financière du Personnel** (cumuls d'argent à `null` côté API sans `finance.revenue`, boutons Supprimer alignés sur le serveur sur 23 écrans, `POST /api/upload` fermé aux clientes hors avatar) ; prochaine étape : **la checklist production du journal 36**, puis la session 37 (informer le couturier).

---

## Concrete next action if I have…

### 15 minutes

CEO : vérifier qu'Easypanel a construit le push de la session 36 (sinon relance manuelle), puis ouvrir `/admin/receipts` et `/admin/customers` avec un compte Personnel : aucun cumul, aucune corbeille.

### 1 hour

Jouer la checklist complète du journal `SESSIONS-LOGS/26-10-10-001-36-etancheite-financiere-personnel.md` (Personnel, cliente pour l'upload, Administrateur) et trancher les deux décisions ouvertes (suppressions en `role === 'ADMIN'` en dur, date de naissance sans année).

### Half a day

Session 37 : bouton « Informer le couturier » (`docs/plan/sessions/37-INFORMER-LE-COUTURIER.md`).

---

## Don't get distracted by

- **Système de notifications** (templates, déclencheurs) — backlog depuis novembre 2025, pas demandé.
- **Bouton de paiement en double sur la facture** — cosmétique, après le rôle.
- **Application mobile** — en pause, la priorité est le CRM web.

---

## Constraints active today

- Le push ne déclenche pas toujours le build Easypanel : vérifier le conteneur, sinon webhook manuel (onglet Deployments du service).
- Base sur `ssh zerosuite` (Swarm `cechemoi_postgres`), non exposée ; `.env` locaux pointent encore vers l'ancien hôte.
- Toute correction de données ambiguë passe par la validation du CEO.
- `npx @justethales/casp check` avant push.
