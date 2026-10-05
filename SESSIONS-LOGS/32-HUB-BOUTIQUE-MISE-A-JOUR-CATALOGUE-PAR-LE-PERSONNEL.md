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

## 3. Deuxième passe (même journée) — les trois points ouverts, tranchés et faits

### 3.1 La fiche produit trace désormais ses changements de stock

`PUT /api/admin/products/[id]` : la mise à jour du produit et la création du
`StockMovement` sont dans une même transaction. Dès que le stock demandé diffère
du stock existant, un mouvement `adjustment` est écrit avec le motif
« Modification depuis la fiche produit », signé de l'utilisateur. L'historique
`/admin/inventory/movements` est maintenant complet quel que soit le chemin.

### 3.2 Bandeau de l'accueil éditable (`/admin/storefront`)

- **Modèle `HeroSlide`** (`image`, `alt`, `link?`, `position`, `active`).
  Table additive, aucune donnée existante touchée.
- **`src/lib/hero-slides.ts`** : images par défaut (les trois actuelles de
  `/public/slides`) et `getActiveHeroSlides()` avec repli sur ces défauts si la
  table est vide, si toutes sont masquées, ou si la base est injoignable (build).
- **`src/app/page.tsx`** devient un composant serveur asynchrone avec
  `revalidate = 120` ; le héro reçoit ses slides en props, plus de flash d'image
  par défaut. Chaque mutation admin appelle `revalidatePath('/')`, la page est
  donc à jour immédiatement.
- **`FashionHero`** : slides en props, image cliquable quand un lien est défini.
- **API** `GET/POST /api/admin/hero-slides`, `PUT/DELETE .../[id]`,
  `PUT .../reorder` (liste d'identifiants dans l'ordre voulu, vérifiée complète
  et sans doublon avant écriture transactionnelle). Lien limité aux chemins du
  site (`/…`) et aux URL `https`.
- **Permissions** : `storefront` (voir), `storefront.manage` (ajouter, modifier,
  ordonner, masquer) accordées au Personnel ; `storefront.delete` à la direction.
  Même doctrine que partout : le Personnel masque, il ne supprime pas.
- **Écran** `/admin/storefront` : liste ordonnée avec vignette, monter/descendre,
  Modifier (téléversement via `ImageUpload`, catégorie `slides`, 8 Mo max),
  Masquer/Afficher, Supprimer (direction). Tant que la table est vide, un bouton
  « Reprendre les 3 images actuelles » les copie en base pour qu'on puisse les
  réordonner ou les remplacer.
- Hub Boutique : action « Bandeau de l'accueil » (permission `storefront`).
  Registre de recherche : groupe « Vitrine ».

### 3.3 Garde de suppression des avis

`DELETE /api/admin/reviews/[id]` exigeait `media.delete`. Permission
`reviews.delete` créée (direction seulement), route corrigée.

## 4. Déploiement — action requise

La table `HeroSlide` n'existe pas encore en production : la base
(`thales.deblo.app:5460`) n'est pas joignable depuis le poste de développement
(P1001), le `prisma db push` n'a donc pas pu être lancé ici. À exécuter depuis
le conteneur après déploiement :

```bash
npx prisma db push
```

Tant que ce n'est pas fait : le site affiche les images par défaut (repli
prévu), l'écran `/admin/storefront` renvoie une erreur de chargement, tout le
reste fonctionne.

## 5. Vérification

- `tsc --noEmit` : 0 erreur (les deux passes).
- Pas de test automatisé sur ces écrans ; validation manuelle en production à
  faire avec un compte Personnel (voir NEXT-STEP).
