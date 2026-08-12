# Campagnes SMS et WhatsApp accessibles depuis gestion.cechemoi.com

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu

---

**PROBLÈME SOUMIS :**

Pouvoir envoyer des SMS et des messages WhatsApp depuis la nouvelle interface : à une personne, à un groupe, ou à tous les clients — et consulter le rapport des envois. Aujourd'hui rien de tout cela n'est accessible depuis gestion.cechemoi.com, et l'interface d'envoi ne permet pas de rechercher un client en tapant son nom.

**CAUSES :**

Les pages de campagnes existent dans l'administration complète (campagne SMS, campagne WhatsApp, rapports) mais aucune tuile ne les expose sur l'accueil simplifié. La recherche de clients dans les pages d'envoi est cassée (voir problème 14).

**SOLUTIONS IMPLÉMENTÉES :**

1. Nouvelle tuile **Messages** sur l'accueil de gestion.cechemoi.com : envoyer un SMS ou un WhatsApp à **une personne**, lancer une **campagne** (tous les clients ou liste de numéros), et voir le **rapport des envois**.
2. Recherche de clients réparée (problème 14).

👉 Concrètement : tout l'envoi de messages à un clic depuis l'accueil.

**CAPTURES / LIENS :**

- Campagne SMS : https://cechemoi.com/admin/campaigns/sms
- Campagne WhatsApp : https://cechemoi.com/admin/campaigns/whatsapp
- Rapports d'envois : https://cechemoi.com/admin/campaigns/reports
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : AUCUN WhatsApp Cloud — pas de template approuvé. Tous les envois WhatsApp passent par le proxy smsing (Baileys derrière). Ne jamais brancher le Cloud API. « Groupe » = pour l'instant numéros personnalisés dans les campagnes ; si elle demande des groupes nommés, ce sera une évolution (tags clients).*
