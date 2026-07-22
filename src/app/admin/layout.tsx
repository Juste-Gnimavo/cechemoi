import { headers } from 'next/headers'
import { isOwnerHost } from '@/lib/owner/host'
import { AdminLayoutClient } from './layout-client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get('host') || ''
  const shell = isOwnerHost(host) ? 'owner' : 'full'

  return <AdminLayoutClient shell={shell}>{children}</AdminLayoutClient>
}
