import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateFicheSuiviConfectionPDF } from '@/lib/fiche-suivi-confection-pdf-generator'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id]/fiche-suivi-confection - Generate Fiche de Suivi Confection PDF
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            tailor: {
              select: {
                name: true,
              },
            },
          },
        },
        materialUsages: {
          where: {
            type: 'OUT',
          },
          include: {
            material: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const pdfBytes = await generateFicheSuiviConfectionPDF({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: order.status,
      notes: order.notes,
      customer: order.customer,
      items: order.items,
      materialMovements: order.materialUsages.map(mu => ({
        material: mu.material,
        quantity: mu.quantity,
        unitPrice: mu.unitPrice,
        totalCost: mu.totalCost,
        notes: mu.notes,
        createdAt: mu.createdAt,
      })),
      createdBy: order.createdBy,
    })

    const pdfBuffer = Buffer.from(pdfBytes)
    const filename = `fiche_suivi_confection_${order.orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Fiche suivi confection PDF generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
