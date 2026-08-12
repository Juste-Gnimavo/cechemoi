# Corriger une erreur de saisie dans les entrées de stock

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu

---

**PROBLÈME SOUMIS :**

La page d'entrée de stock affiche « Action irréversible : l'ajout de stock ne peut pas être modifié par la suite ». En cas d'erreur de saisie (7 au lieu de 10), comment rectifier ? La page des mouvements n'a aucun bouton de correction.

**CAUSES :**

Le choix de rendre les mouvements non modifiables est volontaire et sain (même principe que la banque : on ne réécrit pas l'historique, sinon plus d'audit possible). Mais il manque l'outil qui va avec : le **mouvement de correction**, qui rectifie le stock sans effacer l'erreur.

**SOLUTIONS IMPLÉMENTÉES :**

1. Un bouton **« Corriger »** sur les mouvements : il crée un mouvement d'ajustement (+3 dans votre exemple 7 → 10, ou négatif dans l'autre sens) avec un motif obligatoire.
2. L'historique montre l'erreur ET la correction — le stock redevient juste, et on peut toujours vérifier ce qui s'est passé.
3. Le message « Action irréversible » sera reformulé : « Un mouvement ne se modifie pas ; en cas d'erreur, utilisez Corriger. »

👉 Concrètement : erreur de saisie = un clic sur Corriger, la bonne quantité, un motif — le stock est rectifié proprement.

**CAPTURES / LIENS :**

- Mouvements de stock : https://cechemoi.com/admin/materials/movements
- Entrée de stock : https://cechemoi.com/admin/materials/in
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : implémenter un type de mouvement ADJUSTMENT (ou entrée/sortie flaguée correction) avec `reason` obligatoire et lien vers le mouvement corrigé — jamais d'édition/suppression des mouvements existants, cohérent avec la philosophie soft-delete du CRM.*
