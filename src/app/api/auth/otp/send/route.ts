import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service'
import { z } from 'zod'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

const sendOTPSchema = z.object({
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  purpose: z.enum(['login', 'register', 'verify', 'reset']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = sendOTPSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { phone, purpose } = validation.data

    // Format phone number
    const formattedPhone = otpService.formatPhoneNumber(phone)

    // For register, check if user already exists
    if (purpose === 'register') {
      const { prisma } = await import('@/lib/prisma')
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          role: 'CUSTOMER'
        },
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Un utilisateur avec ce numéro existe déjà',
          },
          { status: 400 }
        )
      }
    }

    // For login, check if user exists
    if (purpose === 'login') {
      const { prisma } = await import('@/lib/prisma')
      const user = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          role: 'CUSTOMER'
        },
      })

      if (!user) {
        // User doesn't exist, they should register first
        return NextResponse.json(
          {
            success: false,
            error: 'Ce numéro n\'est pas enregistré. Veuillez créer un compte.',
            redirectToRegister: true,
          },
          { status: 404 }
        )
      }
    }

    // Generate and send OTP
    const result = await otpService.generateAndSend(formattedPhone, purpose)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.',
      },
      { status: 500 }
    )
  }
}
