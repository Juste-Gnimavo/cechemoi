import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/campaigns/push/[id]
 * Get details of a push campaign
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

    const campaign = await prisma.pushCampaign.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        _count: {
          select: { logs: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error: any) {
    console.error('[API] Error getting push campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la campagne' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/campaigns/push/[id]
 * Delete a push campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN'].includes((session.user as any).role as string)) {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const campaign = await prisma.pushCampaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 })
    }

    // Delete the campaign (logs will be cascade deleted)
    await prisma.pushCampaign.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Campagne supprimée',
    })
  } catch (error: any) {
    console.error('[API] Error deleting push campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la campagne' },
      { status: 500 }
    )
  }
}
