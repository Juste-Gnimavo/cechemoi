// Sous-domaines qui servent le shell propriétaire (accueil tuiles,
// header minimal). `gestion` est le sous-domaine vierge donné à la
// propriétaire (aucun 301 en cache) ; `crm` est conservé en alias.
const OWNER_SUBDOMAINS = ['gestion', 'crm']

export function isOwnerHost(host: string): boolean {
  return OWNER_SUBDOMAINS.some((sub) => host.startsWith(`${sub}.`))
}
