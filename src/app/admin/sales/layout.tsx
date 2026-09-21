import { requirePagePermission } from '@/lib/page-permissions'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePagePermission('sales')
  return <>{children}</>
}
