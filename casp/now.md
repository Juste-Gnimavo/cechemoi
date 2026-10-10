# What I'm doing NOW

> **Updated** : 2026-10-10 (clôture de la session 37).

---

## Current focus (1 sentence)

La session 37 a livré **le bouton « Informer le couturier »** (fiche sans aucun montant, garde de type prouvée, PDF par jeton révocable, validé en production sur une fiche réelle sans envoi) ; prochaine étape : **l'envoi réel de test par le CEO**, puis la discussion 38 (arbitrages : rôle TAILOR, suppressions ADMIN en dur, anniversaires, suite de la feuille de route).

---

## Concrete next action if I have…

### 15 minutes

CEO : checklist production du journal `SESSIONS-LOGS/26-10-10-002-37-informer-le-couturier.md` — couturier de test avec son propre numéro, envoi, lecture du PDF reçu, révocation.

### 1 hour

Checklists restantes des journaux 36 (Personnel, upload cliente) et 35 (compte ECOMMERCE), puis régénérer les guides `.docx`.

### Half a day

Discussion 38 (`docs/plan/sessions/DISCUSSION-38-ARBITRAGES-APRES-37.md`) : six décisions, une recommandation chacune.

---

## Don't get distracted by

- **Système de notifications** (templates, déclencheurs) — backlog depuis novembre 2025, pas demandé.
- **Bouton de paiement en double sur la facture** — cosmétique, après le rôle.
- **Application mobile** — en pause, la priorité est le CRM web.

---

## Constraints active today

- Le push ne déclenche pas toujours le build Easypanel : vérifier le conteneur, sinon webhook manuel (onglet Deployments du service). Les pushes de la 37 ont, eux, bien déclenché un build.
- Base sur `ssh zerosuite` (Swarm `cechemoi_postgres`), non exposée ; `.env` locaux pointent encore vers l'ancien hôte.
- Toute correction de données ambiguë passe par la validation du CEO.
- `npx @justethales/casp check` avant push.
