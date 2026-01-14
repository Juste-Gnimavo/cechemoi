import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      )
    }

    // Check if user already exists with same email for admin roles
    const existingUser = await prisma.user.findFirst({
      where: { email, role: { in: ['ADMIN', 'MANAGER', 'STAFF'] } },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    // Create cart for user
    await prisma.cart.create({
      data: {
        userId: user.id,
      },
    })

    return NextResponse.json(
      { message: 'Compte créé avec succès', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    )
  }
}
