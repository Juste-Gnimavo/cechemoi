# Session 25 — Moteur de recherche admin (Cmd+K)

## Objectif

Donner à la DG, aux Managers et au staff un raccourci `⌘K` qui ouvre une palette de commandes à la Linear/Vercel : on tape une intention en langage naturel, on a une liste de liens cliquables filtrés par rôle.

Le moteur indexe l'intégralité du menu admin (~100 entrées) + des variantes utiles (onglets de Rapports, status de commandes, pages d'actions clés) et tolère les fautes d'accents — un STAFF qui tape `depense electricite` doit pouvoir tomber sur `/admin/expenses/new`.

---

## Décisions strategiques (validées avant code)

1. **Index statique TS, scorer maison**. Pas de fuse.js, pas de cmdk, pas d'LLM serveur. ~100 entrées, ~50 LOC de scoring tokenisé — instantané, zéro nouvelle dépendance.
2. **Source de vérité unique**. Le menu (~250 lignes) sort de `admin-header.tsx` et passe dans `src/lib/admin-search/registry.ts`. `AdminHeader` ET `AdminSearch` consomment le même `MENU`. Une page ajoutée = une seule entrée à toucher.
3. **Filtrage strict par rôle**. STAFF/TAILOR ne voient que ce qu'ils peuvent ouvrir (pas de greyed-out). Cohérent avec `filterMenuByRole` qui pilotait déjà le menu visible.
4. **UX**. Modale ⌘K + bouton trigger dans le header (chip `⌘K`). Bouton icône seul sur mobile/tablet.

---

## Livrables

### Fichiers créés

| Fichier | Rôle | LOC |
|---|---|---|
| `src/lib/admin-search/normalize.ts` | NFD + strip diacritics + tokenisation | ~18 |
| `src/lib/admin-search/registry.ts` | `MENU` + `SEARCH_ENTRIES` + `filterMenuByRole` + `DEFAULT_SUGGESTIONS` | ~650 |
| `src/lib/admin-search/search.ts` | `searchAdmin(query, role)` — scoring tokenisé + cache des entrées indexées | ~100 |
| `src/components/admin/admin-search.tsx` | Modale Cmd+K : input, liste, navigation clavier, footer raccourcis | ~200 |

### Fichiers modifiés

- **`src/components/admin-header.tsx`** : 907 → 684 lignes
  - Suppression du tableau `allMenuItems` inline + `filterMenuByRole` local + types inline
  - Import de `MENU`, `filterMenuByRole`, types depuis `@/lib/admin-search/registry`
  - Nettoyage des imports lucide (de 38 icônes à 11)
  - Ajout : état `searchOpen`, listener global `⌘K / Ctrl+K` (toggle), bouton trigger desktop (texte + chip) + mobile (icône), montage de `<AdminSearch>` en fin de header
- **`src/components/admin/category-tree-selector.tsx`** : remplace la fonction locale `normalizeSearch` par l'import depuis le module partagé `@/lib/admin-search/normalize`.

---

## Couverture du moteur

- ~75 entrées dérivées automatiquement du `MENU` (tous les liens du header)
- 14 entrées additionnelles dans `EXTRA_ENTRIES` :
  - Marketing, Analytics (+ produits / revenus)
  - Ventes du jour / semaine / mois / année
  - Création coupon, création matière première
  - Mouvements de stock boutique, Avis, TVA, Sécurité du compte
- Variantes query-string déjà présentes dans le menu :
  - `/admin/reports?tab=…` × 6
  - `/admin/orders?status=…` × 3
  - `/admin/appointments?status=…` × 3
  - `/admin/receipts?today=true`

Chaque entrée porte un titre canonique, une description courte, un tableau `keywords` (synonymes sans accents pour économiser des doublons) et un `allowedRoles[]`. Quelques entrées portent aussi `action: 'create' | 'configure' | 'view'` pour l'icône à droite.

---

## Algorithme de scoring

Pré-indexation au chargement : pour chaque `SearchEntry`, on stocke tokens(title), tokens(description), tokens(keywords), tokens(path) et le titre normalisé complet.

Query normalisée + tokenisée. Stop-words FR triviaux ignorés (`de, la, le, les, des, du, comment, voir, pour, …`) sauf si la query n'a que des stop-words.

