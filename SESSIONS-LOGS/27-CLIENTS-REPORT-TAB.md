# Session 27 — Onglet « Clients » dans les rapports financiers

## Objectif

Ajouter un onglet **Clients** à `/admin/reports` listant les métriques CRM de chaque
client, filtrables par période (aujourd'hui, 7j, 30j, 12 mois, personnalisé) — au même
titre que les six familles comptables existantes.

---

## Décisions stratégiques (prises avant code)

1. **Réutiliser l'architecture des familles financières plutôt qu'une page séparée.**
   Le contrat existant (résumé + colonnes + lignes + pagination + période + exports
   Excel/PDF) couvre exactement le besoin. `clients` devient une 7ᵉ `FinancialFamily`.
   Aucun nouveau pipeline d'export à écrire — les générateurs Excel/PDF sont pilotés par
   `columns`, donc agnostiques de la famille.

2. **Filtre « Base période » (`dateBasis`) — décision clé.** Filtrer les clients
   uniquement par date d'inscription rendrait les vues « aujourd'hui / cette semaine »
   quasi vides (peu d'inscriptions quotidiennes) — donc inutiles pour un CRM. Deux
   lectures sont offertes :
   - `registered` (défaut) : clients **inscrits** sur la période (cohorte d'acquisition).
   - `active` : clients ayant **payé** au moins une commande sur la période (engagement).
   C'est ce qui rend le filtrage par période réellement exploitable au jour le jour.

3. **Revenu = commandes encaissées uniquement (`paymentStatus = COMPLETED`).** Cohérent
   avec la discipline des autres rapports (CA réalisé, pas le pipeline). Les métriques par
   client (LTV, panier moyen, nb de commandes payées, dernière commande) sont toujours
   calculées sur la **vie entière** ; la période ne fait que sélectionner quels clients
   apparaissent — colonnes stables quel que soit le mode.

4. **Seuils de segmentation alignés sur `/api/admin/customers/stats`.** VIP = 5+ commandes
   ou 100k+ FCFA ; Fidèle = 2+ commandes ; Inactif = a déjà acheté mais rien depuis 90j.
   Pas de redéfinition divergente des segments d'un écran à l'autre.

5. **Calcul en mémoire borné à la cohorte.** Comme la route stats existante, mais on ne
   charge que les clients de la cohorte (inscrits OU actifs sur la période) avec leurs
   commandes — pas toute la base. Tri par valeur décroissante, pagination en mémoire.

---

## Livrables

### Fichier créé

| Fichier | Rôle |
|---|---|
| `src/lib/exports/queries/clients.ts` | Query helper de la famille `clients` : cohorte, métriques LTV/panier/segments, filtre segment, résumé (Vue d'ensemble, Valeur, Segments, Acquisition par source), pagination. |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/lib/exports/types.ts` | `'clients'` ajouté à `FinancialFamily` ; champs `dateBasis` / `segment` sur `ReportFilters` ; titre dans `FAMILY_TITLES`. |
| `src/lib/exports/queries/index.ts` | Dispatch + ré-export de `fetchClientsReport`. |
| `src/app/api/admin/reports/financial/[family]/route.ts` | `clients` dans `ALLOWED` ; forward `dateBasis` / `segment`. |
| `src/app/api/admin/reports/financial/export/route.ts` | Idem (export Excel/PDF). |
| `src/components/admin/ExportButtons.tsx` | `'clients'` dans l'union locale + `dateBasis` / `segment` dans les filtres. |
| `src/app/admin/reports/page.tsx` | Onglet « Clients » (icône `Users`), sous-filtres `dateBasis` / `segment`, défaut `dateBasis=registered`. |
| `src/lib/admin-search/registry.ts` | Entrée ⌘K `/admin/reports?tab=clients` (nav + mots-clés CRM/LTV/VIP/segments). |

---

## Colonnes du tableau

Client · Téléphone · Email · Ville · Inscription · Cmd. payées · Total dépensé · Panier
moyen · Dernière cmd. · Fidélité (tier) · Segment.

## Résumé (4 blocs)

1. **Vue d'ensemble** — nb clients de la cohorte, dont nouveaux inscrits, commandes payées cumulées.
2. **Valeur (CA réalisé, vie entière)** — total dépensé, LTV moyenne, panier moyen.
3. **Segments** — VIP, Fidèles, Une seule commande, Sans achat, Inactifs.
4. **Acquisition** — répartition par source déclarée (`howDidYouHearAboutUs`).

---

## Points d'attention / dette potentielle

- **Calcul en mémoire** : adapté à l'échelle actuelle (boutique, quelques milliers de
  clients) et cohérent avec la route stats existante. Si la base grossit fortement,
  basculer vers des agrégats SQL paginés côté DB.
- L'en-tête de page reste « Rapports financiers » ; l'onglet Clients est une dimension
  CRM greffée dessus à la demande de la DG, pas une famille comptable stricto sensu.
- Build non lancé en fin de session (préférence CEO : pas de build intermédiaire).
