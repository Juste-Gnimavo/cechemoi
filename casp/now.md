# What I'm doing NOW

> **Updated** : 2026-10-09 (clôture de la session 35).

---

## Current focus (1 sentence)

La session 35 a livré **le rôle « Gestionnaire boutique en ligne »** (`ECOMMERCE`, commits `6a06ceb` et `138aed3`) : matrice limitée au hub Boutique, garde d'URL unique, vente au comptoir sans l'annuaire. **Ce n'est pas encore déployé** : aucun build Easypanel n'a été déclenché. Prochaine étape : **l'étanchéité financière du Personnel** (prompt 36), après la relance du déploiement par le CEO.

---

## Concrete next action if I have…

### 15 minutes

CEO : relancer le déploiement depuis Easypanel, puis lancer `npx -y prisma@5.22.0 db push` depuis le conteneur (attendu : already in sync).

### 1 hour

Créer un compte ECOMMERCE de test depuis `/admin/team` et jouer la checklist du journal 35 (10 tuiles, vente au comptoir complète, refus à l'écran et en API), puis le désactiver.

### Half a day

Prompt 36 : expurger côté API les cumuls d'argent encore visibles par le Personnel et le gestionnaire.

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