Score additif :
- titre normalisé strictement égal à la query : +20
- titre contient la query (>=3 chars) : +8
- token de query = token de titre : +5
- token de query = prefix d'un token de titre (>=3 chars) : +3
- token de query dans `keywords` : +4 (prefix +2)
- token de query dans description : +2
- token de query dans path : +1
- bonus quand tous les tokens ont matché : +5

Top 10 retourné. Si query vide, on renvoie les 5 suggestions par défaut (`DEFAULT_SUGGESTIONS`).

Pas de fuzzy distance — V1 délibérément. Si la DG rapporte régulièrement des typos qui ratent, on rajoute une passe Levenshtein en fallback.

---

## UX de la palette

- Ouverture : bouton header OU raccourci global `⌘K / Ctrl+K` (toggle)
- Fermeture : `Esc` OU clic sur backdrop OU bouton X
- Navigation : `↑ ↓` change l'élément actif, `↵` ouvre, scroll-into-view automatique
- Hover souris = même chose que clavier (highlight + active index synchronisé)
- État vide (query=`''`) : "Suggestions" — 5 raccourcis courants pré-définis
- Zéro résultat : suggestion textuelle d'exemples (`transactions`, `facture`, `dépense`)
- Footer : kbds `↑↓`, `↵`, `esc` + compteur résultats
- Dark mode supporté nativement (tokens `dark:bg-dark-800`, `dark:border-dark-700`, etc.)
- Responsive : trigger desktop en chip texte, trigger mobile/tablet en icône seule

---

## Tests manuels prévus (à dérouler par le CEO)

```bash
npm run dev
# http://localhost:3000/admin
```

| # | Frappé | Attendu (1er résultat) |
|---|---|---|
| 1 | `transactions` | `/admin/reports?tab=transactions` |
| 2 | `comment voir les transactions du mois` | `/admin/reports?tab=transactions` ou `/admin/transactions` |
| 3 | `nouvelle facture` | `/admin/invoices/new` |
| 4 | `depense electricite` | `/admin/expenses/new` |
| 5 | `pourcentage reduction` | `/admin/coupons/new` |
| 6 | `stock matieres` | `/admin/materials` |
| 7 | `ventes du jour` | `/admin/sales/today` |
| 8 | `recus aujourdhui` | `/admin/receipts?today=true` |
| 9 | `campagne sms` | `/admin/campaigns/sms` |
| 10 | `parametres boutique` | `/admin/settings` |

Tests rôles :
- Login STAFF : `dépenses` ne doit pas exposer `/admin/expenses/reports` (ADMIN/MANAGER only) ni les rapports financiers
- Login TAILOR : seules les entrées Tableau de bord, Rendez-vous, Sur-Mesure (Commandes), Production doivent matcher

---

## Risques / dette restante

1. **Pages détail dynamiques** (`/admin/orders/[id]`, `/admin/customers/[id]`, etc.) — hors scope V1 car nécessitent la donnée. Phase 2 : on pourra ajouter une recherche server-side `/api/admin/search/data?q=…` pour matcher numéros de facture, noms de clients, refs commandes.
2. **Mise à jour du registre quand le menu change** — c'est la dette unique acceptée. Documentée ici. Toute nouvelle page admin → ajouter une `SubMenuItem` dans `MENU` (ou un `SearchEntry` dans `EXTRA_ENTRIES`) + idéalement quelques `keywords` dans `ENRICHMENTS`.
3. **Pas de fuzzy distance** — typos comme `transcations` ne matchent pas aujourd'hui. À mesurer en usage réel avant d'ajouter.
4. **Pas d'analytics des queries** — on ne sait pas ce que la DG cherche le plus. Phase 2 si pertinent : log côté serveur des queries qui retournent 0 résultats.

---

## Vérification end-to-end

Pas de build/typecheck en cours de session (per memory `feedback_no_intermediate_builds`). Le CEO lance `npm run dev`, fait passer les 10 tests ci-dessus + tests rôles, puis `npm run build` une fois si tout est OK.

Si une régression visuelle du menu apparaît après le refactor : `git diff src/components/admin-header.tsx` puis revert ciblé. Le menu visible doit être identique à avant — seules les sources changent.
