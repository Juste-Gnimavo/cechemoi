# Prochaine session — Recherche admin Phase 2 : données métier

## Contexte

Session 25 a livré le moteur de recherche admin `⌘K` sur **les pages** : un STAFF qui tape `nouvelle facture` arrive sur `/admin/invoices/new`, un MANAGER qui tape `transactions du mois` arrive sur le bon onglet de rapports. La palette indexe ~100 entrées statiques avec scoring tokenisé, filtrage par rôle, support des accents manquants. Code : `src/lib/admin-search/*` + `src/components/admin/admin-search.tsx`.

La V1 est volontairement hors-données. Or la friction réelle de la DG est souvent **"où est la facture FAC-2026-0142"** ou **"je cherche le client Konan Kouassi"** — pas une page abstraite mais une ligne précise dans la base. C'est le scope Phase 2.

---

## Objectif fonctionnel

Étendre la palette `⌘K` pour qu'elle puisse aussi répondre à :
- `FAC-2026-0142` → ouvrir `/admin/invoices/<id>`
- `Konan` → liste des clients matchant (top 5) + bouton "voir tous"
- `ORD-...` → ouvrir la commande boutique
- `CMD-SUR-...` ou nom de client suivi de "sur-mesure" → commandes sur-mesure du client
- Numéro de téléphone (avec ou sans indicatif) → fiche client

Deux mondes coexistent dans les résultats : entrées **Pages** (V1) et entrées **Données** (V2). Séparer visuellement par un header de section dans la liste.

---

## Investigation à mener

1. **Quels modèles indexer ?** Au minimum : `Customer`, `Invoice`, `Order` (boutique), `CustomOrder`. À confirmer : `Receipt`, `Expense` (par numéro ou intitulé), `Appointment`. Pas `Material` (trop granulaire). Lister ce que la DG cherche vraiment — j'irai poser la question avant de coder.
2. **Architecture côté serveur** : endpoint unique `/api/admin/search/data?q=...&types=customer,invoice` qui renvoie un payload typé `{ customers: [...], invoices: [...], orders: [...], customOrders: [...] }`. Limiter à 5 par type, 250ms max de query côté DB.
3. **Recherche full-text en Postgres** : `pg_trgm` est-il déjà activé sur la base prod ? Sinon, démarrer en `ILIKE %...%` sur les colonnes pertinentes (`name`, `phone`, `invoiceNumber`, `orderNumber`). Migration `pg_trgm` peut venir plus tard si la latence devient un sujet.
4. **UX dans la modale** :
   - Quand l'utilisateur tape, on lance EN PARALLÈLE le scoring local (instantané) + un fetch debouncé 200ms vers `/api/admin/search/data`
   - Affichage progressif : résultats Pages d'abord, puis section "Données" qui apparaît dès que le fetch revient
   - Indicateur de chargement subtil dans la section Données
5. **Permissions côté API** : l'endpoint doit re-filtrer par rôle. Un STAFF ne doit pas pouvoir lister les factures réservées ADMIN. Réutiliser `hasPermission` de `src/lib/role-permissions.ts`.

---

## Hors scope (à garder pour Phase 3)

- Historique de recherche, favoris
- Analytics des queries
- Recherche dans Materials, Notifications logs, blog posts
- Autocomplete inline en dehors de la palette

---

## Livrables attendus

1. Endpoint `GET /api/admin/search/data` typé + tests
2. Extension de `admin-search.tsx` : double section (Pages / Données), debounce, loading state, navigation clavier qui traverse les deux blocs
3. Log de session `SESSIONS-LOGS/26-ADMIN-SEARCH-DATA.md`
4. `NEXT-STEP.md` mis à jour

---

## Pré-requis avant la session

- Tester en prod la session 25 (10 intentions + 2 rôles), remonter les manques au registre (entrées `EXTRA_ENTRIES` à ajouter dans `src/lib/admin-search/registry.ts`)
- Décider si on veut activer `pg_trgm` dès la session 26 ou rester sur ILIKE pour V1.5

## État final de la session 25 (référence)

Voir `SESSIONS-LOGS/25-ADMIN-SEARCH-ENGINE.md`.

Push pending : l'intégralité de `src/lib/admin-search/`, `src/components/admin/admin-search.tsx`, refactor `src/components/admin-header.tsx`, migration `src/components/admin/category-tree-selector.tsx`.
