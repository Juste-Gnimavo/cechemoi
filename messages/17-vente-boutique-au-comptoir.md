# Vendre les tenues de la boutique à une cliente de passage

**Date du signalement** : 12/08/2026
**Statut** : ✅ Déjà disponible — rappel d'utilisation, rien à développer

---

**PROBLÈME SOUMIS :**

Des tenues prêtes-à-porter sont déjà dans la boutique en ligne. Quand une cliente vient au magasin et veut une de ces tenues, peut-on ajouter ces articles et lui créer une commande directement depuis l'application ?

**CAUSES :**

Ce n'est pas un manque : tout existe déjà. Les articles sont dans le catalogue (votre stagiaire les a déjà ajoutés), et la création manuelle de commande fonctionne.

**SOLUTIONS IMPLÉMENTÉES :**

Rien à développer — voici le circuit, déjà opérationnel :

1. **Ajouter un article au catalogue** (si nouveau) : Boutique → Produits → Ajouter.
2. **Vendre à une cliente de passage** : Boutique → Commandes → **Créer une nouvelle commande** → choisir la cliente (ou la créer), chercher les produits, valider. Remise manuelle et frais de livraison possibles, notification à la cliente incluse.
3. Le stock se décompte automatiquement et la vente entre dans les rapports.

👉 Concrètement : une vente au comptoir = « Créer une nouvelle commande » avec la cliente et les articles. Essayez sur une vente réelle et dites-nous si un point coince.

**CAPTURES / LIENS :**

- Produits du catalogue : https://cechemoi.com/admin/products
- Créer une commande manuelle : https://cechemoi.com/admin/orders/new
- [captures à joindre par le CEO]
