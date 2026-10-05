# Session 33 — Guides utilisateurs Boutique en ligne et CRM (05/10/2026)

## Demande du CEO

Le CEO répète les mêmes explications aux employés. Il demande deux guides séparés, en Word et en PDF, illustrés par des captures de l'application réelle :

1. **Gestion de la boutique en ligne** : pour la personne en charge du site (créer une tenue, ajouter des photos, stock, commandes…).
2. **Gestion du CRM** : pour l'assistante de gestion, qui utilise les menus de la page d'accueil de gestion.cechemoi.com.

## Livré

- `~/Desktop/GUIDES-CECHEMOI/Guide-Boutique-en-ligne-CECHEMOI.docx` + `.pdf` (26 pages).
- `~/Desktop/GUIDES-CECHEMOI/Guide-Gestion-CRM-CECHEMOI.docx` + `.pdf` (26 pages).
- Générateur versionné : `doc-web/guides-utilisateurs/` (`build.js`, `content-boutique.js`, `content-crm.js`, `README.md`). Captures non versionnées.
- Le CEO a envoyé le guide Boutique à la propriétaire (Mme N'Guessan) avec les accès dans un message séparé.

### Structure des guides

Couverture (logo, mention « document interne », captures fictives), sommaire, un chapitre par tuile : chemin, étapes numérotées, capture, encadrés « À savoir » / « Attention », puis un aide-mémoire (routine quotidienne et hebdomadaire, tableau des erreurs fréquentes).

- **Boutique** (13 chapitres) : connexion, hub, ajouter une tenue (4 étapes illustrées), toutes les tenues (actions groupées, modification), mise à jour du stock, vente au comptoir, commandes du site (tableau des statuts), catégories, photos, bandeau, avis, codes promo, aide-mémoire.
- **CRM** (8 chapitres) : connexion et 7 tuiles, Clients (fiche, mensurations, WhatsApp/SMS), Commandes atelier (création, fiche, acompte, matériels, production, fiche de suivi), Stock matériels, Caisse, Messages (campagnes), Anniversaires, aide-mémoire.

## Décisions

- **7 menus, pas 9** : le compte utilisé (« Juste ») est en rôle STAFF, qui ne voit que 7 tuiles. Rapports et Personnel restent réservés à la direction (`src/lib/owner/tiles.ts`) ; le guide CRM le précise.
- **Anonymisation des captures** : noms, téléphones et emails des clientes remplacés dans le DOM avant chaque capture (Aya Koné, +225 07 00 00 00 01…), auteur réel remplacé par « Assistante CÈCHÉMOI », cumuls d'encaissements masqués ou floutés. Raison : le PDF circule (WhatsApp) et la base contient des personnalités publiques.
- **Format** : .docx généré par `docx` (npm), PDF exporté par Microsoft Word (pas de LibreOffice sur la machine). Captures natives Retina (`screencapture -l`) quand Chrome était visible, captures de l'extension sinon.
- Les guides interdisent toute suppression (clientes, commandes, avis, rapports) : on annule, on dépublie, on corrige.

## Constats dans l'application (non corrigés, à arbitrer)

1. **Fuite financière vers le Personnel** (contredit la session 31) :
   - `/admin/custom-orders` : cartes « Année 2026 » et « Toute la période » = encaissements cumulés (4 202 000 F).
   - `/admin/receipts` : « Cette année » et « Toute la période » (≈ 30 M FCFA).
   - `/admin/invoices` : « Reste dû (30 derniers jours) ».
   - `/admin/materials` et `/admin/materials/movements` : valeur totale du stock et des mouvements.
   - `/admin/customers` et fiche cliente : « Valeur totale », « Valeur vie client », « Panier moyen ».
2. **Boutons « Supprimer » affichés au Personnel** alors que le serveur refuse (catégories : `DELETE /api/admin/categories/[id]` exige `role === 'ADMIN'`). À vérifier aussi : clientes, commandes du site, commandes sur mesure, avis, campagnes.
3. **Anniversaires** : la colonne « Âge » affiche « 0 ans » pour toutes les clientes.
4. **Codes promo visibles par le Personnel** dans le hub Boutique, alors que NEXT-STEP (session 32) les disait réservés à la direction : la matrice STAFF contient `coupons`. À trancher.
5. Médiathèque : ne contient que 4 avatars ; les photos produits ne s'y retrouvent pas (elles sont envoyées depuis la fiche produit). Le guide oriente vers la fiche produit.

## Fichiers modifiés

- `doc-web/guides-utilisateurs/*` (nouveau).
- `SESSIONS-LOGS/33-GUIDES-UTILISATEURS-BOUTIQUE-ET-CRM.md` (ce fichier), `SESSIONS-LOGS/NEXT-STEP.md`.

Aucun code applicatif modifié, aucune donnée de production modifiée.
