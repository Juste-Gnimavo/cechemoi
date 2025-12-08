import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - List campaigns with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (channel && channel !== 'all') {
      where.channel = channel
    }
    if (status && status !== 'all') {
      where.status = status
    }

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Get total count
    const total = await prisma.campaign.count({ where })

    return NextResponse.json({
      success: true,
      campaigns,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get campaigns error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des campagnes' },
      { status: 500 }
    )
  }
}

// POST - Create campaign (draft)
export async function POST(req: NextRequest) {
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
      channel,
      message,
      mediaUrl,
      template,
      targetType,
      customNumbers,
      status,
      createdBy,
      createdByName,
      metadata,
    } = body

    // Validate required fields
    if (!name || !channel || !message) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Calculate total recipients
    let totalRecipients = 0
    if (targetType === 'all') {
      totalRecipients = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          phone: { not: '' },
        },
      })
    } else if (targetType === 'custom' && customNumbers) {
      totalRecipients = Array.isArray(customNumbers) ? customNumbers.length : 0
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        channel,
        message,
        mediaUrl: mediaUrl || undefined,
        template: template || undefined,
        targetType,
        customNumbers: targetType === 'custom' ? JSON.stringify(customNumbers) : undefined,
        segmentFilter: undefined,
        totalRecipients,
        sentCount: 0,
        failedCount: 0,
        status: status || 'draft',
        createdBy,
        createdByName,
      },
    })

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la campagne' },
      { status: 500 }
    )
  }
}
