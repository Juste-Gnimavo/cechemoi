# Prochaine session — Retours de la propriétaire sur le lot 1

## Contexte

Les sessions 28 et 29 (même journée, 12/08/2026) ont traité **l'intégralité des 17 problèmes** signalés par la propriétaire — voir `messages/00-INDEX.md` (statuts) et `SESSIONS-LOGS/29-LOT1-BACKLOG-PROPRIETAIRE.md` (détail technique). Le principe de travail : un fichier par problème dans `messages/` (PROBLÈME / CAUSES / SOLUTIONS + note interne), le CEO y joint captures et liens et envoie à la propriétaire par petits paquets.

## À faire au déploiement (CEO — si pas déjà fait)

- [ ] Variables Easypanel : `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PHONE` (valeurs dans le `.env` local). Sans elles, pas de copie de suivi à la propriétaire.
- [ ] Factures manquantes : `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-missing-invoices.ts` (rapport), puis avec `--apply`.
- [ ] Test réel : changer le statut d'une commande sur mesure → la cliente reçoit SMS + WhatsApp, la propriétaire reçoit la copie WhatsApp.
- [ ] Envoyer les messages `messages/01` à `17` à la propriétaire, par paquets de 3-4, avec captures.

## Prochaine session (au choix selon les retours)

1. **Corrections du lot 1** remontées par la propriétaire après vérification (le plus probable).
2. **Lot 2** : la suite de ses ~20 signalements (le CEO reprendra la liste — chaque nouveau problème = fichier `messages/18+`).
3. Si elle demande des groupes de diffusion nommés pour les campagnes (« groupe » du problème 13) : tags clients + ciblage par tag.

## Rappels d'architecture (ne pas casser)

- WhatsApp : **jamais** le Cloud API (aucun template approuvé) — tout passe par le proxy smsing (Baileys). Voir `src/lib/smsing-service.ts`.
- Notifications de confection : messages en dur dans `src/lib/custom-order-status-notifications.ts` (pas le système de templates DB, jamais seedé). Déclenchées par le statut de la COMMANDE, pas des articles.
- Comptes employés : désactivation, jamais de suppression (analogie banque — encart dans le hub Personnel).
- Stock : l'historique des mouvements ne se modifie jamais — bouton « Corriger » = mouvement ADJUST avec motif.
- Sous-catégories de dépenses : 1 niveau max, roll-up partout, exports « dont X » sans double comptage.

## Vérifications en attente (héritées)

- [ ] Aucun compte admin avec `twoFactorEnabled = true` en base.
- [ ] Fichiers session 26 non commités (package.json, package-lock.json, scripts/md-to-html.mjs, doc-web/*, RECRUTEMENT/, log 26) — committer ou écarter.

## Ensuite (file d'attente inchangée)

- Session UI polish (demander au CEO les 3-8 cibles visuelles précises).
- Phase 2 du moteur de recherche admin (recherche dans les données).
- Bouton « Fusionner » dans `/admin/expenses/categories` si le script CLI s'avère pénible.
