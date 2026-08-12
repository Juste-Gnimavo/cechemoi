# Boutons de navigation entre commande, facture et fiche de suivi

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu

---

**PROBLÈME SOUMIS :**

Depuis une commande, impossible de voir d'un coup d'œil sa facture auto-générée. Depuis une facture, impossible de retrouver la commande associée. Et la fiche de suivi confection est difficile d'accès.

**CAUSES :**

Les liens entre commande ↔ facture existent dans la base de données mais ne sont pas mis en avant dans les pages.

**SOLUTIONS IMPLÉMENTÉES :**

1. Sur la page d'une commande : gros bouton **« Voir la facture »** en haut.
2. Sur la page d'une facture liée à une commande : gros bouton **« Voir la commande associée »** en haut.
3. Sur la page d'une commande : gros bouton **« Télécharger la fiche de suivi confection »** — téléchargement direct, comme le bouton Télécharger existant.

👉 Concrètement : commande, facture et fiche de suivi seront à un clic les unes des autres.

**CAPTURES / LIENS :**

- Exemple de commande : https://cechemoi.com/admin/custom-orders/cmmboq6pm00fqeug36jv31mls
- Exemple de facture : https://cechemoi.com/admin/invoices/cmsexnezt008plhezw8okzr4w
- Fiche de suivi confection : https://cechemoi.com/admin/custom-orders/fiche-suivi-confection
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : `Invoice.customOrderId` existe (relation déjà utilisée par les rapports). Pages : `src/app/admin/custom-orders/[id]/page.tsx`, `src/app/admin/invoices/[id]/page.tsx`. Le PDF de la fiche de suivi se génère depuis `/admin/custom-orders/fiche-suivi-confection` — réutiliser la même génération pour le téléchargement direct depuis la commande.*
