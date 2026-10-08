# What I'm doing NOW

> **Updated** : 2026-10-08 (clôture de la session 34).

---

## Current focus (1 sentence)

La session 34 a rendu **la commande sur mesure source de vérité de sa facture** : paiements recopiés dans les deux sens, modes de paiement enregistrés en code, articles et total de la facture reconstruits depuis la commande, facture liée non modifiable sur ses articles, et 5 commandes réparées en production (`911482f`, déployé). Prochaine étape : **un rôle « Gestionnaire boutique en ligne »** limité au hub `/owner/boutique`.

---

## Concrete next action if I have…

### 15 minutes

Faire trancher par le CEO les 3 décisions du prompt 35 (vente au comptoir, accès clientes, codes promo).

### 1 hour

Ajouter `UserRole.ECOMMERCE`, sa ligne dans `src/lib/role-permissions.ts`, et corriger chaque erreur de typage qu'elle provoque.

### Half a day

Prompt 35 complet : accueil et navigation filtrés, équipe, audit des rôles codés en dur, `db push` en prod, validation avec un vrai compte.

---

## Don't get distracted by

- **Système de notifications** (templates, déclencheurs) — backlog depuis novembre 2025, pas demandé.
- **Bouton de paiement en double sur la facture** — cosmétique, après le rôle.
- **Fuites de cumuls d'argent vers le Personnel** — en file juste après (prompt 36), pas dans la session 35.
- **Application mobile** — en pause, la priorité est le CRM web.

---

## Constraints active today

- Le push ne déclenche pas toujours le build Easypanel : vérifier le conteneur, sinon webhook manuel (onglet Deployments du service).
- Base sur `ssh zerosuite` (Swarm `cechemoi_postgres`), non exposée ; `.env` locaux pointent encore vers l'ancien hôte.
- Toute correction de données ambiguë passe par la validation du CEO.
- `npx @justethales/casp check` avant push.
