import { headers } from 'next/headers'
import { AdminLayoutClient } from './layout-client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get('host') || ''
  const shell = host.startsWith('crm.') ? 'owner' : 'full'

  return <AdminLayoutClient shell={shell}>{children}</AdminLayoutClient>
}
