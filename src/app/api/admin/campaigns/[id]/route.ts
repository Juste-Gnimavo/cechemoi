import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - Get campaign by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        logs: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error('Get campaign error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la campagne' },
      { status: 500 }
    )
  }
}

// PUT - Update campaign
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      name,
      message,
      mediaUrl,
      template,
      targetType,
      customNumbers,
      status,
    } = body

    // Check if campaign exists and is editable
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campagne introuvable' },
        { status: 404 }
      )
    }

    if (existingCampaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Seules les campagnes en brouillon peuvent être modifiées' },
        { status: 400 }
      )
    }

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        name: name || existingCampaign.name,
        message: message || existingCampaign.message,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : existingCampaign.mediaUrl,
        template: template !== undefined ? template : existingCampaign.template,
        targetType: targetType || existingCampaign.targetType,
        customNumbers: targetType === 'custom' ? JSON.stringify(customNumbers) : existingCampaign.customNumbers,
        status: status || existingCampaign.status,
      },
    })

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error('Update campaign error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la campagne' },
      { status: 500 }
    )
  }
}

// DELETE - Delete campaign
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Check if campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne introuvable' },
        { status: 404 }
      )
    }

    // Delete campaign (logs will be cascade deleted)
    await prisma.campaign.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Campagne supprimée',
    })
  } catch (error) {
    console.error('Delete campaign error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la campagne' },
      { status: 500 }
    )
  }
}
