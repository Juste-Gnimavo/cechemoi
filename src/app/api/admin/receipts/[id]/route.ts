import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/receipts/[id] - Get receipt detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: {
        customOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            amountPaid: true,
            status: true,
          },
        },
        customOrderPayment: {
          select: {
            id: true,
            paymentType: true,
          },
        },
        invoicePayment: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Reçu non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      receipt,
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/receipts/[id] - Delete receipt (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN can delete receipts
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Reçu non trouvé' }, { status: 404 })
    }

    // Delete the receipt
    await prisma.receipt.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Reçu supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
