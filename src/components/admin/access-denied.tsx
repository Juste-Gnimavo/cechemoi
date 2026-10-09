import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

// Écran affiché lorsqu'un compte d'équipe ouvre, par l'URL, une page hors de
// son périmètre (cf. `canAccessPath`). L'API répond 403 de son côté.
export function AccessDenied({ homeHref }: { homeHref: string }) {
  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
        Accès refusé
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Cet écran ne fait pas partie de votre accès. Si vous en avez besoin,
        demandez à la direction.
      </p>
      <Link
        href={homeHref}
        className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
      >
        Revenir à mon accueil
      </Link>
    </div>
  )
}
