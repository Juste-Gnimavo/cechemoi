# Prochaine session — Retours de la propriétaire sur le lot 1

## Contexte

Les sessions 28 et 29 (12/08/2026) ont traité **l'intégralité des 17 problèmes** signalés par la propriétaire — voir `messages/00-INDEX.md` (statuts) et `SESSIONS-LOGS/29-LOT1-BACKLOG-PROPRIETAIRE.md` (détail technique). La session 30 (même journée) a corrigé l'anomalie résiduelle SM-040326-0002 et soldé les vérifications en attente — voir `SESSIONS-LOGS/30-FIX-SYNC-PAIEMENT-FACTURE-SM-040326-0002.md`.

Principe de travail : un fichier par problème dans `messages/` (PROBLÈME / CAUSES / SOLUTIONS + note interne), le CEO y joint captures et liens et envoie à la propriétaire par petits paquets.

## En cours côté CEO

- [ ] Envoyer les messages `messages/01` à `17` à la propriétaire, par paquets de 3-4, avec captures.

## Fait en session 30 (12/08/2026)

- [x] **SM-040326-0002 réparée en prod** : facture FAC-120826-0026 affiche 415 000 CFA encaissés. `syncPaymentToInvoice` est désormais idempotente (réutilise reçus et InvoicePayments existants, répare les liens cassés) et le script backfill a 3 passes (factures manquantes, paiements désynchronisés, encaissés incohérents) — rejouable sans risque.
- [x] Aucun compte admin avec `twoFactorEnabled = true` en base prod.
- [x] Fichiers session 26 commités ; `RECRUTEMENT/` et `doc-web/print-output/` mis en `.gitignore` (app quiz autonome avec futures réponses candidats, et HTML généré).

## Fait en session 31 (21/09/2026)

- [x] **Matrice de droits unifiée** : les 232 gardes des routes d'administration lisent désormais `src/lib/role-permissions.ts` via `denyUnlessPermitted`. Plus aucun tableau de rôles codé en dur. Voir `SESSIONS-LOGS/31-MATRICE-DROITS-ET-ETANCHEITE-FINANCIERE.md`.
- [x] **Le Personnel peut créer des factures** (cause : `POST /api/admin/invoices` exigeait ADMIN/MANAGER alors que la matrice accordait `invoices.create` au Personnel).
- [x] **Étanchéité financière** : `transactions`, `expenses`, `reports`, `analytics/revenue-summary` et `analytics/products` fermés au Personnel ; montants expurgés dans `analytics/overview` et `invoices/stats`. Ces routes servaient la trésorerie au Personnel malgré le masquage à l'écran.
- [x] Bouton « Voir les commandes » en tête de `/admin/materials`.
- [x] Validé en production avec un compte Personnel : création de facture, création de commande sur mesure, saisie de dépense.

- [x] **Saisie des dépenses préservée pour le Personnel** : permission `finance.expenses.create` — il saisit une dépense et relit ses propres écritures, sans cumul, sans rapports, sans voir les salaires. Le filtrage passe par `Expense.createdById` ; une dépense d'autrui renvoie 404, jamais 403.

## Fait en session 32 (05/10/2026)

- [x] **Hub « Boutique en ligne » enrichi** pour que le Personnel mette à jour le catalogue : Ajouter une tenue, Mettre à jour le stock, Toutes les tenues, Catégories, Photos, Avis des clientes ; Codes promo réservés à la direction. `OwnerHub` filtre désormais ses actions par permission. Voir `SESSIONS-LOGS/32-HUB-BOUTIQUE-MISE-A-JOUR-CATALOGUE-PAR-LE-PERSONNEL.md`.
- [x] **Bandeau de l'accueil éditable** (`/admin/storefront`, modèle `HeroSlide`, permissions `storefront*`) ; la fiche produit trace ses changements de stock ; garde `reviews.delete`.
- [x] **Nouvel écran `/admin/inventory/adjust`** : seul écran qui enregistre un mouvement de stock produit (arrivage, retour, pièce abîmée, correction). Avant, l'API existait sans interface et la fiche produit changeait le stock sans trace.

## Validé en production (05/10/2026, fin de session 32)

- [x] Table `HeroSlide` créée (`npx -y prisma@5.22.0 db push` depuis le conteneur), API `/api/admin/hero-slides` OK, écran `/admin/storefront` opérationnel.
- [x] Le CEO informe les employés : ils commencent par **créer de nouvelles catégories et ajouter de nouveaux produits** depuis le hub « Boutique en ligne » de gestion.cechemoi.com.

## Fait en session 33 (05/10/2026)

