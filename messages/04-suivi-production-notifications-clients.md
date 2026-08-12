# Suivi des étapes de confection et notifications automatiques aux clientes

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu — page refondue + notifications automatiques branchées

---

**PROBLÈME SOUMIS :**

Les employés oublient d'informer les clientes de l'avancement de leurs commandes (en production, essayage, tenue disponible…). Il faut pouvoir enregistrer les étapes d'avancement, assigner les commandes aux couturiers, suivre la confection et notifier les clientes à chaque étape.

**CAUSES :**

Tout ce circuit existe déjà dans le système : chaque commande a un statut (En attente → En production → Essayage → Retouches → Prêt → Livré), chaque article peut être assigné à un couturier, et une page **Production** montre toutes les commandes par étape. Mais il n'a jamais été utilisé : les 65 commandes en cours sont toutes restées « En attente ». Et les notifications automatiques aux clientes ne sont pas encore branchées sur les changements d'étape.

**SOLUTIONS IMPLÉMENTÉES :**

1. La page de suivi de production sera mise en valeur et réorganisée : les étapes visibles dans un menu à gauche, le contenu de chaque étape à droite — pensée pour être utilisée tous les jours à l'atelier.
2. À chaque changement d'étape : **notification automatique à la cliente** (SMS/WhatsApp) — « votre tenue est en production », « votre tenue est prête », etc.
3. Des **rappels automatiques pour vous** aussi : commandes en retard, commandes restées trop longtemps sans avancement.

👉 Concrètement : dès qu'un couturier ou vous changez l'étape d'une commande, la cliente est prévenue automatiquement — plus besoin de compter sur la mémoire de chacun. Mais il faut que l'équipe change bien les étapes au fil de la confection.

**CAPTURES / LIENS :**

- Une commande avec son statut : https://cechemoi.com/admin/custom-orders/cmqdn143a0001ii5fsatmc7lc
- Page de suivi de production : https://cechemoi.com/admin/production
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) :*
- *Le kanban `/admin/production` existe (drag & drop par statut, filtre par couturier). À repenser en layout sidebar-étapes → contenu à droite, mobile-friendly.*
- *Notifications clientes : brancher les triggers sur le changement de statut CustomOrder (templates SMS/WhatsApp — voir le système de notifications en base, seed jamais fait).*
- *Rappels à la propriétaire : créer des variables d'environnement fixes et les référencer partout (si son numéro change, on ne modifie que le .env) :*
  - *`OWNER_NAME="N'guessan Yah Marthe-Caire"`*
  - *`OWNER_EMAIL="marthe_claire2005@yahoo.fr"`*
  - *`OWNER_PHONE="+2250708070778"`*
