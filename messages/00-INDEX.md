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
| 12 | Corriger une erreur d'entrée de stock | ⏳ À traiter | Mouvement d'ajustement avec motif |
| 13 | Campagnes SMS/WhatsApp depuis gestion | ⏳ À traiter | Tuile Messages + hub (⚠ jamais WhatsApp Cloud — proxy Baileys) |
| 14 | Recherche client cassée (send-sms/whatsapp) | ⏳ À traiter | Fix « undefined undefined » + recherche à la frappe |
| 15 | Fiche matériel + recherche mouvements | ⏳ À traiter | Barre de recherche + page synthèse par matériel |
| 16 | Gestion des couturiers visible | ⏳ À traiter | Carte dans la tuile Personnel |
| 17 | Vente boutique au comptoir | ✅ Déjà disponible | Message + rappel du circuit, rien à coder |

## LOT 1 — décision CEO du 12/08/2026

**La liste s'arrête à 17. Tout le lot est à implémenter et livrer d'un bloc**, puis la propriétaire vérifie avant qu'on prenne la suite de ses signalements. Ordre d'implémentation :

1. Correctifs rapides : 05, 14
2. Shell propriétaire : 03+16 (tuile Personnel), 13 (tuile Messages), 08 (séparation Commandes atelier / Boutique)
3. Commandes/factures : 06 (boutons croisés), 07 (enquête + verrou)
4. Stock : 15 (recherche + fiche matériel), 10 (fiche sortie par couturier), 12 (correction d'erreur)
5. Production + notifications clientes : 04

Messages à envoyer sans coder : **09**, **11**, **17** (+ 01, 02 déjà prêts).
