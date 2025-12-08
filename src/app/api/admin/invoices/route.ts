import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber } from '@/lib/invoice-generator'
import { InvoiceStatus } from '@prisma/client'
import { notificationService } from '@/lib/notification-service'
import { smsingService } from '@/lib/smsing-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/invoices - List all invoices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as InvoiceStatus
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    )
  }
}

// POST /api/admin/invoices - Create a new invoice (standalone or from order)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items, // For standalone invoices
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes,
      dueDate,
      invoiceDate,
      status,
    } = body

    // Validate required fields
    if (!customerName) {
      return NextResponse.json(
        { error: 'Le nom du client est requis' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un article est requis' },
        { status: 400 }
      )
    }

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // If orderId is provided, check if order already has an invoice
    if (orderId) {
      const existingInvoice = await prisma.invoice.findUnique({
        where: { orderId },
      })

      if (existingInvoice) {
        return NextResponse.json(
          { error: 'Cette commande a déjà une facture' },
          { status: 400 }
        )
      }
    }

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: orderId || null,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        status: status || InvoiceStatus.DRAFT,
        subtotal,
        tax: tax || 0,
        shippingCost: shippingCost || 0,
        discount: discount || 0,
        total,
        notes: notes || null,
        issueDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: (session.user as any).id,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId || null,
          })),
        },
      },
      include: {
        items: true,
        order: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Send invoice notification if requested (using database templates)
    const { sendSMS, sendWhatsApp } = body
    if ((sendSMS || sendWhatsApp) && invoice.status !== 'DRAFT' && customerPhone) {
      try {
        // Generate invoice PDF URL
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://cechemoi.com'
        const invoiceUrl = `${baseUrl}/api/invoices/${invoice.id}/pdf`

        // Send text notification with template
        await notificationService.sendNotification({
          trigger: 'INVOICE_CREATED',
          recipientType: 'customer',
          data: {
            customer_name: customerName,
            order_number: orderId ? invoice.order?.orderNumber : invoiceNumber,
            invoice_number: invoiceNumber,
            order_total: `${Math.round(total)} CFA`,
            order_date: (invoiceDate ? new Date(invoiceDate) : new Date()).toLocaleDateString('fr-FR'),
            invoice_url: invoiceUrl,
            recipientPhone: customerPhone,
          },
          sendBoth: sendSMS && sendWhatsApp,
        })

        // Send PDF attachment via WhatsApp (if WhatsApp is enabled)
        if (sendWhatsApp) {
          try {
            const pdfMessage = `Facture #${invoiceNumber} - CÈCHÉMOI`
            await smsingService.sendWhatsAppBusiness({
              to: customerPhone,
              message: pdfMessage,
              mediaUrl: invoiceUrl,
            })
            console.log(`[Admin Invoice] PDF attachment sent via WhatsApp to ${customerPhone}`)
          } catch (pdfError) {
            console.error('Error sending invoice PDF attachment:', pdfError)
          }
        }
      } catch (error) {
        console.error('Error sending invoice notification:', error)
      }
    }

    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture' },
      { status: 500 }
    )
  }
}