- [x] **Guides utilisateurs illustrés** (Word + PDF, 26 pages chacun) dans `~/Desktop/GUIDES-CECHEMOI/` : « Gérer la boutique en ligne » et « Gérer la relation client » (7 tuiles STAFF). Générateur dans `doc-web/guides-utilisateurs/`. Guide Boutique envoyé à la propriétaire. Voir `SESSIONS-LOGS/33-GUIDES-UTILISATEURS-BOUTIQUE-ET-CRM.md`.

## Fait en session 34 (08/10/2026)

- [x] **Commande sur mesure ↔ facture synchronisées** : paiements saisis sur la facture recopiés vers la commande (et suppression répercutée) ; modes de paiement enregistrés en code (`src/lib/payment-methods.ts`) ; la commande est la seule source des articles et du total de sa facture (facture liée en lecture seule sur ses articles, `totalCost` refusé par l'API). Commits `f985a86`, `3991d29`, `66a0804`, `911482f`, tous en production. Voir `SESSIONS-LOGS/34-SYNC-COMMANDE-FACTURE-PAIEMENTS-ARTICLES.md`.
- [x] **Données réparées en prod** : 4 paiements recopiés côté commande, 9 paiements facture remis sur leur vrai mode (Wave / Orange Money / virement), SM-240226-0001 alignée sur sa facture, doublon de 40 000 supprimé sur SM-040326-0006.
- [x] **CASP installé** : `casp/state.json` pilote désormais la file ; ce fichier reste tenu en parallèle.

## Fait en session 35 (09/10/2026) — rôle « Gestionnaire boutique en ligne »

- [x] `UserRole.ECOMMERCE`, matrice limitée au hub Boutique, garde d'URL unique (`src/lib/route-permissions.ts`) avec page « Accès refusé », accueil direct sur `/owner/boutique`, vente au comptoir via une recherche de cliente dédiée (`orders.create`), permission `account` pour profil et 2FA, `TEAM_ROLES` à la place des listes de rôles en dur. Commits `6a06ceb`, `138aed3`. Journal : `SESSIONS-LOGS/26-10-09-001-35-role-gestionnaire-boutique-en-ligne.md`.
- [x] Vente au comptoir du Personnel réparée (la liste des livraisons était vide : il n'avait pas `shipping`).
- [x] Enum `ECOMMERCE` ajouté en base de production par SQL, **avant** le push, pour ne pas casser la connexion admin.
- [ ] **CEO : relancer le déploiement depuis Easypanel** (aucun build déclenché par les deux pushes).
- [ ] Après le déploiement : `npx -y prisma@5.22.0 db push` (attendu : already in sync), puis compte ECOMMERCE de test créé depuis `/admin/team`, checklist du journal 35, et désactivation du compte.

## Prochaine session — 36 : étanchéité financière du Personnel

Lire `docs/plan/sessions/36-ETANCHEITE-FINANCIERE-PERSONNEL.md` (préalables de déploiement de la 35 en tête du CONTEXTE).

## File CASP

- **36** — Étanchéité financière du Personnel : `docs/plan/sessions/36-ETANCHEITE-FINANCIERE-PERSONNEL.md`.
- **37** — Bouton « Informer le couturier » (aperçu puis envoi WhatsApp manuel, aucun montant) : `docs/plan/sessions/37-INFORMER-LE-COUTURIER.md`.

## Priorité 1 — Constats de la session 33 (étanchéité financière incomplète)

→ Mis en file CASP : `docs/plan/sessions/36-ETANCHEITE-FINANCIERE-PERSONNEL.md` (session 36, après le rôle).

- [ ] **Le Personnel voit encore des cumuls d'argent** : encaissements annuels dans `/admin/custom-orders` et `/admin/receipts`, « Reste dû » dans `/admin/invoices`, valeur du stock dans `/admin/materials` et `/admin/materials/movements`, « Valeur totale / vie client / panier moyen » dans `/admin/customers` et la fiche cliente. Expurger côté API (comme `invoices/stats` en session 31), pas seulement à l'écran.
- [ ] **Masquer les boutons « Supprimer »** au Personnel quand le serveur refuse (catégories : ADMIN seul) ; auditer clientes, commandes, commandes sur mesure, avis, campagnes.
- [ ] **Codes promo** : la matrice STAFF contient `coupons`, la tuile est visible ; la session 32 les disait réservés à la direction. Demander au CEO et aligner.
- [ ] **Anniversaires** : colonne « Âge » à « 0 ans » pour toutes les clientes.
- [ ] Après chaque correction visible, mettre à jour les guides (`doc-web/guides-utilisateurs/`).

## Déploiement — rappels (appris en session 32)

- Le conteneur n'embarque pas le CLI Prisma : **toujours épingler la version**, `npx -y prisma@5.22.0 db push`. Un `npx prisma` nu télécharge Prisma 8 dont la ligne de commande est incompatible.
- Lancer le push **après** le redéploiement, jamais avant : il compare la base au schéma présent dans le conteneur. Un « already in sync » obtenu sur l'ancien conteneur ne crée rien.
- L'erreur `EACCES: permission denied, unlink node_modules/.prisma/client/index.js` à la fin du push est la régénération du client, inutile en runtime : à ignorer.
- **(session 34)** Serveur : `ssh zerosuite` (Easypanel, Swarm). Base : `docker exec -i $(docker ps -qf name=cechemoi_postgres.1) psql -U postgres -d postgres`. Postgres n'est pas exposé (proxy Cloudflare) et ne doit pas l'être ; `.env` locaux pointent encore vers l'ancien hôte `thales.deblo.app`.
- **(session 34)** Le push ne déclenche pas toujours de build : vérifier l'âge du conteneur (`docker service ps cechemoi_cechemoi`) et, si rien ne part, utiliser le webhook de l'onglet Deployments du service dans Easypanel.
- **(session 34)** Le conteneur est un build standalone (pas de `scripts/`, pas de ts-node) : les rattrapages de données se font en SQL, dans une transaction, avec aperçu en lecture seule d'abord.

## À surveiller pendant les premières semaines d'usage par les employés

- [ ] Retours sur la création de catégories et de produits par le Personnel (formulaire produit : photos, tailles, prix, stock initial). Chaque problème = fichier `messages/18+`.
- [ ] Vérifier que les mouvements de stock saisis par le Personnel (`/admin/inventory/adjust` et fiche produit) apparaissent dans `/admin/inventory/movements` avec le bon auteur.
- [ ] Bandeau de l'accueil : la propriétaire reprend les 3 images d'origine puis les remplace à son rythme ; si elle veut un texte éditable par-dessus l'image (titre, bouton), c'est un chantier à ouvrir, aujourd'hui le texte doit être dans l'image.

## À vérifier au prochain passage (session 31, non rejoué)

- [ ] Avec un compte Personnel : `/admin/transactions`, `/admin/reports` et `/admin/sales` doivent rediriger vers `/admin`.
- [ ] Tableau de bord d'un compte Personnel : doit s'afficher normalement et ne montrer aucun montant (ne pas tomber sur « Aucune donnée disponible »).
- [ ] Bouton « Voir les commandes » en tête de `/admin/materials`.

## Ensuite, selon les retours de la propriétaire

1. **Corrections du lot 1** remontées par la propriétaire après vérification (le plus probable).
2. **Lot 2** : la suite de ses ~20 signalements (le CEO reprendra la liste — chaque nouveau problème = fichier `messages/18+`).
3. Si elle demande des groupes de diffusion nommés pour les campagnes (« groupe » du problème 13) : tags clients + ciblage par tag.

## Rappels d'architecture (ne pas casser)

- WhatsApp : **jamais** le Cloud API (aucun template approuvé) — tout passe par le proxy smsing (Baileys). Voir `src/lib/smsing-service.ts`.
- Notifications de confection : messages en dur dans `src/lib/custom-order-status-notifications.ts` (pas le système de templates DB, jamais seedé). Déclenchées par le statut de la COMMANDE, pas des articles.
- Comptes employés : désactivation, jamais de suppression (analogie banque — encart dans le hub Personnel).
- Stock : l'historique des mouvements ne se modifie jamais — bouton « Corriger » = mouvement ADJUST avec motif.
- Sous-catégories de dépenses : 1 niveau max, roll-up partout, exports « dont X » sans double comptage.
- Droits : **aucun tableau de rôles codé en dur** dans une route d'administration. Tout passe par `denyUnlessPermitted(session, '<permission>')` et la matrice `src/lib/role-permissions.ts`. Le Personnel ne doit jamais voir la trésorerie ni la masse salariale.
- Sync paiement → facture : `syncPaymentToInvoice` est idempotente — ne jamais recréer un reçu ou un InvoicePayment existant, toujours finir par `updateInvoiceAmountAndStatus`.
- **Commande sur mesure = source de vérité de sa facture** (session 34) : articles et total ne se modifient que sur la commande (`syncInvoiceItemsFromCustomOrder`) ; paiements saisissables des deux côtés, miroir dans les deux sens (`syncPaymentToInvoice` / `mirrorInvoicePaymentToCustomOrder`). Mode de paiement toujours en code (`src/lib/payment-methods.ts`).

## Ensuite (file d'attente inchangée)

- Session UI polish (demander au CEO les 3-8 cibles visuelles précises).
- Phase 2 du moteur de recherche admin (recherche dans les données).
- Bouton « Fusionner » dans `/admin/expenses/categories` si le script CLI s'avère pénible.
