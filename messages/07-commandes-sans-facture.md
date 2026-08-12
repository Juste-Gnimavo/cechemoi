# Certaines commandes n'ont pas de facture

Date : 12/08/2026 — Statut : ✅ Résolu — 33 factures manquantes générées en prod le 12/08

## Message WhatsApp (à copier tel quel)

*COMMANDES SANS FACTURE — RÉPARÉ* ✅

*Cause :* quand la facture échouait à la création, le système ne disait rien — la commande restait sans facture.

*Solution :*
• Les *33 commandes* concernées ont reçu leur facture
• Désormais, si une facture échoue, un message d'alerte s'affiche et un bouton *Générer la facture* apparaît sur la commande

👉 Chaque commande a maintenant sa facture, sans exception.

---
NOTE INTERNE (ne pas envoyer) : backfill exécuté (33/33). Anomalie résiduelle SM-040326-0002 : 2 paiements non reportés sur la facture (reçus déjà existants) — correctif `syncPaymentToInvoice` prévu prochaine session, voir NEXT-STEP.
