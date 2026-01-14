import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateCustomOrderPDF } from '@/lib/custom-order-pdf-generator'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id]/pdf - Generate PDF for custom order
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Fetch order with all related data
    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappNumber: true,
            email: true,
            city: true,
            country: true,
          },
        },
        measurement: {
          select: {
            id: true,
            measurementDate: true,
          },
        },
        items: {
          include: {
            tailor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          include: {
            receivedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Calculate totals
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = order.totalCost + order.materialCost - totalPaid

    // Generate PDF
    const pdfBytes = await generateCustomOrderPDF({
      ...order,
      orderDate: order.orderDate,
      pickupDate: order.pickupDate,
      customerDeadline: order.customerDeadline,
      createdAt: order.createdAt,
    })
    const pdfBuffer = Buffer.from(pdfBytes)

    // Create filename
    const filename = `commande_${order.orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`

    // Return PDF for download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la generation du PDF' },
      { status: 500 }
    )
  }
}
