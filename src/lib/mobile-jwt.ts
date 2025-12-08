import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'cave-express-mobile-secret'
const ACCESS_TOKEN_EXPIRY = '7d' // 7 days
const REFRESH_TOKEN_EXPIRY = '30d' // 30 days

export interface TokenPayload {
  userId: string
  phone: string
  role: string
  type: 'access' | 'refresh'
}

export interface UserTokenData {
  id: string
  phone: string | null
  name: string | null
  email: string | null
  role: string
  image: string | null
  whatsappNumber: string | null
  phoneVerified: Date | null
}

/**
 * Generate access and refresh tokens for mobile app
 */
export function generateTokens(user: UserTokenData): {
  accessToken: string
  refreshToken: string
  expiresIn: number
} {
  const accessPayload: TokenPayload = {
    userId: user.id,
    phone: user.phone || '',
    role: user.role,
    type: 'access',
  }

  const refreshPayload: TokenPayload = {
    userId: user.id,
    phone: user.phone || '',
    role: user.role,
    type: 'refresh',
  }

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })

  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })

  // 7 days in seconds
  const expiresIn = 7 * 24 * 60 * 60

  return {
    accessToken,
    refreshToken,
    expiresIn,
  }
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  error?: string
}> {
  const payload = verifyToken(refreshToken)

  if (!payload) {
    return { success: false, error: 'Token invalide ou expiré' }
  }

  if (payload.type !== 'refresh') {
    return { success: false, error: 'Token de type invalide' }
  }

  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      image: true,
      whatsappNumber: true,
      phoneVerified: true,
    },
  })

  if (!user) {
    return { success: false, error: 'Utilisateur non trouvé' }
  }

  // Generate new tokens
  const tokens = generateTokens(user)

  return {
    success: true,
    ...tokens,
  }
}

/**
 * Get user from access token
 */
export async function getUserFromToken(token: string): Promise<UserTokenData | null> {
  const payload = verifyToken(token)

  if (!payload || payload.type !== 'access') {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      image: true,
      whatsappNumber: true,
      phoneVerified: true,
    },
  })

  return user
}
