# Session 21 — Désactivation des membres d'équipe & correction SMTP

**Date** : 2026-05-11
**Focus** : Cycle de vie des membres d'équipe (sans casser l'audit), corrections password reset, recherche équipe
**Commits** : `ee28af3`, `c5ae578` sur `main`

---

## Contexte

Le bouton "Supprimer" de `/admin/team` appelait `prisma.user.delete()`. Trois FKs requises sur le modèle User sans `onDelete: SetNull` rendaient ce delete silencieusement cassé en production dès qu'un membre avait créé une commande sur-mesure, un article de blog ou une campagne push :
- `CustomOrder.createdById` (requis)
- `BlogPost.authorId` (requis)
- `PushCampaign.createdBy` (requis)

Même avec SetNull, perdre le nom du staff sur les factures historiques anéantirait l'audit (raison citée par le CEO). Décision : **soft-delete uniquement**. Aucun hard delete, aucun reshuffle de FK. Le nom reste, l'accès est révoqué.

Bonus découvert pendant le test : la fonction "Mot de passe oublié" envoyait un 200 OK mais l'email n'arrivait jamais. Diagnostic SMTP en direct → Postmark rejetait silencieusement à cause du header `From`.

---

## Travaux réalisés

### 1. Schéma — flags de désactivation sur `User`

Ajout sur `User` (lignes 89-93 du schéma) :
- `isActive: Boolean @default(true)`
- `deactivatedAt: DateTime?`
- `deactivatedById: String?` (pas de FK — chaîne brute comme `createdByStaffId`)
- `deactivationReason: String?`
- `@@index([isActive])`

Appliqué via `npx prisma db push` (le CEO maintient la prod hors-migrations, donc pas de `migrate dev`).

### 2. Gates d'authentification

Trois flux bloquent désormais les comptes désactivés :

