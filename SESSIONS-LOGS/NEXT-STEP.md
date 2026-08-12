# Prochaine session — Volet Personnel sur le shell propriétaire (gestion.cechemoi.com)

## Tâche principale

Ajouter un encart **Personnel** au shell propriétaire (`gestion.cechemoi.com`, capture : accueil à 6 tuiles) pour que la propriétaire gère son équipe : **voir la liste, ajouter, désactiver/réactiver, supprimer, voir les logs** — sur la base de l'existant, sans réécrire les pages métier.

### L'existant à réutiliser (vérifié en fin de session 28)

- **Page** `/admin/team` (`src/app/admin/team/page.tsx`, 657 lignes) : liste des membres ADMIN/MANAGER/STAFF, stats, création (POST `/api/admin/team`), branchée sur l'API réelle.
- **Page détail** `/admin/team/[id]`.
- **API** `/api/admin/team` (GET liste + stats, POST création) et `/api/admin/team/[id]` (PATCH activation/désactivation soft-delete avec motif, garde-fou « impossible de désactiver le dernier ADMIN actif », `deactivatedAt/ById/Reason` en base). `lastLoginAt` est tracké et renvoyé (`lastLogin`).
- **Session 21** : le système de désactivation vient de là (`SESSIONS-LOGS/21-TEAM-MEMBER-DEACTIVATION-AND-SMTP-FIX.md`).

### Clarifications du CEO (fin de session 28 — décisions prises, ne pas re-demander)

- **« Voir logs » = performances** : il s'agit de `/admin/staff-performance` (« Performance de l'Équipe » : clients créés, mensurations prises, dernière activité par membre — page existante, menu Équipe → Performance équipe).
- **« Supprimer » = DÉSACTIVER (soft delete), jamais de suppression physique.** Analogie du CEO à reprendre telle quelle dans l'UI : comme à la banque, on ne supprime pas le compte d'une caissière après son départ, on le désactive — sinon les enregistrements qu'elle a saisis perdent leur propriétaire et l'audit devient impossible. Désactivé = ne peut plus se connecter, mais tout son historique reste attribué.
- **À faire dans le CRM** : clarifier cette politique pour la propriétaire — encart d'information sur `/admin/team` (et/ou dans le hub Personnel) expliquant pourquoi « supprimer » s'appelle « désactiver », avec cette analogie. Vérifier le wording des boutons dans ce sens.

### Travail attendu

1. **Tuile « Personnel »** dans `src/lib/owner/tiles.ts` (flag `enabled: true`, une ligne — pattern session 27).
2. **Hub** `src/app/owner/personnel/page.tsx` sur le modèle des hubs existants (composant partagé `src/components/owner/owner-hub.tsx`, ~60 lignes) :
   - Action principale : Ajouter un membre (`/admin/team` — vérifier si le modal peut s'ouvrir en deep-link, sinon pointer la liste).
   - Cartes : Toute l'équipe (`/admin/team`), Performance de l'équipe (`/admin/staff-performance`), Gestion des couturiers (`/admin/tailors`) si pertinent pour elle.
   - Encart optionnel du hub : l'explication désactivation vs suppression (le composant `OwnerHub` supporte déjà un encart).
3. **Audit de `/admin/team` pour l'usage propriétaire** : responsive iPhone (elle utilise iPhone/iPad — le shell est compact, la page métier n'a pas été auditée), wording des actions (« Désactiver » + explication, pas « Supprimer »).
4. Toujours le principe session 27 : strict minimum visible, pages `/admin/*` réutilisées, pas de réécriture.

## Fait en session 28 (tout déployé, db push exécuté, scripts passés en prod)

- Mystère « Salaires des couturiers » élucidé (catégorie distincte + liste tronquée à 100) → pagination réelle + deep-links rapport → liste filtrée.
- `/admin/reports` : 7 onglets enrichis (KPI, barres %, dark mode), exports intacts.
- **Sous-catégories de dépenses** (`ExpenseCategory.parentId`, 1 niveau, roll-up liste + rapports + exports, selects optgroup).
- Rangement prod exécuté : doublons CAMARA/YANGO fusionnés, renommages (Livraison, Transport, accents), Wifi + Crédit d'appel → Communication, ordre logique appliqué. Salaires (3), Transport (1), Achats (5), Livraison (2) rattachés par le CEO.
- Fix affichage « 0 dépense(s) » (bug de mapping `_count` → `expensesCount`) ; compte réel affiché seulement si > 0.

## En attente (décisions propriétaire — à relancer)

- **Perleuse Rosette / Perleuse Marie chantale** : sous « Salaires » ou créer « Prestataires » ? (rattachement = 2 clics dans Caisse → Catégories)
- **CHEZ BRODY'S** : fournisseur de tissus ? → sous « ACHATS PAGNES ET TISSUS » ?

## Vérifications en attente (héritées)

- [ ] Aucun compte admin avec `twoFactorEnabled = true` en base.
- [ ] Responsive iPhone : `/admin/expenses/new`, `/admin/customers/new`, `/admin/custom-orders/new`.
- [ ] Fichiers session 26 non commités (package.json, package-lock.json, scripts/md-to-html.mjs, doc-web/*, RECRUTEMENT/, log 26) — committer ou écarter.

## Ensuite (file d'attente inchangée)

- Session UI polish (demander au CEO les 3-8 cibles visuelles précises avant de toucher quoi que ce soit).
- Phase 2 du moteur de recherche admin (recherche dans les données : factures, clients, commandes).
- Système de notifications (templates seed, triggers).
- Bouton « Fusionner » dans `/admin/expenses/categories` si le script CLI s'avère pénible.
