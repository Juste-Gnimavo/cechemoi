import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { otpService } from '@/lib/otp-service'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { notificationService } from '@/lib/notification-service'

// Default avatar for new users
const DEFAULT_AVATAR = '/images/default-avatar.png'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    // Email + Password for Admin/Manager/Staff
    CredentialsProvider({
      id: 'credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        // Find user by email (admin/manager/staff only - not customers)
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email.toLowerCase(),
            role: { in: ['ADMIN', 'MANAGER', 'STAFF'] },
          },
        })

        if (!user) {
          throw new Error('Email ou mot de passe incorrect')
        }

        // Check if user is admin/manager/staff (customers don't have passwords)
        if (user.role === 'CUSTOMER') {
          throw new Error('Utilisez la connexion par téléphone pour les clients')
        }

        // Verify password
        if (!user.password) {
          throw new Error('Ce compte n\'a pas de mot de passe configuré')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect')
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
          // Import smsingService dynamically to avoid circular dependency
          const { smsingService } = await import('@/lib/smsing-service')

          // Generate OTP for 2FA
          const otp = otpService.generateOTP(user.id, '2fa')

          // Send OTP to 2FA phone
          const phone = user.twoFactorPhone || user.phone
          await smsingService.sendSMS({
            to: phone,
            message: `Votre code de vérification CÈCHÉMOI: ${otp.code}. Valable 5 minutes.`,
          })

          // Create temporary token for 2FA flow
          const crypto = await import('crypto')
          const tempToken = crypto.randomBytes(32).toString('hex')

          // Store temp token in OTP table with special purpose
          await prisma.otpCode.create({
            data: {
              userId: user.id,
              phone: phone,
              code: tempToken, // Store temp token as code
              purpose: '2fa_pending',
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
          })

          // Return special object to indicate 2FA required
          throw new Error(`2FA_REQUIRED:${tempToken}`)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          image: user.image,
        }
      },
    }),
    // Phone OTP for Customers
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          throw new Error('Numéro de téléphone et code requis')
        }

        // Format phone number
        const formattedPhone = otpService.formatPhoneNumber(credentials.phone)

        // Verify OTP code
        const verification = await otpService.verify(
          formattedPhone,
          credentials.code,
          'login'
        )

        if (!verification.success) {
          throw new Error('Code invalide ou expiré')
        }

        // Find or create CUSTOMER user (phone+role unique)
        let user = await prisma.user.findFirst({
          where: {
            phone: formattedPhone,
            role: 'CUSTOMER',
          },
        })

        if (!user) {
          // Auto-create CUSTOMER on first login
          user = await prisma.user.create({
            data: {
              phone: formattedPhone,
              phoneVerified: new Date(),
              role: 'CUSTOMER',
              image: DEFAULT_AVATAR,
            },
          })

          // Create cart for new user
          await prisma.cart.create({
            data: {
              userId: user.id,
            },
          })

          // Send welcome notifications (don't await to avoid blocking login)
          Promise.all([
            notificationService.sendNewAccount(user.id),
            notificationService.sendNewCustomerAlert(user.id),
          ]).catch((error) => {
            console.error('Error sending registration notifications:', error)
          })
        } else if (!user.phoneVerified) {
          // Update phone verification status
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              phoneVerified: new Date(),
            },
          })
        }

        return {
          id: user.id,
          phone: user.phone,
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
          phone: user.phone,
          image: user.image,
        }
      },
    }),
    CredentialsProvider({
      id: 'phone-register',
      name: 'Phone Register',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        code: { label: 'Code', type: 'text' },
        name: { label: 'Name', type: 'text' },
        whatsappNumber: { label: 'WhatsApp', type: 'tel' },
        ipAddress: { label: 'IP', type: 'text' },
        city: { label: 'City', type: 'text' },
        country: { label: 'Country', type: 'text' },
        countryCode: { label: 'Country Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code || !credentials?.name) {
          throw new Error('Tous les champs requis doivent être remplis')
        }

        // Format phone numbers
        const formattedPhone = otpService.formatPhoneNumber(credentials.phone)
        const formattedWhatsApp = credentials.whatsappNumber
          ? otpService.formatPhoneNumber(credentials.whatsappNumber)
          : formattedPhone

        // Verify OTP code
        const verification = await otpService.verify(
          formattedPhone,
          credentials.code,
          'register'
        )

        if (!verification.success) {
          throw new Error('Code invalide ou expiré')
        }

        // Check if CUSTOMER with this phone already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            phone: formattedPhone,
            role: 'CUSTOMER',
          },
        })

        if (existingUser) {
          throw new Error('Un compte client avec ce numéro existe déjà')
        }

        // Create new user with geolocation data and default avatar
        const user = await prisma.user.create({
          data: {
            phone: formattedPhone,
            whatsappNumber: formattedWhatsApp,
            name: credentials.name,
            phoneVerified: new Date(),
            role: 'CUSTOMER',
            image: DEFAULT_AVATAR,
            // Geolocation data
            ipAddress: credentials.ipAddress || null,
            city: credentials.city || null,
            country: credentials.country || null,
            countryCode: credentials.countryCode || null,
          },
        })

        // Create cart for new user
        await prisma.cart.create({
          data: {
            userId: user.id,
          },
        })

        // Send welcome notifications (don't await to avoid blocking login)
        Promise.all([
          notificationService.sendNewAccount(user.id),
          notificationService.sendNewCustomerAlert(user.id),
        ]).catch((error) => {
          console.error('Error sending registration notifications:', error)
        })

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = (user as any).role
        token.phone = (user as any).phone

        // Update last login timestamp on new login
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        }).catch(err => console.error('Error updating lastLoginAt:', err))
      }

      // Refresh user data from database on session update or refetch
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, name: true, email: true, role: true, phone: true, image: true }
        })
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.role = dbUser.role
          token.phone = dbUser.phone
          token.picture = dbUser.image
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).name = token.name as string
        (session.user as any).email = token.email as string
        (session.user as any).role = token.role as UserRole
        (session.user as any).phone = token.phone as string
      }
      return session
    },
  },
}
