import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { password } = await req.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis pour désactiver 2FA' },
        { status: 400 }
      )
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        twoFactorEnabled: false,
        twoFactorPhone: null,
        twoFactorBackupCodes: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA désactivé avec succès',
    })
  } catch (error) {
    console.error('Disable 2FA error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la désactivation de 2FA' },
      { status: 500 }
    )
  }
}
