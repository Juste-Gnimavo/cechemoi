import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import crypto from 'crypto'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Don't reveal if user exists (security best practice)
    if (!user || user.role === 'CUSTOMER') {
      // Still return success to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: 'Si un compte administrateur existe, un email a été envoyé',
      })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    })

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

    const emailSent = await emailService.sendPasswordResetEmail(
      user.email!,
      user.name || 'Administrateur',
      resetUrl
    )

    if (!emailSent) {
      console.error('Failed to send password reset email')
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Si un compte administrateur existe, un email a été envoyé',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
