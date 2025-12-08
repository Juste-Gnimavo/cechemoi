import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service'
import { z } from 'zod'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  code: z.string().length(6, 'Code doit contenir 6 chiffres'),
  purpose: z.enum(['login', 'register', 'verify', 'reset']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = verifyOTPSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { phone, code, purpose } = validation.data

    // Format phone number
    const formattedPhone = otpService.formatPhoneNumber(phone)

    // Verify OTP
    const result = await otpService.verify(formattedPhone, code, purpose)

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
      userId: result.userId,
    })
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.',
      },
      { status: 500 }
    )
  }
}
