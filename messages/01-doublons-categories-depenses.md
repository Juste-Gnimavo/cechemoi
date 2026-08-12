# Doublons de catégories dans les rapports de dépenses (Salaires, Achats…)

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu

---

**PROBLÈME SOUMIS :**

Dans le rapport de la caisse, « Salaires » (7 587 000 CFA) et « Salaires des couturiers » (1 465 000 CFA) apparaissaient comme deux lignes séparées. Impossible de retrouver les 7 dépenses « Salaires des couturiers » dans la liste des dépenses. Même chose pour les achats (plusieurs lignes « ACHAT DE… ») et les livraisons en double.

**CAUSES :**

1. « Salaires des couturiers », « Salaire Assistant(e) », « ACHAT DE TISSUS CHEZ… » etc. avaient été créées comme des catégories complètement séparées — le rapport les comptait donc chacune de leur côté, sans total commun.
2. La liste des dépenses n'affichait que les 100 plus récentes, sans le dire : les dépenses plus anciennes étaient invisibles. C'est pour ça que les 7 dépenses restaient introuvables — elles existent bien, rien n'a jamais été perdu.

**SOLUTIONS IMPLÉMENTÉES :**

1. Les catégories qui vont ensemble sont maintenant regroupées sous des catégories principales : **Salaires** (couturiers, assistante, fille de ménage), **Achats pagnes et tissus**, **Livraison**, **Communication**, **Prestataires** (perleuses, Brody's).
2. Les vrais doublons ont été fusionnés (ex. « Livraison par CAMARA » existait en double).
3. Le rapport affiche désormais **un seul total par grande catégorie**, avec le détail par sous-catégorie juste en dessous.
4. **En cliquant sur une catégorie dans le rapport, la liste exacte des dépenses qui composent le montant s'ouvre directement.**
5. La liste des dépenses affiche maintenant toutes les pages (boutons Précédent / Suivant), plus seulement les 100 dernières.

👉 Concrètement : pour savoir d'où vient un montant, cliquez dessus dans le rapport — la liste détaillée s'affiche.

**CAPTURES / LIENS :**

- Rapport de caisse : https://cechemoi.com/admin/expenses/reports
- Liste des dépenses : https://cechemoi.com/admin/expenses
- Catégories rangées : https://cechemoi.com/admin/expenses/categories
- [captures à joindre par le CEO]
