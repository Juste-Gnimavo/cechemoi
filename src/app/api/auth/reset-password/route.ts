import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import bcrypt from 'bcryptjs'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - Validate reset token
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token manquant' },
        { status: 400 }
      )
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token not expired
        },
        role: {
          in: ['ADMIN', 'MANAGER', 'STAFF'],
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        valid: false,
        error: 'Token invalide ou expiré',
      })
    }

    return NextResponse.json({
      valid: true,
      message: 'Token valide',
    })
  } catch (error) {
    console.error('Validate token error:', error)
    return NextResponse.json(
      { valid: false, error: 'Erreur de validation' },
      { status: 500 }
    )
  }
}

// POST - Reset password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
        role: {
          in: ['ADMIN', 'MANAGER', 'STAFF'],
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    // Send confirmation email
    if (user.email) {
      await emailService.sendPasswordChangedEmail(
        user.email,
        user.name || 'Administrateur'
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
