/**
 * API Route: Admin Standalone Payment Detail
 * GET /api/admin/standalone-payments/[id] - Get single payment
 * POST /api/admin/standalone-payments/[id]/resend-notification - Resend notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resendStandalonePaymentNotification } from '@/lib/notifications/standalone-payment'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    const payment = await prisma.standalonePayment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (error) {
    console.error('[Admin Standalone Payment Detail] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any)?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const url = new URL(request.url)
    const action = url.pathname.split('/').pop()

    if (action === 'resend-notification' || request.url.includes('resend')) {
      // Resend notification
      const result = await resendStandalonePaymentNotification(id)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Notification renvoyée avec succès',
        })
      } else {
        return NextResponse.json(
          { success: false, error: result.error || 'Échec de l\'envoi' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Action non reconnue' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Admin Standalone Payment Action] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
