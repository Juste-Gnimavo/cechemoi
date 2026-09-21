import { requirePagePermission } from '@/lib/page-permissions'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Saisie autorisée au Personnel ; la vue complète et les rapports sont gardés
  // par les layouts des sous-sections.
  await requirePagePermission('finance.expenses.create')
  return <>{children}</>
}
