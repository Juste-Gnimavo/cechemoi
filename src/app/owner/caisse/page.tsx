'use client'

import Link from 'next/link'
import { FileText, Info, PlusCircle, Receipt, Wallet } from 'lucide-react'
import { OwnerHub } from '@/components/owner/owner-hub'

export default function OwnerCaissePage() {
  return (
    <OwnerHub
      title="Caisse"
      subtitle="Dépenses, reçus et factures"
      actions={[
        {
          key: 'add-expense',
          label: 'Ajouter une dépense',
          sublabel: 'Eau, électricité, internet, achats du jour…',
          href: '/admin/expenses/new',
          icon: PlusCircle,
          primary: true,
        },
        {
          key: 'expenses',
          label: 'Toutes les dépenses',
          sublabel: 'Historique des dépenses enregistrées',
          href: '/admin/expenses',
          icon: Wallet,
        },
        {
          key: 'receipts-today',
          label: 'Reçus d’aujourd’hui',
          sublabel: 'Les encaissements de la journée',
          href: '/admin/receipts?today=true',
          icon: Receipt,
        },
        {
          key: 'invoices',
          label: 'Toutes les factures',
          sublabel: 'Consulter les factures existantes',
          href: '/admin/invoices',
          icon: FileText,
        },
      ]}
      notice={
        <>
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary-700 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pour créer une facture, ne passez pas par la caisse :{' '}
            <Link
              href="/admin/custom-orders/new"
              className="font-semibold text-primary-700 dark:text-primary-400 underline underline-offset-2"
            >
              créez une commande
            </Link>{' '}
            — la facture est générée automatiquement avec la commande.
          </p>
        </>
      }
    />
  )
}
