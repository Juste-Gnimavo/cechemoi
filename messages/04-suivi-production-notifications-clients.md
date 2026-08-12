# Suivi de confection et notifications automatiques aux clientes

Date : 12/08/2026 — Statut : ✅ Résolu — page refondue + notifications automatiques

## Message WhatsApp (à copier tel quel)

*SUIVI DE CONFECTION + CLIENTES PRÉVENUES AUTOMATIQUEMENT* ✅

*Problème :* les employés oublient d'informer les clientes de l'avancement de leurs commandes.

*Solution :*
• Dès qu'on change l'étape d'une commande (en production, essayage, prête, livrée), *la cliente reçoit automatiquement SMS + WhatsApp*
• Vous recevez une copie de chaque changement sur votre WhatsApp
• Page Production refaite : les étapes à gauche, les tenues de l'étape à droite — simple sur téléphone et tablette
• On assigne le couturier directement sur chaque tenue

👉 Une seule chose à demander à l'équipe : *changer l'étape au fil de la confection*. Le système prévient la cliente tout seul.

Suivi de production : https://cechemoi.com/admin/production

---
NOTE INTERNE (ne pas envoyer) :
- Notifications : `src/lib/custom-order-status-notifications.ts`, déclenchées par le statut de la COMMANDE (PUT custom-orders/[id]). Envoi direct via proxy smsing/Baileys — jamais WhatsApp Cloud, jamais les templates DB (non seedés).
- Coordonnées propriétaire : env `OWNER_NAME` / `OWNER_EMAIL` / `OWNER_PHONE` (local + Easypanel).
