import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Update user's login tracking info
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        lastLoginIp: ip,
        lastLoginBrowser: userAgent,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking login:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
