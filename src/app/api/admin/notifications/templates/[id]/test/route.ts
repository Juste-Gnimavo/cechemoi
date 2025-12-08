import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/notifications/templates/[id]/test - Test send a notification
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
    }

    // Get template
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 })
    }

    // Render template with sample data
    const sampleData: Record<string, string> = {
      '{customer_name}': 'Test Client',
      '{billing_first_name}': 'Test',
      '{billing_last_name}': 'Client',
      '{billing_phone}': phone,
      '{billing_email}': 'test@example.com',
      '{order_number}': 'ORD-TEST-001',
      '{order_id}': 'test-order-id',
      '{order_date}': new Date().toLocaleDateString('fr-FR'),
      '{order_status}': 'PROCESSING',
      '{order_total}': '50000 CFA',
      '{order_subtotal}': '45000 CFA',
      '{order_tax}': '2500 CFA',
      '{order_shipping}': '2500 CFA',
      '{order_discount}': '0 CFA',
      '{order_product}': 'Vin Rouge Bordeaux 2020',
      '{order_product_with_qty}': 'Vin Rouge Bordeaux 2020 x2',
      '{order_items_count}': '2',
      '{payment_method}': 'Orange Money',
      '{payment_reference}': 'PAY-TEST-001',
      '{payment_status}': 'COMPLETED',
      '{tracking_number}': 'TRACK-TEST-001',
      '{product_name}': 'Vin Rouge Bordeaux 2020',
      '{product_quantity}': '2',
      '{low_stock_quantity}': '5',
      '{store_name}': 'CÈCHÉMOI',
      '{store_url}': 'https://cechemoi.com',
      '{store_phone}': '+2250759545410',
      '{store_whatsapp}': '+2250759545410',
    }

    let renderedContent = template.content
    for (const [variable, value] of Object.entries(sampleData)) {
      renderedContent = renderedContent.replace(new RegExp(variable, 'g'), value)
    }

    // Send test notification
    let success = false
    let error = null

    try {
      if (template.channel === 'SMS') {
        const result = await smsingService.sendSMS({ to: phone, message: renderedContent })
        success = result.success
        error = result.error || null
      } else if (template.channel === 'WHATSAPP' || template.channel === 'WHATSAPP_CLOUD') {
        const result = await smsingService.sendWhatsAppBusiness({ to: phone, message: renderedContent })
        success = result.success
        error = result.error || null
      }
    } catch (err: any) {
      error = err.message
    }

    // Log the test
    await prisma.notificationLog.create({
      data: {
        trigger: template.trigger,
        channel: template.channel,
        recipientPhone: phone,
        content: renderedContent,
        status: success ? 'sent' : 'failed',
        errorMessage: error,
        providerResponse: {
          test: true,
          sentBy: (session.user as any).id,
        },
      },
    })

    if (!success) {
      return NextResponse.json({
        success: false,
        error: error || 'Erreur lors de l\'envoi',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Test envoyé avec succès',
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du test' },
      { status: 500 }
    )
  }
}
