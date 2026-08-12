# Recherche de client cassée sur l'envoi de SMS / WhatsApp individuel

**Date du signalement** : 12/08/2026
**Statut** : ⏳ À traiter (lot 1)

---

**PROBLÈME SOUMIS :**

Sur « Envoyer un SMS » et « Envoyer un WhatsApp » (menu Clients), la sélection ne fonctionne pas quand on tape une lettre. En tapant « JUSTE », la liste affiche « undefined undefined » alors que le compte existe. Attendu : dès qu'on tape une lettre, la liste des clients correspondants s'affiche avec leurs noms.

**CAUSES :**

Deux bugs dans ces pages : les noms ne s'affichent pas (la page cherche un champ qui n'existe pas dans la réponse — d'où « undefined »), et la recherche par lettre ne filtre pas correctement.

**SOLUTIONS IMPLÉMENTÉES :**

1. Les **noms des clients s'affichent** correctement dans la liste.
2. **Recherche fluide** : taper une lettre affiche immédiatement les clients correspondants (nom ou téléphone).

👉 Concrètement : tapez « ju » → la liste montre les clients dont le nom contient « ju », choisissez, envoyez.

**CAPTURES / LIENS :**

- Envoyer un SMS : https://cechemoi.com/admin/customers/send-sms
- Envoyer un WhatsApp : https://cechemoi.com/admin/customers/send-whatsapp
- [captures à joindre par le CEO]
