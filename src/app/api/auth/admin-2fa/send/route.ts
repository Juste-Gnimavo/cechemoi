import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpService } from '@/lib/otp-service'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const admin2FASchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = admin2FASchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find admin user by email (admin/manager/staff only)
    const user = await prisma.user.findFirst({
      where: { email, role: { in: ['ADMIN', 'MANAGER', 'STAFF'] } },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        phone: true,
        role: true,
      },
    })

    // Check if user exists and has admin role
    if (!user || !['ADMIN', 'MANAGER', 'STAFF'].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou mot de passe incorrect',
        },
        { status: 401 }
      )
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Compte non configuré. Contactez l\'administrateur.',
        },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou mot de passe incorrect',
        },
        { status: 401 }
      )
    }

    // Check if user has a phone number for 2FA
    if (!user.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Numéro de téléphone non configuré. Contactez l\'administrateur.',
        },
        { status: 400 }
      )
    }

    // Format phone number
    const formattedPhone = otpService.formatPhoneNumber(user.phone)

    // Generate and send OTP
    const result = await otpService.generateAndSend(formattedPhone, 'verify')

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Échec de l\'envoi du code de vérification',
        },
        { status: 500 }
      )
    }

    // Generate a temporary token for 2FA verification
    const tempToken = crypto.randomBytes(32).toString('hex')

    // Store the temp token in database (using OtpCode table with userId)
    await prisma.otpCode.create({
      data: {
        phone: formattedPhone,
        code: tempToken, // Store temp token as the verification reference
        purpose: '2fa',
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    })

    // Mask phone number for display
    const maskedPhone = formattedPhone.replace(/(\+\d{3})\d{6}(\d{2})/, '$1******$2')

    return NextResponse.json({
      success: true,
      tempToken,
      phone: maskedPhone,
      message: 'Code de vérification envoyé',
    })
  } catch (error: any) {
    console.error('Admin 2FA send error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.',
      },
      { status: 500 }
    )
  }
}
