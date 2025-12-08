import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/account/invoices/[id] - Get a single invoice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const userId = user.id
    const userPhone = user.phone
    const userEmail = user.email

    // Fetch the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
          },
        },
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Check if the user has access to this invoice
    const hasAccess =
      (invoice.order && invoice.order.userId === userId) ||
      (userPhone && invoice.customerPhone === userPhone) ||
      (userEmail && invoice.customerEmail === userEmail)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Don't show draft invoices to customers
    if (invoice.status === 'DRAFT') {
      return NextResponse.json({ error: 'Facture non disponible' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    )
  }
}
