import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { otpService } from '@/lib/otp-service'
import crypto from 'crypto'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code, backupCode } = await req.json()

    if (!tempToken) {
      return NextResponse.json(
        { error: 'Token de session temporaire manquant' },
        { status: 400 }
      )
    }

    // Find the OTP record with tempToken stored in the code field during login
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

    // Verify with backup code
    if (backupCode) {
      if (!user.twoFactorBackupCodes) {
        return NextResponse.json(
          { error: 'Aucun code de secours configuré' },
          { status: 400 }
        )
      }

      const storedCodes = JSON.parse(user.twoFactorBackupCodes)

      // Find matching backup code
      let validCodeIndex = -1
      for (let i = 0; i < storedCodes.length; i++) {
        if (bcrypt.compareSync(backupCode, storedCodes[i])) {
          validCodeIndex = i
          break
        }
      }

      if (validCodeIndex === -1) {
        return NextResponse.json(
          { error: 'Code de secours invalide' },
          { status: 401 }
        )
      }

      // Remove used backup code
      storedCodes.splice(validCodeIndex, 1)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: JSON.stringify(storedCodes),
        },
      })

      // Delete temp OTP record
      await prisma.otpCode.delete({
        where: { id: otpRecord.id },
      })

      // Create session token
      const sessionToken = crypto.randomBytes(32).toString('hex')

      return NextResponse.json({
        success: true,
        sessionToken,
        message: 'Vérification réussie avec code de secours',
      })
    }

    // Verify with OTP code
    if (code) {
      // Find the actual 2FA OTP
      const twoFactorOtp = await prisma.otpCode.findFirst({
        where: {
          userId: user.id,
          code: code,
          purpose: '2fa',
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      if (!twoFactorOtp) {
        return NextResponse.json(
          { error: 'Code OTP invalide ou expiré' },
          { status: 401 }
        )
      }

      // Mark OTP as verified
      await prisma.otpCode.update({
        where: { id: twoFactorOtp.id },
        data: { verified: true },
      })

      // Delete temp OTP record
      await prisma.otpCode.delete({
        where: { id: otpRecord.id },
      })

      // Create session token
      const sessionToken = crypto.randomBytes(32).toString('hex')

      return NextResponse.json({
        success: true,
        sessionToken,
        message: 'Vérification réussie',
      })
    }

    return NextResponse.json(
      { error: 'Code OTP ou code de secours requis' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Verify 2FA error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
