import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pushNotificationService } from '@/lib/push-notification-service'
import { PushTargetType } from '@prisma/client'

/**
 * GET /api/admin/campaigns/push
 * Get all push notification campaigns
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role as string)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [campaigns, total] = await Promise.all([
      prisma.pushCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: { name: true, email: true },
          },
          _count: {
            select: { logs: true },
          },
        },
      }),
      prisma.pushCampaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('[API] Error getting push campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des campagnes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/campaigns/push
 * Create a new push notification campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'MANAGER'].includes((session.user as any).role as string)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      title,
      body: messageBody,
      imageUrl,
      deepLink,
      targetType,
      targetUserIds,
      targetTier,
      targetCity,
      scheduledFor,
      sendNow,
    } = body

    // Validation
    if (!name || !title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'name, title et body sont requis' },
        { status: 400 }
      )
    }

    if (title.length > 65) {
      return NextResponse.json(
        { success: false, error: 'Le titre ne doit pas dépasser 65 caractères' },
        { status: 400 }
      )
    }

    if (messageBody.length > 240) {
      return NextResponse.json(
        { success: false, error: 'Le message ne doit pas dépasser 240 caractères' },
        { status: 400 }
      )
    }

    if (!targetType || !['ALL_USERS', 'SPECIFIC_USERS', 'BY_TIER', 'BY_LOCATION'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: 'targetType invalide' },
        { status: 400 }
      )
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Create campaign
    const campaign = await prisma.pushCampaign.create({
      data: {
        name,
        title,
        body: messageBody,
        imageUrl: imageUrl || null,
        deepLink: deepLink || null,
        targetType: targetType as PushTargetType,
        targetUserIds: targetUserIds || [],
        targetTier: targetTier || null,
        targetCity: targetCity || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
        createdBy: user.id,
      },
    })

    // Send immediately if requested
    if (sendNow) {
      try {
        const result = await pushNotificationService.sendCampaign(campaign.id)
        return NextResponse.json({
          success: true,
          campaign,
          sent: true,
          stats: result,
        })
      } catch (sendError: any) {
        return NextResponse.json({
          success: true,
          campaign,
          sent: false,
          sendError: sendError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error: any) {
    console.error('[API] Error creating push campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la campagne' },
      { status: 500 }
    )
  }
}
