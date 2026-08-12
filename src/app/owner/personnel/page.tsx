'use client'

import { Info, Scissors, TrendingUp, UserPlus, Users } from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerPersonnelPage() {
  return (
    <OwnerHub
      title="Personnel"
      subtitle="Votre équipe : comptes, couturiers et performances"
      actions={[
        {
          key: 'add',
          label: 'Ajouter un membre',
          sublabel: 'Créer un compte pour un nouvel employé',
          href: '/admin/team',
          icon: UserPlus,
          primary: true,
        },
        {
          key: 'team',
          label: 'Toute l’équipe',
          sublabel: 'Voir, modifier ou désactiver les comptes',
          href: '/admin/team',
          icon: Users,
        },
        {
          key: 'performance',
          label: 'Performance de l’équipe',
          sublabel: 'Clients créés et mensurations prises par membre',
          href: '/admin/staff-performance',
          icon: TrendingUp,
        },
        {
          key: 'tailors',
          label: 'Gestion des couturiers',
          sublabel: 'Travaux en cours et matériels utilisés par couturier',
          href: '/admin/tailors',
          icon: Scissors,
        },
      ]}
      notice={
        <>
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Quand un employé part, on <span className="font-semibold">désactive</span> son
            compte, on ne le supprime pas — comme à la banque : le compte d&apos;une
            caissière qui s&apos;en va est désactivé, pas effacé, sinon tout ce
            qu&apos;elle a enregistré perdrait son auteur et on ne pourrait plus
            vérifier. Un compte désactivé ne peut plus se connecter, mais tout
            son historique reste consultable.
          </p>
        </>
      }
    />
  )
}
