# Prochaine session — Validation du shell propriétaire (crm.cechemoi.com)

## Contexte

La session 27 a créé le shell propriétaire : accueil tuiles sur `/owner`, hub Caisse, header minimal, rewrites middleware host-based. Voir `SESSIONS-LOGS/27-OWNER-SHELL-CRM-SUBDOMAIN.md`. TypeScript passe, mais **aucun test navigateur n'a été fait**.

## À faire dans l'ordre

1. **Test local du host crm** : lancer le dev server et simuler le host (ex. entrée `/etc/hosts` `127.0.0.1 crm.localhost` ou `curl -H "Host: crm.cechemoi.com"`) pour vérifier :
   - `/` affiche bien la grille de tuiles ;
   - une page admin (ex. `/admin/customers`) affiche le header minimal, pas le header dense ;
   - `/customers` (alias) sert bien la page clients ;
   - le login sur `crm.…/auth/login` fonctionne et le cookie tient.
2. **Bascule Easypanel** (action CEO) : supprimer la redirection crm → cechemoi.com/admin, pointer crm.cechemoi.com sur le service Next.js. Attention au 301 mis en cache dans le navigateur de la propriétaire (navigation privée pour vérifier).
3. **Démo à la propriétaire** : lui donner uniquement `crm.cechemoi.com`, observer ses premiers usages, noter ce qui la bloque encore.
4. **Itérations tuiles** : renommer/ajouter des tuiles selon ses retours (une ligne dans `src/lib/owner/tiles.ts`).

## Ensuite (file d'attente inchangée)

- Session UI polish (plan précédent, toujours valable — demander au CEO les 3-8 cibles visuelles avant de toucher quoi que ce soit).
- Phase 2 du moteur de recherche admin (recherche dans les données).
- Système de notifications (templates seed, triggers).
- Page de gestion d'équipe + connexion des données mock aux APIs.
