# Entrée de matériels : toutes les unités de mesure

**Date du signalement** : 12/08/2026
**Statut** : ✅ Déjà disponible — exemple précis à nous donner si un cas bloque encore

---

**PROBLÈME SOUMIS :**

Pouvoir enregistrer les entrées de matériels quelle que soit l'unité de mesure : rouleau, mètre, centimètre, bobine, etc.

**CAUSES :**

Ce n'est pas un manque : chaque matériel a déjà son unité de mesure (bobine, rouleau, mètre…), définie à la création du matériel, et l'entrée de stock utilise automatiquement cette unité.

**SOLUTIONS IMPLÉMENTÉES :**

Rien à développer a priori — le système gère déjà toutes les unités. Exemple réel : « Fils grosse bobine rouge foncé » est suivi en **bobines**, et la quantité reçue se saisit dans cette unité.

👉 Concrètement : si un type d'article précis vous pose encore problème, **donnez-nous deux exemples concrets** (nom de l'article + unité voulue) et nous vérifierons ensemble — il s'agit peut-être juste de créer le matériel avec la bonne unité.

**CAPTURES / LIENS :**

- Entrée de matériels : https://cechemoi.com/admin/materials/in
- Créer un matériel (choix de l'unité) : https://cechemoi.com/admin/materials/new
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : attendre ses 2 exemples avant de conclure. Hypothèse probable : elle veut saisir une entrée dans une unité différente de celle du matériel (ex. acheter un rouleau d'un tissu suivi en mètres) → ça, ce serait une conversion d'unités à l'entrée, pas encore supporté. À trancher avec ses exemples.*
