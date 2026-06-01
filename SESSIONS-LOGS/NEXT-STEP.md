# Prochaine session — Moteur de recherche intelligent admin

## Pourquoi

L'admin a maintenant **plus de 60 pages** : Tableau de bord, Clients, Rendez-vous, Sur-Mesure, Caisse (Factures, Reçus, Dépenses, Transactions, Ventes), Rapports (6 onglets), Boutique (Produits, Commandes, Catégories, Coupons, Inventaire, Avis), Communication, Équipe, Réglages (6 sous-onglets), Analytics (3 vues)…

Conséquence : **la DG, les Managers et le staff perdent du temps à chercher la bonne page.** Exemple typique : "comment voir les transactions encaissées du mois ?" → il faut savoir que c'est `/admin/reports?tab=transactions` ET sélectionner la période. Pareil pour "ajouter une dépense", "voir les avis clients", "lancer une campagne SMS".

Le CEO veut une **barre de recherche style Google sur l'admin** : on tape une intention en langage naturel, on a une liste de liens cliquables avec titre + description, comme un résultat de recherche.

---

## Objectif fonctionnel

Une barre de recherche placée en haut de chaque page admin (header ou raccourci clavier `Cmd+K`). Quand l'utilisateur tape :

- `transactions` → propose `/admin/reports?tab=transactions` ("Voir toutes les transactions encaissées")
- `comment voir les transactions du mois` → idem, plus éventuellement `/admin/transactions` et `/admin/receipts`
- `nouvelle facture` → propose `/admin/invoices/new` en premier
- `dépense électricité` → propose `/admin/expenses/new` puis `/admin/expenses?category=electricite`
- `pourcentage de réduction` → propose `/admin/coupons/new`
- `stock matières premières` → propose `/admin/materials` et `/admin/materials/reports`

Chaque résultat : **icône + titre + URL + description courte + rôle requis** (greyed-out si l'utilisateur n'a pas le rôle).

---

## Investigation à mener au démarrage

1. **Inventaire exhaustif des URLs admin**. Source de vérité primaire : `src/components/admin-header.tsx` (menu déjà structuré avec labels + `allowedRoles`). À compléter en scannant `src/app/admin/**/page.tsx`. Penser aux pages sous-jacentes (ex : `/admin/orders/[id]`) qui ne sont pas dans le menu mais accessibles.

2. **Statut du menu actuel**. Le menu admin est déjà bien organisé hiérarchiquement et porte des `allowedRoles`. Question : on ré-utilise les labels existants (canonique) ou on enrichit avec des tags / synonymes / descriptions ?

3. **Choix d'architecture** :
   - **(A) Index statique TS** dans le repo (`src/lib/admin-search/index.ts`) — chaque entrée = `{ path, title, description, keywords, icon, allowedRoles, query? }`. Recherche client-side avec `fuse.js` ou similaire. Avantages : zéro infra, instantané, marche offline. Inconvénient : maintenance manuelle quand on ajoute une page.
   - **(B) Génération automatique** depuis la structure de `src/app/admin/**/page.tsx` + des annotations `export const adminSearchMeta = {...}` dans chaque page. Avantage : pas d'oubli. Inconvénient : convention à imposer + script de build.
   - **(C) Recherche LLM côté serveur** — endpoint `/api/admin/search?q=...` qui balance la query à un modèle Claude avec la liste des URLs en prompt système. Avantage : compréhension naturelle (synonymes, fautes, paraphrases). Inconvénient : latence (~1s), coût API, dépendance externe.
   - **(D) Hybride A + C** : fuzzy local en premier (rapide), fallback Claude quand pas de match (~0 résultats). Le meilleur des deux mondes mais plus complexe.

   **Recommandation a priori** (à challenger en session) : **(A) avec champ `keywords` synonymes**, suffisamment rapide pour un admin de 60 pages. Si la DG trouve toujours pas, on passe en (D) plus tard.

4. **UX** : modale `Cmd+K` style Linear / Vercel, vs barre inline en header. Le `Cmd+K` est devenu standard et plus puissant (peut hoster d'autres actions comme "créer une facture", "voir mon profil") — recommandé.

5. **Permissions** : afficher les pages auxquelles l'utilisateur connecté n'a pas accès (en greyed-out avec le badge du rôle requis) ou les filtrer entièrement ? Argument pour les afficher : la DG saura qu'il peut demander accès. Argument contre : pollution. À trancher.

6. **Recherche par data** : on commence simple (juste URLs / actions statiques). Phase 2 éventuelle : la barre peut aussi chercher un client, une commande, une facture par numéro. Hors scope de cette session.

---

## Livrables attendus

1. **Plan d'implémentation** validé avant code (utiliser `ExitPlanMode`).
2. **Index des URLs admin** structuré dans `src/lib/admin-search/index.ts` (ou fichier équivalent) — exhaustif sur le primary menu + Rapports + Réglages + actions fréquentes (`new`, exports, etc.). Format minimum :
   ```ts
   {
     path: '/admin/reports?tab=transactions',
     title: 'Toutes les transactions encaissées',
     description: 'Union de tous les paiements reçus, par période',
     keywords: ['transactions', 'encaissé', 'cash flow', 'paiements reçus', 'trésorerie'],
     icon: 'TrendingUp',
     allowedRoles: ['ADMIN', 'MANAGER'],
     section: 'Rapports',
   }
   ```
3. **Composant `AdminSearch`** (`src/components/admin/admin-search.tsx`) — modale Cmd+K + raccourci clavier + état contrôlé.
4. **Intégration dans `admin-header.tsx`** ou layout — déclenchable depuis n'importe quelle page admin.
5. **Tests manuels** sur 10-15 intentions concrètes (voir la liste plus haut dans ce doc), documentés dans le log de session.

---

## Hors scope explicite

- Pas de recherche full-text dans les données (clients, factures par numéro, etc.) — Phase 2.
- Pas d'historique de recherche, pas de favoris — Phase 2.
- Pas de tracking analytics des requêtes — pourrait venir plus tard pour identifier les pages que la DG cherche le plus souvent et les promouvoir.
- Pas d'i18n — admin reste FR.

---

## Pré-requis avant la session

Le CEO doit pousser tous les fix de la session 24 actuellement en local (orphelins custom-order, retrait "En retard 0") **avant** que la prochaine session démarre. Sinon l'inventaire des URLs sera fait sur une base désynchronisée du déploiement prod.

## État final de la session 24 (référence)

Voir `SESSIONS-LOGS/24-FINANCIAL-FINETUNING-AND-DEDUP-FIXES.md`.
Push pending : `src/lib/finance/aggregations.ts`, `src/lib/exports/queries/transactions.ts`, `src/lib/exports/queries/invoices.ts`, `src/app/api/admin/custom-orders/stats/route.ts`.
