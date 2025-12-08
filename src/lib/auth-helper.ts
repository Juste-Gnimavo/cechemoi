import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { getUserFromToken } from '@/lib/mobile-jwt'

export interface AuthUser {
  id: string
  phone?: string | null
  email?: string | null
  name?: string | null
}

/**
 * Get authenticated user from request
 * Supports both:
 * - Mobile: JWT Bearer token in Authorization header
 * - Web: NextAuth session cookie
 *
 * @returns User data or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: AuthUser | null
  source: 'jwt' | 'session' | null
}> {
  // First, try JWT Bearer token (mobile)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (user) {
      return {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
        },
        source: 'jwt',
      }
    }
  }

  // Fall back to NextAuth session (web)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const sessionUser = session.user as any
    return {
      user: {
        id: sessionUser.id,
        phone: sessionUser.phone,
        email: sessionUser.email,
        name: sessionUser.name,
      },
      source: 'session',
    }
  }

  return { user: null, source: null }
}

/**
 * Simple helper to get user ID from request
 * Returns null if not authenticated
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const { user } = await getAuthenticatedUser(request)
  return user?.id ?? null
}

/**
 * Get full user data from request
 * Returns null if not authenticated
 */
export async function getUser(request: NextRequest): Promise<AuthUser | null> {
  const { user } = await getAuthenticatedUser(request)
  return user
}
