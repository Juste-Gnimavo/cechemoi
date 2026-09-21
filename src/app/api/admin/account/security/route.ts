import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'dashboard')
    if (denied) return denied

    // Get user security settings
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        twoFactorEnabled: true,
        twoFactorPhone: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorPhone: user.twoFactorPhone,
    })
  } catch (error) {
    console.error('Get security settings error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}
