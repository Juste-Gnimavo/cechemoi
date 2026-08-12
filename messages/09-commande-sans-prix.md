# Créer une commande sans indiquer le prix des articles

**Date du signalement** : 12/08/2026
**Statut** : ✅ Déjà disponible — rien à développer

---

**PROBLÈME SOUMIS :**

Pouvoir créer une fiche de commande sans préciser les coûts des articles (prix à définir plus tard).

**CAUSES :**

Ce n'est pas un manque : la fonction existe déjà. Le champ « Prix unitaire » accepte 0 et la commande se crée normalement, facture comprise.

**SOLUTIONS IMPLÉMENTÉES :**

Rien à développer — c'est déjà possible aujourd'hui :

1. Créer la commande en laissant le prix à **0**.
2. La commande et sa facture se génèrent normalement.
3. Le prix peut être ajusté plus tard sur la commande.

Test réel effectué ce jour pour vérification — la commande et sa facture sont passées sans prix.

👉 Concrètement : laissez le prix à 0 à la création, complétez-le quand il est connu.

**CAPTURES / LIENS :**

- Créer une commande : https://cechemoi.com/admin/custom-orders/new
- Commande test créée sans prix : https://cechemoi.com/admin/custom-orders/cmsq58zru00017lm4p6cisut6
- Sa facture générée : https://cechemoi.com/admin/invoices/cmsq58zsr00067lm4eitafckv
- [captures à joindre par le CEO]
