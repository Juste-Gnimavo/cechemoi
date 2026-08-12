# Certaines commandes n'ont pas de facture

**Date du signalement** : 12/08/2026
**Statut** : ⏳ À traiter (enquête nécessaire)

---

**PROBLÈME SOUMIS :**

Certaines commandes créées n'ont pas de facture, alors que la facture est censée être générée automatiquement.

**CAUSES :**

À déterminer. Piste probable : ces commandes ont été créées avant la mise en place de la facturation automatique, ou la génération a échoué silencieusement à la création.

**SOLUTIONS IMPLÉMENTÉES :**

1. Recensement de toutes les commandes sans facture (nombre exact, dates).
2. **Génération des factures manquantes** pour ces commandes.
3. Verrou dans le système : une commande ne peut plus être créée sans que sa facture soit générée — si la facture échoue, la création échoue et l'erreur s'affiche.

👉 Concrètement : après correction, chaque commande aura sa facture, sans exception.

**CAPTURES / LIENS :**

- [exemples de commandes sans facture à joindre par le CEO si disponibles]

---

*NOTE INTERNE (ne pas envoyer) : requête de recensement — `CustomOrder` sans `Invoice` lié (`customOrderId`). Vérifier le POST `/api/admin/custom-orders` : la création de la facture est-elle dans la même transaction ? Si non, transactionnaliser. Script de backfill pour l'existant.*
