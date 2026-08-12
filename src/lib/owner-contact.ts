// Coordonnées de la propriétaire — TOUJOURS via variables d'environnement :
// si son numéro change, on ne modifie que le .env, jamais le code.
// À définir dans .env (local) ET dans Easypanel (prod) :
//   OWNER_NAME="N'guessan Yah Marthe-Caire"
//   OWNER_EMAIL="marthe_claire2005@yahoo.fr"
//   OWNER_PHONE="+2250708070778"

export function getOwnerContact() {
  return {
    name: process.env.OWNER_NAME || '',
    email: process.env.OWNER_EMAIL || '',
    phone: process.env.OWNER_PHONE || '',
  }
}
