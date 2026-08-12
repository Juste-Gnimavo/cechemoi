# Séparer les commandes de l'atelier et celles de la boutique en ligne

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu (étape 1 — navigation séparée) ; sous-domaine boutique. seulement si le besoin persiste

---

**PROBLÈME SOUMIS :**

Tout est mélangé : les commandes sur mesure (clientes qui viennent à la boutique, avec suivi de production) et les commandes passées sur la boutique en ligne apparaissent au même endroit. Le hub Commandes de gestion.cechemoi.com annonce d'ailleurs les deux ensemble. Besoin d'y voir clair — éventuellement un espace séparé pour tout ce qui est boutique en ligne (commandes, produits, catégories, ventes), tout en gardant **toutes les données financières centralisées** puisque c'est la même entreprise.

**CAUSES :**

L'administration a été construite avec les deux univers côte à côte dans les mêmes menus, sans séparation visuelle nette entre l'atelier (sur mesure) et le e-commerce.

**SOLUTIONS IMPLÉMENTÉES :**

Proposition en deux temps :

1. **Tout de suite (léger)** : séparer clairement la navigation — deux tuiles distinctes sur gestion.cechemoi.com : « **Commandes atelier** » (sur mesure, suivi de production) et « **Boutique en ligne** » (commandes web, produits, ventes). Plus aucune page qui mélange les deux.
2. **Si besoin ensuite (structurel)** : un sous-domaine dédié boutique.cechemoi.com regroupant tout le e-commerce, sur le modèle de gestion.cechemoi.com.

Dans les deux cas, la caisse, les rapports et toutes les données financières restent **centralisés** : une seule comptabilité pour l'ensemble.

👉 Concrètement : l'atelier d'un côté, le e-commerce de l'autre, l'argent au même endroit.

**CAPTURES / LIENS :**

- Hub actuel mélangé : https://gestion.cechemoi.com/owner/commandes
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : ma recommandation ferme = étape 1 d'abord (2 hubs distincts, renommage des intitulés, ~1 h de travail) et ne faire le sous-domaine boutique. que si le besoin persiste après usage réel. Le pattern host-rewrite de `src/lib/owner/host.ts` est réutilisable tel quel si on y va. Les modèles sont déjà séparés en base (`Order` vs `CustomOrder`) — c'est une affaire de navigation, pas de données.*
