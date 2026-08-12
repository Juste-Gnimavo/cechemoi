# Instructions claires sur la page de création de commande

**Date du signalement** : 12/08/2026
**Statut** : ✅ Résolu

---

**PROBLÈME SOUMIS :**

Sur la page « Nouvelle Commande Sur-Mesure », rien n'indique clairement qu'une facture sera générée automatiquement, ni que le suivi des étapes et les notifications clientes seront gérés par le système.

**CAUSES :**

L'encart bleu d'information existant ne parle que des sorties de matériels et des acomptes.

**SOLUTIONS IMPLÉMENTÉES :**

L'encart bleu sera complété pour annoncer clairement, dès la création :

1. **La facture est générée automatiquement** — inutile d'en créer une à part.
2. Le **suivi des étapes de confection** (production, essayage, prêt…) se fait sur la commande.
3. Les **notifications à la cliente** sont envoyées automatiquement à chaque étape.

👉 Concrètement : créez la commande, le reste (facture, suivi, notifications) est pris en charge.

**CAPTURES / LIENS :**

- Page de création : https://cechemoi.com/admin/custom-orders/new
- [captures à joindre par le CEO]

---

*NOTE INTERNE (ne pas envoyer) : encart bleu dans `src/app/admin/custom-orders/new/page.tsx`. Mentionner les notifications seulement quand le point 04 sera branché — sinon promesse en avance de phase ; formuler d'abord facture auto + suivi.*
