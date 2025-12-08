import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpService } from '@/lib/otp-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const verify2FASchema = z.object({
  tempToken: z.string().min(1, 'Token invalide'),
  code: z.string().length(4, 'Code doit contenir 4 chiffres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = verify2FASchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { tempToken, code } = validation.data

    // Find the 2FA session using the temp token
    const twoFASession = await prisma.otpCode.findFirst({
      where: {
        code: tempToken,
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
      return NextResponse.json(
        {
          success: false,
          error: 'Session expirée. Veuillez vous reconnecter.',
        },
        { status: 401 }
      )
    }

    // Verify the OTP code
    const verifyResult = await otpService.verify(twoFASession.phone, code, 'verify')

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Code invalide ou expiré',
        },
        { status: 400 }
      )
    }

    // Mark the 2FA session as verified
    await prisma.otpCode.update({
      where: { id: twoFASession.id },
      data: { verified: true },
    })

    // Get the user data for the session
    const user = await prisma.user.findUnique({
      where: { id: twoFASession.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Utilisateur non trouvé',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    })
  } catch (error: any) {
    console.error('Admin 2FA verify error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.',
      },
      { status: 500 }
    )
  }
}
