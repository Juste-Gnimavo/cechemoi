import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-phone'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
