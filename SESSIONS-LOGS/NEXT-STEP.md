# Prochaine session — Itérations sur le shell propriétaire (gestion.cechemoi.com)

## Contexte

La session 27 a livré le shell propriétaire complet, déployé et validé en production sur `gestion.cechemoi.com` : accueil tuiles, hubs intermédiaires (Clients, Commandes, Stock, Caisse, Rapports), header minimal, login admin sans OTP forcé, layout mobile compact. Voir `SESSIONS-LOGS/27-OWNER-SHELL-CRM-SUBDOMAIN.md` pour l'architecture et le détail des commits.

## Mode de fonctionnement convenu

Le CEO reviendra ponctuellement avec des demandes de la propriétaire (transmises via WhatsApp). Le réflexe pour chaque demande :

1. **Ajouter/activer une tuile** → `src/lib/owner/tiles.ts` (flag `enabled`, une ligne).
2. **Ajouter une carte dans un hub** → la page `src/app/owner/<hub>/page.tsx` concernée (composant partagé `src/components/owner/owner-hub.tsx`).
3. **Créer un nouveau hub** → copier le pattern d'un hub existant (~60 lignes), pointer la tuile dessus.
4. Toujours pointer vers les pages `/admin/*` existantes — le shell est une couche de navigation, on ne réécrit pas les pages métier.
5. Garder le principe : strict minimum visible, activation à la demande. Ne jamais « profiter » d'une session pour tout exposer.

## Vérifications en attente (à faire à l'occasion)

- [ ] Aucun compte admin avec `twoFactorEnabled = true` en base (sinon ce compte reçoit encore un OTP au login).
- [ ] Responsive iPhone des formulaires métier les plus utilisés par la propriétaire : nouvelle dépense (`/admin/expenses/new`), nouveau client (`/admin/customers/new`), nouvelle commande (`/admin/custom-orders/new`). Le shell est mobile-friendly ; ces pages n'ont pas été auditées.
- [ ] Committer ou écarter les fichiers de la session 26 restés en attente (package.json, package-lock.json, scripts/md-to-html.mjs, doc-web/*, RECRUTEMENT/, log 26).

## Améliorations candidates (non engagées — attendre le besoin réel)

- Compteurs dynamiques sur les tuiles (« 3 rendez-vous aujourd'hui », « 2 anniversaires cette semaine ») via petites APIs de comptage.
- Tuile Rendez-vous (`/admin/appointments`) si la propriétaire la demande.
- Brancher les tuiles sur `src/lib/admin-search/registry.ts` (flag `ownerTile`) pour une source de vérité unique menus/recherche/tuiles.
- Si un second facteur d'authentification est souhaité un jour : TOTP (Google Authenticator) par compte — jamais le gateway SMS.

## Ensuite (file d'attente inchangée)

- Session UI polish (demander au CEO les 3-8 cibles visuelles précises avant de toucher quoi que ce soit).
- Phase 2 du moteur de recherche admin (recherche dans les données : factures, clients, commandes par numéro / nom / téléphone).
- Système de notifications (templates seed, triggers).
- Page de gestion d'équipe + connexion des données mock aux APIs.