| Fichier | Gate ajouté |
|---------|-------------|
| `src/lib/auth-phone.ts` — provider `credentials` | Throw `Compte désactivé...` après vérification mot de passe |
| `src/lib/auth-phone.ts` — provider `admin-2fa` | Même check après récupération de l'utilisateur post-OTP |
| `src/lib/auth-phone.ts` — callback `jwt` (trigger=update) | Strip le `role` si désactivé → admin guards rejettent au refresh suivant |
| `src/app/api/auth/forgot-password/route.ts` | Réponse générique "success" mais aucun token créé (pas de fuite d'info) |
| `src/app/api/auth/reset-password/route.ts` (GET + POST) | `isActive: true` dans le `where` |
| `src/app/api/auth/admin-2fa/send/route.ts` | 403 avant envoi de l'OTP |

### 3. API équipe — `DELETE` → `PATCH`

`src/app/api/admin/team/[id]/route.ts` :
- `DELETE` supprimé entièrement (commentaire en tête explique pourquoi).
- `PATCH` ajouté : `{ isActive: boolean, reason?: string }`.
  - ADMIN uniquement.
  - Interdit de modifier son propre statut.
  - Garde "dernier admin actif" : refuse de désactiver le dernier ADMIN restant.
  - Sur désactivation : remplit `deactivatedAt`, `deactivatedById`, `deactivationReason`.
  - Sur réactivation : remet `isActive: true` et vide les trois champs.

`src/app/api/admin/team/route.ts` (liste) : retourne `isActive` + `deactivatedAt`, ordonne actifs en premier, stats splittent `total` (actifs) vs `disabled`.

`src/app/api/admin/team/[id]/activity/route.ts` : retourne les champs de désactivation + résout `deactivatedByName` pour le bandeau.

### 4. UI — `/admin/team` (liste)

- Colonne **Statut** avec pill verte "Actif" / grise "Désactivé".
- 5e carte stat **Désactivés**.
- Toggle **Afficher les membres désactivés** (off par défaut).
- **Champ de recherche** (nom, email, téléphone, rôle) avec bouton clear et état "Aucun résultat pour « ... »".
- Boutons `Power` / `PowerOff` remplacent `Trash2`.
- Modal de désactivation avec textarea optionnel pour le motif.
- Lignes désactivées en `opacity-60`.

### 5. UI — `/admin/team/[id]` (détail)

- **Bandeau rouge** en tête quand `isActive === false` : date + auteur de la désactivation + motif + rappel que l'historique est préservé.
- Pill de statut à côté du badge de rôle.
- Bouton **Désactiver** / **Réactiver** dans le header (ADMIN uniquement, masqué sur son propre profil).
- Même modal que sur la liste pour saisir le motif.

### 6. SMTP — fix Postmark

Diagnostic : `verify()` OK, send direct depuis `contact@cechemoi.com` OK (`250 queued`). Mais le code construisait le `From` avec `SMTPREPLYTO || SMTPUSERNAME` :
- `SMTPREPLYTO` = ` cechemoicreations@gmail.com` (espace en tête) → Postmark rejette : pas une Sender Signature vérifiée.
- `SMTPUSERNAME` = token UUID Postmark → invalide comme email.

Fix `src/lib/email-service.ts` :
- Priorité : `SMTPFROM` → `SMTPREPLYTO` → `SMTPUSERNAME` (avec `.trim()` défensif).
- Logs étoffés (code Postmark + response visible dans les erreurs futures).
- L'espace en tête de `SMTPREPLYTO` a aussi été corrigé par le CEO dans les env de prod.

### 7. Redirections password reset

Les pages `forgot-password` et `reset-password` redirigeaient vers `/auth/login` (flux client) au lieu de `/auth/admin` (flux administrateur). Corrigé partout (success modal, fallbacks d'erreur, liens "Retour à la connexion").

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | +4 champs sur `User` + index |
| `src/lib/auth-phone.ts` | Gates sur 3 endroits (credentials, admin-2fa, jwt) |
| `src/lib/email-service.ts` | Priorité `SMTPFROM`, trim, logs |
| `src/app/api/admin/team/route.ts` | List : `isActive`, stats split, ordre |
| `src/app/api/admin/team/[id]/route.ts` | `DELETE` → `PATCH` avec gardes |
| `src/app/api/admin/team/[id]/activity/route.ts` | Expose champs désactivation + résout nom |
| `src/app/api/auth/forgot-password/route.ts` | Gate `isActive` |
| `src/app/api/auth/reset-password/route.ts` | Gate `isActive` (GET + POST) |
| `src/app/api/auth/admin-2fa/send/route.ts` | Gate `isActive` avant OTP |
| `src/app/admin/team/page.tsx` | Recherche + statut + filtre + modal + toggle |
| `src/app/admin/team/[id]/page.tsx` | Bandeau + toggle + modal |
| `src/app/auth/forgot-password/page.tsx` | `/auth/login` → `/auth/admin` |
| `src/app/auth/reset-password/page.tsx` | `/auth/login` → `/auth/admin` |

---

## Vérifications

- `npx prisma db push` ✅ (synchronisé)
- `npx prisma generate` ✅
- `npx tsc --noEmit` ✅ (exit 0)
- Test SMTP direct vers `dg@just.ci` ✅ (Postmark `250 queued`)
- Email de test reçu par le CEO ✅
- Reset password fonctionnel après fix ✅
- Désactivation membre fonctionnelle ✅

---

## Décisions notables

1. **Soft-delete only, jamais de hard delete.** Argument tenu fermement : un staff effacé = factures avec auteur NULL pour l'éternité. Le CEO a accepté immédiatement.
2. **Pas de reshuffle FK.** Avec soft-delete, toutes les FKs (requises ou optionnelles, `SetNull` ou pas) restent valides puisque la ligne User n'est jamais supprimée. Aucune migration de contraintes nécessaire.
3. **Trade-off session existante.** Le check `isActive` dans le JWT callback ne s'exécute qu'au `trigger='update'`. Un membre désactivé garde son onglet ouvert jusqu'au prochain refresh de session (≤ 30 jours JWT maxAge). Pour révocation immédiate inter-onglets, il faudrait propager `isActive` dans chaque guard de route admin — différé.
4. **`db push` au lieu de `migrate dev`.** Le CEO maintient la prod avec des changements hors-bande, donc les migrations divergeraient. Validé explicitement.

---

## Pistes différées

- **Anonymisation PII** (effacer `name`/`email`/`phone`/`password` tout en gardant `id` + `role` + `isActive=false`) — utile si demande RGPD d'un ex-employé. Pas demandé en v1.
- **Enforcement `isActive` côté serveur sur toutes les routes admin** — un `requireActiveAdmin()` central qui combine `getServerSession` + lookup DB. Pour révocation immédiate sans attendre refresh JWT.

---

**Statut** : ✅ Déployé en production, validé par le CEO.
