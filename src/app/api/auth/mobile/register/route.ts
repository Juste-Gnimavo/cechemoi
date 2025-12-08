import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpService } from '@/lib/otp-service'
import { generateTokens } from '@/lib/mobile-jwt'
import { notificationService } from '@/lib/notification-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.png'

const registerSchema = z.object({
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  code: z.string().length(4, 'Code doit contenir 4 chiffres'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { phone, code, name, whatsappNumber, email } = validation.data

    // Format phone numbers
    const formattedPhone = otpService.formatPhoneNumber(phone)
    const formattedWhatsApp = whatsappNumber
      ? otpService.formatPhoneNumber(whatsappNumber)
      : formattedPhone

    // Verify OTP
    const verification = await otpService.verify(formattedPhone, code, 'register')

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Check if customer with this phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: formattedPhone,
        role: 'CUSTOMER',
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte client avec ce numéro existe déjà' },
        { status: 400 }
      )
    }

    // Check email uniqueness if provided
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          role: 'CUSTOMER',
        },
      })

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Un compte client avec cet email existe déjà' },
          { status: 400 }
        )
      }
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        phone: formattedPhone,
        whatsappNumber: formattedWhatsApp,
        name,
        email: email ? email.toLowerCase() : null,
        phoneVerified: new Date(),
        role: 'CUSTOMER',
        image: DEFAULT_AVATAR,
      },
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

    // Create cart for new user
    await prisma.cart.create({
      data: { userId: user.id },
    })

    // Send welcome notifications (async)
    Promise.all([
      notificationService.sendNewAccount(user.id),
      notificationService.sendNewCustomerAlert(user.id),
    ]).catch(console.error)

    // Generate JWT tokens
    const tokens = generateTokens(user)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        image: user.image,
        whatsappNumber: user.whatsappNumber,
        phoneVerified: !!user.phoneVerified,
      },
      ...tokens,
    })
  } catch (error: any) {
    console.error('Mobile register error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
