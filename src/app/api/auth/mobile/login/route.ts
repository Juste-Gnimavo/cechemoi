import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpService } from '@/lib/otp-service'
import { generateTokens } from '@/lib/mobile-jwt'
import { notificationService } from '@/lib/notification-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.png'

const loginSchema = z.object({
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  code: z.string().length(4, 'Code doit contenir 4 chiffres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { phone, code } = validation.data

    // Format phone number
    const formattedPhone = otpService.formatPhoneNumber(phone)

    // Verify OTP
    const verification = await otpService.verify(formattedPhone, code, 'login')

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Find or create customer user
    let user = await prisma.user.findFirst({
      where: {
        phone: formattedPhone,
        role: 'CUSTOMER',
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

    let isNewUser = false

    if (!user) {
      // Auto-create customer on first login
      isNewUser = true
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
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
    } else if (!user.phoneVerified) {
      // Update phone verification status
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: new Date() },
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
    }

    // Generate JWT tokens
    const tokens = generateTokens(user)

    return NextResponse.json({
      success: true,
      isNewUser,
      needsProfile: !user.name,
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
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
