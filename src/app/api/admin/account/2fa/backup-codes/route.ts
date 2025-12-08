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

    // Check if 2FA is enabled
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA doit être activé pour générer des codes de secours' },
        { status: 400 }
      )
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10)

    // Hash backup codes
    const hashedCodes = backupCodes.map(code => bcrypt.hashSync(code, 10))

    // Update user
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        twoFactorBackupCodes: JSON.stringify(hashedCodes),
      },
    })

    return NextResponse.json({
      success: true,
      backupCodes,
      message: 'Nouveaux codes de secours générés',
    })
  } catch (error) {
    console.error('Generate backup codes error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération des codes' },
      { status: 500 }
    )
  }
}
