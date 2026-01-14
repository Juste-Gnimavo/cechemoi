import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateReceiptPDF } from '@/lib/receipt-pdf-generator'

export const dynamic = 'force-dynamic'

// GET /api/admin/receipts/[id]/pdf - Generate PDF for receipt
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Fetch receipt with related data including items
    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: {
        customOrder: {
          select: {
            orderNumber: true,
            items: {
              select: {
                garmentType: true,
                customType: true,
                description: true,
                quantity: true,
                unitPrice: true,
              },
            },
            totalCost: true,
            materialCost: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            items: {
              select: {
                description: true,
                quantity: true,
                unitPrice: true,
                total: true,
              },
            },
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Reçu non trouvé' }, { status: 404 })
    }

    // Build items list from custom order or invoice
    let items: Array<{ description: string; quantity: number; unitPrice: number }> = []
    let totalCost = receipt.amount

    if (receipt.customOrder) {
      items = receipt.customOrder.items.map((item) => ({
        description: `${item.garmentType}${item.customType ? ` - ${item.customType}` : ''}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
      totalCost = receipt.customOrder.totalCost
    } else if (receipt.invoice?.items) {
      items = receipt.invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    }

    // Generate PDF
    const pdfBytes = await generateReceiptPDF({
      receiptNumber: receipt.receiptNumber,
      customerName: receipt.customerName,
      customerPhone: receipt.customerPhone,
      customerEmail: receipt.customerEmail,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
      paymentDate: receipt.paymentDate,
      invoiceNumber: receipt.invoice?.invoiceNumber,
      customOrderNumber: receipt.customOrder?.orderNumber,
      createdByName: receipt.createdByName,
      items,
      totalCost,
    })

    const pdfBuffer = Buffer.from(pdfBytes)

    // Create filename
    const filename = `recu_${receipt.receiptNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`

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
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
