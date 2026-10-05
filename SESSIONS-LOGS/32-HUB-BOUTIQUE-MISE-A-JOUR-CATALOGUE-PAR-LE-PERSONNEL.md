# Session 32 — Hub « Boutique en ligne » : mise à jour du catalogue par le Personnel

**Date** : 05/10/2026
**Déclencheur** : capture de `gestion.cechemoi.com/owner/boutique` — le hub ne proposait que « Vendre au comptoir », « Commandes du site » et « Produits ». Demande : permettre aux employés de mettre à jour la boutique en ligne.

---

## 1. Constat

La matrice de droits (session 31) accorde déjà au Personnel tout ce qu'il faut pour
entretenir le catalogue : `products.manage`, `categories.manage`, `inventory.adjust`,
`media`, `reviews.moderate`. Le serveur acceptait, mais le shell propriétaire ne
proposait aucun chemin vers ces écrans. Le Personnel devait connaître les URL de
l'admin complet.

Deuxième constat, plus gênant : **`POST /api/admin/inventory/adjust` n'était appelé
par aucun écran**. Cette route est la seule qui enregistre un `StockMovement`
(qui, quand, combien, pourquoi). La seule façon de changer le stock d'une tenue
était le champ « stock » de la fiche produit, dont le `PUT` modifie la quantité
**sans aucun mouvement** : l'historique `/admin/inventory/movements` ne voyait
jamais les arrivages ni les pertes. Même doctrine que les matériels (session 25 :
« l'historique ne se modifie jamais, on corrige par un mouvement motivé »), mais
sans l'outil.

## 2. Travaux réalisés

### 2.1 `OwnerHub` — actions filtrées par permission

`src/components/owner/owner-hub.tsx` : `OwnerHubAction.permission?: Permission`,
même convention que les tuiles de l'accueil. Le hub lit le rôle de la session et
masque les actions non permises. Un hub ne doit jamais proposer une action que
le serveur refusera (c'était exactement le bug des factures en session 31).

### 2.2 Hub « Boutique en ligne » enrichi

`src/app/owner/boutique/page.tsx`, de 3 à 9 actions :

| Action | Cible | Permission | Personnel |
|---|---|---|---|
| Vendre au comptoir (principale) | `/admin/orders/new` | — | oui |
| Ajouter une tenue | `/admin/products/new` | `products.manage` | oui |
| Mettre à jour le stock | `/admin/inventory/adjust` (**nouveau**) | `inventory.adjust` | oui |
| Toutes les tenues | `/admin/products` | `products` | oui |
| Commandes du site | `/admin/orders` | `orders` | oui |
| Catégories | `/admin/categories` | `categories` | oui |
| Photos | `/admin/media` | `media` | oui |
| Avis des clientes | `/admin/reviews` | `reviews.moderate` | oui |
| Codes promo | `/admin/coupons` | `coupons.manage` | **non** (direction) |

Les codes promo sont une remise sur le prix : décision tarifaire, donc réservée à
la direction. Le Personnel a `coupons` en lecture seule dans la matrice, mais la
page coupons propose des boutons de création qui lui renverraient 403 — on ne
l'y envoie pas.

L'encart explique comment retirer une tenue du site sans la supprimer
(passer en brouillon), conforme à la doctrine « on désactive, on ne supprime pas ».

### 2.3 Nouvel écran `/admin/inventory/adjust`

`src/app/admin/inventory/adjust/page.tsx`, calqué sur `/admin/materials/in` :

- choix de la tenue par recherche nom / SKU via `GET /api/admin/products?search=`
  (brouillons compris — `products/search` ne renvoie que les publiés, inadapté ici),
  ou préremplissage par `?productId=` ;
- quatre types alignés sur ceux acceptés par l'API : **Arrivage** (`purchase`, +),
  **Retour cliente** (`return`, +), **Pièce abîmée** (`damaged`, −),
  **Correction** (`adjustment`, sens au choix) ;
- quantité entière positive, signe calculé côté écran ; aperçu du nouveau stock ;
  blocage si le résultat serait négatif (l'API plafonne à 0 silencieusement, on
  préfère refuser la saisie) ;
- motif obligatoire pour « Pièce abîmée » et « Correction » : ces deux-là sont
  les mouvements que la direction voudra relire ;
- après validation, la tenue reste sélectionnée avec son stock à jour pour
  enchaîner plusieurs saisies.

Bouton « Mettre à jour le stock » ajouté en tête de `/admin/inventory`, et entrée
dans le registre de recherche (`src/lib/admin-search/registry.ts`).

## 3. Non fait, à arbitrer

- **Le `PUT` produit modifie toujours le stock sans mouvement.** Deux options :
  (a) faire créer un `StockMovement` de type `adjustment` par le `PUT` quand le
  stock change (motif « fiche produit »), (b) rendre le champ stock de la fiche en
  lecture seule avec lien vers l'écran d'ajustement. Recommandation : (a), un
  seul endroit à modifier et aucune régression d'usage ; environ 20 lignes dans
  `src/app/api/admin/products/[id]/route.ts`.
- **Contenu de l'accueil du site** : les slides du bandeau (`HERO_SLIDES` dans
  `src/components/home/fashion-hero.tsx`) sont codés en dur. Les tenues « vedettes »
  et les catégories, elles, sont déjà pilotées depuis l'admin. Si la propriétaire
  veut changer les visuels du bandeau elle-même, il faut un modèle + un écran :
  chantier distinct, à ouvrir sur demande.
- `src/app/api/admin/reviews` : une route garde avec `media.delete` au lieu d'une
  permission de suppression d'avis. Incohérence de nommage, pas de fuite (STAFF
  n'a ni l'une ni l'autre). À ranger lors d'un prochain passage sur la matrice.

## 4. Vérification

- `tsc --noEmit` : 0 erreur.
- Pas de test automatisé sur ces écrans ; validation manuelle en production à
  faire avec un compte Personnel (voir NEXT-STEP).
