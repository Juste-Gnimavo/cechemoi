import { signOut } from 'next-auth/react'

/**
 * Déconnecte un membre de l'équipe et le ramène à la connexion admin de
 * l'hôte courant (gestion.cechemoi.com ou cechemoi.com).
 *
 * Un `callbackUrl` relatif est résolu par NextAuth contre NEXTAUTH_URL
 * (cechemoi.com) : depuis gestion.cechemoi.com, la déconnexion renvoyait
 * donc vers la connexion cliente par téléphone.
 */
export async function signOutToAdminLogin() {
  await signOut({ redirect: false })
  window.location.assign('/auth/admin')
}
