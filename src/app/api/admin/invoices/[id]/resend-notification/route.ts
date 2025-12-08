import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'STAFF') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Get the invoice with order and user info
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                whatsappNumber: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Get customer phone
    const customerPhone = invoice.order?.user?.whatsappNumber ||
                          invoice.order?.user?.phone ||
                          invoice.customerPhone

    if (!customerPhone) {
      return NextResponse.json({
        error: 'Numéro de téléphone du client non trouvé'
      }, { status: 400 })
    }

    // Send notification
    const notificationService = new NotificationService()

    // Send invoice notification
    const result = await notificationService.sendNotification({
      trigger: 'PAYMENT_RECEIVED', // Use payment received as it's related to invoice
      recipientType: 'customer',
      data: {
        recipientPhone: customerPhone,
        orderId: invoice.orderId,
        customer_name: invoice.customerName,
        order_number: invoice.order?.orderNumber || invoice.invoiceNumber,
        order_total: invoice.total.toString(),
        payment_method: 'Facture',
        payment_reference: invoice.invoiceNumber,
        store_name: 'CÈCHÉMOI',
        store_url: 'https://cechemoi.com',
        store_phone: '+225 0759545410',
      },
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notification envoyée avec succès'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi de la notification'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Resend notification error:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'envoi de la notification'
    }, { status: 500 })
  }
}
