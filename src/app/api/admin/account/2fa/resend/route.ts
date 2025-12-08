import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpService } from '@/lib/otp-service'
import { smsingService } from '@/lib/smsing-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { tempToken } = await req.json()

    if (!tempToken) {
      return NextResponse.json(
        { error: 'Token temporaire manquant' },
        { status: 400 }
      )
    }

    // Find the temp OTP record
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        code: tempToken,
        purpose: '2fa_pending',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    if (!otpRecord || !otpRecord.user) {
      return NextResponse.json(
        { error: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 400 }
      )
    }

    const user = otpRecord.user

    // Generate new OTP
    const otp = otpService.generateOTP(user.id, '2fa')

    // Send OTP via SMS
    const phone = user.twoFactorPhone || user.phone
    await smsingService.sendSMS({
      to: phone,
      message: `Votre code de verification CÈCHÉMOI: ${otp.code}. Valable 5 minutes.`,
    })

    return NextResponse.json({
      success: true,
      message: 'Nouveau code envoyé',
    })
  } catch (error) {
    console.error('Resend 2FA OTP error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du code' },
      { status: 500 }
    )
  }
}
