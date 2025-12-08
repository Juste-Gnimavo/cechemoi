import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const customerId = params.id

    // Get customer
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    if (!customer.phone) {
      return NextResponse.json({ error: 'Le client n\'a pas de numéro de téléphone' }, { status: 400 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 })
    }

    // Replace variables in message
    let processedMessage = message
    const variables: Record<string, string> = {
      '{customer_name}': customer.name || 'Client',
      '{billing_phone}': customer.phone || '',
      '{billing_email}': customer.email || '',
    }

    Object.entries(variables).forEach(([key, value]) => {
      processedMessage = processedMessage.replace(new RegExp(key, 'g'), value)
    })

    // Send SMS
    const result = await smsingService.sendSMS({
      to: customer.phone,
      message: processedMessage,
    })

    // Create notification log
    await prisma.notificationLog.create({
      data: {
        trigger: 'CUSTOMER_NOTE', // Using CUSTOMER_NOTE as trigger for manual messages
        channel: 'SMS',
        recipientPhone: customer.phone,
        recipientName: customer.name || undefined,
        content: processedMessage,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error || undefined,
        providerId: result.messageId || undefined,
        providerResponse: {
          sentBy: (session.user as any).id,
          sentByName: session.user?.name || 'Admin',
          originalMessage: message, // Store original with variables
        },
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Échec de l\'envoi du SMS' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'SMS envoyé avec succès',
      recipient: customer.phone,
    })

  } catch (error) {
    console.error('Error sending SMS to customer:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du SMS' },
      { status: 500 }
    )
  }
}

// Get SMS history for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const customerId = params.id

    // Get customer
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Get SMS history
    const history = await prisma.notificationLog.findMany({
      where: {
        recipientPhone: customer.phone,
        channel: 'SMS',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 SMS
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
        errorMessage: true,
        providerResponse: true,
      }
    })

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name || 'Client',
        phone: customer.phone,
      },
      history: history.map(h => ({
        id: h.id,
        message: h.content,
        status: h.status,
        sentAt: h.createdAt,
        error: h.errorMessage,
        metadata: h.providerResponse,
      })),
      total: history.length,
    })

  } catch (error) {
    console.error('Error fetching SMS history:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
