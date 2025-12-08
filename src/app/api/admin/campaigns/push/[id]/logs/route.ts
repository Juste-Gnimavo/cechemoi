import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/campaigns/push/[id]/logs
 * Get all notification logs for a push campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role as string)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const campaignId = params.id

    // Verify campaign exists
    const campaign = await prisma.pushCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 })
    }

    // Get all logs for this campaign
    const logs = await prisma.pushNotificationLog.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100, // Limit to 100 logs
    })

    return NextResponse.json({
      success: true,
      logs,
      campaign: {
        id: campaign.id,
        name: campaign.name,
      },
    })
  } catch (error: any) {
    console.error('[API] Error getting push campaign logs:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    )
  }
}
