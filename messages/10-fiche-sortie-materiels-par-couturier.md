# Fiche de sortie de matériels par couturier

**Date du signalement** : 12/08/2026
**Statut** : ⏳ À traiter

---

**PROBLÈME SOUMIS :**

Pouvoir consulter et imprimer une fiche des sorties de matériels par couturier : qui a demandé quoi, quand, pour quelle commande.

**CAUSES :**

Les sorties de matériels enregistrent déjà le couturier demandeur, mais il n'existe pas de vue ni de fiche imprimable regroupée par couturier.

**SOLUTIONS IMPLÉMENTÉES :**

1. Une **fiche de sortie par couturier** : choix du couturier et de la période → liste de ses sorties (matériel, quantité, date, commande liée).
2. **Téléchargement / impression** de la fiche, comme la fiche de suivi confection.
3. Lien d'accès direct depuis le hub Stock de gestion.cechemoi.com.

👉 Concrètement : vous saurez exactement quel matériel chaque couturier a pris sur la période, sur une fiche imprimable.

**CAPTURES / LIENS :**

- Sortie de matériels (existant) : https://cechemoi.com/admin/materials/out
- Entrée de matériels (existant) : https://cechemoi.com/admin/materials/in
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : le champ couturier existe dans le form `/admin/materials/out` et le filtre « Tous les couturiers » existe déjà dans `/admin/materials/movements` — la donnée est en base. Travail = page fiche (filtre couturier + période) + PDF (réutiliser le pattern fiche-suivi-confection) + carte dans le hub `/owner/stock`.*
