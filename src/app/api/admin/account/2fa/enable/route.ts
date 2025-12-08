import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Generate backup codes
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase()
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase()
    codes.push(`${part1}-${part2}`)
  }
  return codes
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      )
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)

    // Hash backup codes before storing
    const hashedCodes = backupCodes.map(code => bcrypt.hashSync(code, 10))

    // Update user
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        twoFactorEnabled: true,
        twoFactorPhone: phone,
        twoFactorBackupCodes: JSON.stringify(hashedCodes),
      },
    })

    return NextResponse.json({
      success: true,
      backupCodes, // Return plain codes only once for user to save
      message: '2FA activé avec succès',
    })
  } catch (error) {
    console.error('Enable 2FA error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation de 2FA' },
      { status: 500 }
    )
  }
}
