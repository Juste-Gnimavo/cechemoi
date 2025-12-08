import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/mobile-jwt'
import { otpService } from '@/lib/otp-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  whatsappNumber: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token requis' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, whatsappNumber } = validation.data

    // Check email uniqueness if provided
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: user.id },
        },
      })

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Cet email est déjà utilisé par un autre compte' },
          { status: 400 }
        )
      }
    }

    // Format WhatsApp number if provided
    const formattedWhatsApp = whatsappNumber
      ? otpService.formatPhoneNumber(whatsappNumber)
      : undefined

    // Build update data
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email ? email.toLowerCase() : null
    if (formattedWhatsApp !== undefined) updateData.whatsappNumber = formattedWhatsApp

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        whatsappNumber: updatedUser.whatsappNumber,
        phoneVerified: !!updatedUser.phoneVerified,
      },
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue.' },
      { status: 500 }
    )
  }
}
