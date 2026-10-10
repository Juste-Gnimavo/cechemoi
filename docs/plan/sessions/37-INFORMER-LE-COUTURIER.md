---
status: shipped
session_id: 26-10-10-002-37-informer-le-couturier
session_log: SESSIONS-LOGS/26-10-10-002-37-informer-le-couturier.md
drafted_at: 2026-10-08
next_after: 36-etancheite-financiere-personnel
---

# Session 37 — Bouton « Informer le couturier » sur la commande sur mesure

> **Status : QUEUED.** Rédigé à la clôture de la session 34 (commit `911482f`) à la demande du CEO.
>
> **Goal.** Sur la fiche d'une commande sur mesure, un bouton « Informer le couturier » ouvre un aperçu de ce qui part au couturier (articles, mesures, pièces jointes, échéances, **aucun montant**), puis l'envoie par WhatsApp sur action manuelle.
>
> **Why now.** L'équipe transmet aujourd'hui ces informations à la main au couturier, avec le risque d'oublier une mesure ou de laisser voir un prix.

**Project root.** `/Users/juste/Desktop/DOSSIER-BUREAU/PROJETS-ENCOURS/0-CECHEMOI-COM`
**Branch.** `main` (push = déploiement Easypanel ; vérifier qu'un build part, sinon webhook manuel — voir session 34).
**Session log target.** `SESSIONS-LOGS/37-INFORMER-LE-COUTURIER.md`.
**Expected size.** Demi-journée à une journée. Changement de schéma probable (jeton de partage, trace d'envoi) → `npx -y prisma@5.22.0 db push` depuis le conteneur après déploiement.

---

## RÈGLE NON NÉGOCIABLE

**Le couturier ne voit jamais un montant** : ni prix d'article, ni total, ni acompte, ni reliquat, ni coût matériel, ni coût unitaire de matière. La garantie doit être **structurelle**, pas un oubli évité à l'écran : le constructeur de données de la fiche couturier sélectionne ses champs explicitement (`select`), sans aucun champ monétaire, et le PDF comme le texte WhatsApp ne reçoivent que cet objet. La fiche de suivi existante (`src/lib/fiche-suivi-confection-pdf-generator.ts`) **contient des prix** (matières : prix unitaire, coût total) : ne pas la réutiliser telle quelle.

---

## CONTEXTE (vérifié en session 34)

- **Assignation par article** : chaque `CustomOrderItem` a son `tailorId` (sélecteur « Non assigné » sur la fiche commande). Une commande peut donc concerner plusieurs couturiers.
- **Couturiers** : `User` de rôle `TAILOR` (7 actifs, aucun avec mot de passe — ils ne se connectent pas au CRM). Numéros : `phone`, `whatsappNumber` (prioritaire s'il existe).
- **Mesures** : `CustomOrder.measurementId` → `CustomerMeasurement`.
- **Pièces jointes** : `CustomOrderAttachment` (`fileUrl`, `fileType`, `category` : document, image, audio, video).
- **Matières** : affectations de matières à la commande, avec quantités et coûts (les coûts sont exclus).
- **WhatsApp** : uniquement via le proxy smsing / Baileys (`src/lib/smsing-service.ts`, `sendWhatsAppBusiness({ to, message, mediaUrl })`), **un seul fichier par message**, transmis par URL publique. Jamais le Cloud API (aucun template approuvé — mémoire projet).
- **Modèle d'URL publique** déjà utilisé : la facture client est envoyée via `${baseUrl}/api/invoices/${invoiceId}/pdf`.
- **Faille latente** : la permission `custom-orders` du rôle `TAILOR` donne accès à `GET /api/admin/custom-orders/[id]`, qui renvoie tous les montants. Sans conséquence aujourd'hui (aucun couturier ne peut se connecter), à fermer si on donne un jour des accès aux couturiers.

---

## DÉCISIONS DU CEO (08/10/2026) — tranchées, ne pas les rouvrir

1. **Plusieurs couturiers sur une commande** : *un envoi par couturier, avec seulement ses articles.* Dans la réalité, plusieurs couturiers travaillent sur une même commande. Un article non assigné bloque l'envoi pour cet article, avec un message « assignez un couturier ».
2. **Identité de la cliente** : *prénom et numéro de commande seulement*, jamais son téléphone.
3. **PDF** : servi par une URL publique à **jeton aléatoire révocable** (pas l'id de la commande). Format retenu sans objection du CEO : un message WhatsApp texte court + le PDF « Fiche couturier » (mesures, articles, photos du modèle intégrées, matières sans coût, échéances).
4. **Moment** : *uniquement depuis la fiche commande*, pas à la création (`/admin/custom-orders/new`), où les couturiers ne sont pas encore assignés.

5. **Qui peut envoyer** : *la permission existante `production`*, soit Administrateur, Manager et Personnel (les couturiers n'ont pas de mot de passe ; le rôle `ECOMMERCE` ne l'a pas). Pas de permission dédiée : c'est le Personnel qui crée les commandes et assigne les couturiers, et le contenu envoyé ne comporte aucun montant.

---

## SCOPE

### MUST HAVE

1. **Constructeur de données** `buildTailorBrief(customOrderId, tailorId)` (`src/lib/…`) : objet sans aucun champ monétaire, `select` explicite. C'est la seule source du texte et du PDF.
2. **PDF « Fiche couturier »** : générateur distinct (inspiré de la mise en page de la fiche de suivi, sans ses tableaux de prix). Photos du modèle intégrées si les pièces jointes sont des images.
3. **Route publique** du PDF par jeton (nouveau champ ou nouvelle table, `db push`), révocable, sans authentification, ne renvoyant que la fiche.
4. **Bouton « Informer le couturier »** sur `src/app/admin/custom-orders/[id]/page.tsx` → fenêtre d'aperçu : couturier destinataire et son numéro, texte exact du message, aperçu du PDF, champ « Note pour le couturier » facultatif, bouton « Envoyer ». Rien ne part sans ce clic.
5. **Route d'envoi** `POST /api/admin/custom-orders/[id]/notify-tailor` : garde `denyUnlessPermitted(session, 'production')` (décision 5) ; le bouton est masqué sans cette permission, envoi via `sendWhatsAppBusiness`, erreurs remontées clairement (numéro manquant, proxy indisponible).
6. **Trace** : entrée d'historique sur la commande (« Couturier informé : <nom> », auteur, date) et indication « Dernier envoi le … » à côté du bouton ; un renvoi reste possible.

### SHOULD HAVE

- Test automatisé ou assertion de typage montrant que l'objet du brief ne contient aucune clé monétaire (`unitPrice`, `totalCost`, `price`, `amount`, `materialCost`…).
- Section dans le guide CRM (`doc-web/guides-utilisateurs/content-crm.js`).

### DEFER

- Envoi automatique à l'assignation d'un couturier (explicitement refusé : l'envoi reste manuel).
- Expurgation des montants pour le rôle `TAILOR` dans l'API commande, tant qu'aucun couturier n'a d'accès.

---

## VALIDATION

- `npx tsc --noEmit` vert.
- En production, sur une commande de test assignée à un couturier dont le numéro est celui du CEO : aperçu conforme, message et PDF reçus sur WhatsApp, **aucun montant nulle part** (lire le PDF reçu), entrée d'historique créée, lien PDF inaccessible après révocation.
- Journal écrit, `casp/state.json` et `SESSIONS-LOGS/NEXT-STEP.md` à jour, `casp check` vert.

---

## Rappels de discipline (CLAUDE.md global §19-21)

Lire par plage (`grep -n` puis `sed -n`), éditer chirurgicalement, borner toute sortie de commande à ~20 lignes (`> /tmp/out.log 2>&1; echo "exit=$?"`). Accès base : `ssh zerosuite` puis `docker exec` dans `cechemoi_postgres`.
