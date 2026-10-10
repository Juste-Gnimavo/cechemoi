---
status: queued
kind: discussion
session_id: pending
session_log: pending
drafted_at: 2026-10-10
next_after: 26-10-10-002-37-informer-le-couturier
---

# Discussion 38 — Arbitrages après « Informer le couturier »

> **Status : QUEUED. Kind : DISCUSSION.** Cette session est une conversation avec le CEO. Elle ne
> produit pas de code : elle produit des **décisions écrites** et **les prompts qui en découlent**.
>
> **Why now.** Les trois phases de la feuille de route (35, 36, 37) sont livrées. La file est
> vide, et plusieurs décisions CEO s'accumulent dans `SESSIONS-LOGS/NEXT-STEP.md` sans réponse.

**Project root.** `/Users/juste/Desktop/DOSSIER-BUREAU/PROJETS-ENCOURS/0-CECHEMOI-COM`
**Session log target.** `SESSIONS-LOGS/YY-MM-DD-NNN-38-arbitrages-apres-37.md` (`casp new log`).
**Decision record target.** `docs/decisions/2026-10-<jj>-arbitrages-apres-37.md`.

## CONTEXT — ce qui a changé depuis la rédaction

Rédigé à la clôture de la session 37 (commits `f9d2819`, `5fbb7fd`). La 37 a livré le bouton
« Informer le couturier » : fiche sans montant, PDF par jeton révocable (table `TailorBriefShare`).
**Préalable : la validation en production de la 37 par le CEO** (checklist du journal 37), à
faire avant ou en ouverture de cette discussion.

---

## HOW THIS SESSION RUNS

1. Lire `casp/now.md`, `casp/roadmap.md`, `SESSIONS-LOGS/NEXT-STEP.md` et le journal 37.
   **Rejouer chaque point différé dans le code** avant de le reprendre : il a pu être livré.
2. Pour chaque décision : une question, une recommandation, une ligne de compromis. L'agent
   prend position d'abord ; le CEO tranche.
3. Consigner chaque décision avec la raison qui a décidé.
4. Rédiger le ou les prompts produits (`casp new prompt --slug <slug>`), chaînés par
   `next_after`, et pointer `next_prompt` sur la tête.
5. Clôturer comme toute session : journal, état, `casp check` 0 FAIL, commit, push.

---

## WHAT REMAINS FROM THE ROADMAP (différés, à rejouer)

- **Permission `custom-orders` du rôle `TAILOR`** (`src/lib/role-permissions.ts`, bloc `TAILOR`) :
  `GET /api/admin/custom-orders/[id]` renvoie tous les montants. Différé en 37 tant qu'aucun
  couturier ne se connecte (aucun n'a de mot de passe).
- **Suppressions en `role === 'ADMIN'` en dur** (commandes, factures, reçus, étiquettes, journaux et
  modèles de notifications) : refusent le gérant. Noté en 36.
- **Âge des anniversaires** : « — » quand l'année de naissance manque. Noté en 36.
- **Guides `.docx` à régénérer** (`node build.js crm && node build.js boutique`) : contenu modifié
  en 36 et 37.
- **Déploiement Easypanel** : le push de la 37 a bien déclenché un build (constaté dans le
  conteneur). Le diagnostic « push sans build » de la 34 reste ouvert, peut-être sans objet.

---

## DECISIONS TO OBTAIN (une question, une recommandation chacune)

1. **Fuite latente du rôle `TAILOR`.** Expurger les montants dans l'API commande, ou retirer
   `custom-orders` et `production` du rôle `TAILOR` ?
   *Recommandation : les retirer.* Les couturiers ne se connectent pas : ils reçoivent la fiche
   par WhatsApp depuis la 37. Une ligne ferme la fuite ; l'expurgation coûte une session et
   sert un usage qui n'existe pas. Compromis : si un jour les couturiers ont un accès, il faudra
   un écran dédié, pas l'écran d'administration.

2. **Suppressions en ADMIN codé en dur.** Les passer sur des permissions `*.delete` de la matrice ?
   *Recommandation : oui, en une session courte.* C'est la règle d'architecture « aucun tableau de
   rôles en dur » ; le gérant (`MANAGER: '*'`) récupère ces droits sans autre changement.

3. **Anniversaire sans année.** Accepter une date JJ-MM (schéma : jour et mois, année facultative) ?
   *Recommandation : oui, mais seulement si la propriétaire envoie réellement des vœux sans connaître
   l'année.* Sinon, laisser « — ». Lui poser la question avant d'écrire le prompt.

4. **Fiche de suivi confection.** Elle contient le coût des matières. Ajouter sur le PDF la mention
   « Document interne, ne pas remettre au couturier » ?
   *Recommandation : oui, c'est un changement d'une ligne.* Le guide CRM le dit déjà depuis la 37,
   mais le papier imprimé circule sans le guide.

5. **La prochaine feuille de route.** Candidats : lot 2 des retours de la propriétaire,
   système de notifications (`SESSIONS-LOGS/08-…`), application mobile (en pause), polissage de
   l'interface.
   *Recommandation : le lot 2 de la propriétaire d'abord.* Ce sont des irritants réels d'une
   utilisatrice active ; les notifications et le mobile n'ont pas de demande exprimée. Compromis :
   le lot 2 dépend de ce que le CEO recueille, la session ne peut démarrer qu'avec la liste.

6. **Désignation de la cliente sur la fiche couturier.** La 37 a dû s'écarter de « prénom
   seulement » : 369 noms commencent par une civilité, et l'ordre prénom/nom est libre. Règle
   livrée : civilité + mot suivant, sinon premier mot (« Mme Konan », « Christiane »).
   *Recommandation : la garder.* Un vrai champ prénom séparé coûterait une migration de 369+ fiches
   à la main pour un gain nul côté couturier. Compromis : un nom saisi « NOM Prénom » sort en
   « NOM », c'est-à-dire le nom de famille, jamais le téléphone.

*Distribution et prix (sections génériques du modèle) : sans objet ici. La boutique et le CRM sont
en production pour une seule cliente, la propriétaire.*

---

## DO NOT

- **Ne pas écrire de code produit pendant cette session.**
- **Ne pas lancer ce prompt sans le CEO** (pas de mode headless).
- **Ne laisser aucune décision implicite.** « On verra » devient un différé avec un responsable et
  une date.

---

## AT END OF SESSION

1. Décisions consignées, une entrée par décision, avec la raison qui a décidé.
2. Prompts produits rédigés, chaînés, `next_prompt` sur la tête.
3. Journal de session : `casp new log --slug 38-arbitrages-apres-37`, puis le remplir.
4. `casp/state.json`, `casp/now.md`, `casp/roadmap.md` et `SESSIONS-LOGS/NEXT-STEP.md` à jour.
5. `casp check` 0 FAIL. Commit, push.
