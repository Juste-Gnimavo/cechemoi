import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { otpService } from '@/lib/otp-service'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    // Standard email/password login (without 2FA - legacy)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          throw new Error('Email ou mot de passe incorrect')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
    // Admin 2FA login provider
    CredentialsProvider({
      id: 'admin-2fa',
      name: 'Admin 2FA',
      credentials: {
        tempToken: { label: 'Temp Token', type: 'text' },
        code: { label: 'OTP Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.tempToken || !credentials?.code) {
          throw new Error('Token et code requis')
        }

        // Find the 2FA session using the temp token
        const twoFASession = await prisma.otpCode.findFirst({
          where: {
            code: credentials.tempToken,
            purpose: '2fa',
            verified: false,
            expiresAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        if (!twoFASession || !twoFASession.userId) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }

        // Verify the OTP code
        const verifyResult = await otpService.verify(twoFASession.phone, credentials.code, 'verify')

        if (!verifyResult.success) {
          throw new Error('Code invalide ou expiré')
        }

        // Mark the 2FA session as verified
        await prisma.otpCode.update({
          where: { id: twoFASession.id },
          data: { verified: true },
        })

        // Get the user
        const user = await prisma.user.findUnique({
          where: { id: twoFASession.userId },
        })

        if (!user) {
          throw new Error('Utilisateur non trouvé')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role
      }
      return session
    },
  },
}
