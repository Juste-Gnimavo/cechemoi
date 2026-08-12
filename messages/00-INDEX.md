# Index des problèmes signalés par Mme N'guessan

| # | Problème | Statut | Type de travail |
|---|----------|--------|-----------------|
| 01 | Doublons de catégories de dépenses | ✅ Résolu | Fait (session 28) |
| 02 | Rapports financiers peu détaillés | ✅ Résolu | Fait (session 28) |
| 03 | Comptes employés depuis gestion.cechemoi.com | 🔧 En cours | Prochaine session (hub Personnel) |
| 04 | Suivi production + notifications clientes | 🔧 En cours | Gros chantier — flux existant à mettre en valeur + notifications |
| 05 | Instructions page nouvelle commande | ⏳ À traiter | Petit correctif (encart bleu) |
| 06 | Boutons commande ↔ facture ↔ fiche de suivi | ⏳ À traiter | Petit correctif |
| 07 | Commandes sans facture | ⏳ À traiter | Enquête + backfill + verrou |
| 08 | Séparation atelier / boutique en ligne | ⏳ À traiter | Décision CEO (navigation d'abord, sous-domaine ensuite si besoin) |
| 09 | Commande sans prix des articles | ✅ Déjà disponible | Message à envoyer, rien à coder |
| 10 | Fiche de sortie matériels par couturier | ⏳ À traiter | Page + PDF (données déjà en base) |
| 11 | Entrées de stock, unités de mesure | ✅ Déjà disponible | Demander 2 exemples concrets avant de conclure |
| 12 | Corriger une erreur d'entrée de stock | ✅ Résolu | Bouton Corriger → ajustement avec motif |
| 13 | Campagnes SMS/WhatsApp depuis gestion | ✅ Résolu | Tuile Messages + hub (⚠ jamais WhatsApp Cloud — proxy Baileys) |
| 14 | Recherche client cassée (send-sms/whatsapp) | ✅ Résolu | Fix « undefined undefined » + recherche dès 1 lettre |
| 15 | Fiche matériel + recherche mouvements | ✅ Résolu | Barre de recherche + fiche /admin/materials/[id] |
| 16 | Gestion des couturiers visible | ✅ Résolu | Carte dans la tuile Personnel |
| 17 | Vente boutique au comptoir | ✅ Déjà disponible | Message + rappel du circuit, rien à coder |

## LOT 1 — TERMINÉ (implémenté le 12/08/2026, sessions 28-29)

Les 17 problèmes sont ✅. Statuts par colonne : 01-02 (session 28), 03-08 + 10 + 12-16 (session 29), 09/11/17 (déjà disponibles — messages d'explication à envoyer).

**Après déploiement, le CEO doit :**
1. Ajouter dans Easypanel les variables : `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PHONE` (valeurs dans `.env` local).
2. Lancer le recensement des commandes sans facture : `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-missing-invoices.ts` puis `--apply`.
3. Envoyer les messages 01-17 à la propriétaire, par petits paquets, avec captures.

**Prochain lot** : attendre les retours de la propriétaire après vérification du lot 1.
