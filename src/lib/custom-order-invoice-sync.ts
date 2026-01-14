import { prisma } from './prisma'
import { InvoiceStatus, PaymentMethod } from '@prisma/client'
import { generateReceiptNumber } from './receipt-generator'

/**
 * Generate invoice number format: FAC-DDMMYY-0001
 */
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear().toString().slice(-2)
  const datePrefix = `FAC-${day}${month}${year}-`

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  })

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(datePrefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${datePrefix}${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Create an Invoice from a CustomOrder
 * Called when a custom order is created
 */
export async function createInvoiceFromCustomOrder(
  customOrderId: string,
  createdById?: string
): Promise<string> {
  // Fetch the custom order with all necessary data
  const customOrder = await prisma.customOrder.findUnique({
    where: { id: customOrderId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          country: true,
        },
      },
      items: true,
    },
  })

  if (!customOrder) {
    throw new Error('Commande sur-mesure non trouvée')
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findUnique({
    where: { customOrderId },
  })

  if (existingInvoice) {
    return existingInvoice.id
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber()

  // Build customer address
  const customerAddress = [customOrder.customer.city, customOrder.customer.country]
    .filter(Boolean)
    .join(', ')

  // Calculate subtotal from items
  const itemsSubtotal = customOrder.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  // Total = items + material cost
  const total = itemsSubtotal + customOrder.materialCost

  // Due date is pickup date
  const dueDate = customOrder.pickupDate

  // Create the invoice with items
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customOrderId,
      customerName: customOrder.customer.name || 'Client',
      customerEmail: customOrder.customer.email,
      customerPhone: customOrder.customer.phone,
      customerAddress: customerAddress || null,
      status: InvoiceStatus.SENT,
      issueDate: customOrder.orderDate,
      dueDate,
      subtotal: itemsSubtotal,
      tax: 0,
      shippingCost: 0,
      discount: 0,
      total,
      amountPaid: 0,
      notes: `Commande sur-mesure N${String.fromCharCode(176)} ${customOrder.orderNumber}`,
      createdById,
      items: {
        create: [
          // Create items from custom order items
          ...customOrder.items.map((item) => ({
            description: `${item.garmentType}${item.customType ? ` - ${item.customType}` : ''}${item.description ? `: ${item.description}` : ''}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
          // Add material cost if > 0
          ...(customOrder.materialCost > 0
            ? [
                {
                  description: 'Coût matériel (tissu, accessoires)',
                  quantity: 1,
                  unitPrice: customOrder.materialCost,
                  total: customOrder.materialCost,
                },
              ]
            : []),
        ],
      },
    },
  })

  return invoice.id
}

/**
 * Map custom payment method string to PaymentMethod enum
 */
function mapPaymentMethod(method: string | null): PaymentMethod {
  const mapping: Record<string, PaymentMethod> = {
    CASH: PaymentMethod.CASH,
    WAVE: PaymentMethod.WAVE,
    ORANGE_MONEY: PaymentMethod.ORANGE_MONEY,
    MTN_MOBILE_MONEY: PaymentMethod.MTN_MOBILE_MONEY,
    BANK_TRANSFER: PaymentMethod.BANK_TRANSFER,
    CHECK: PaymentMethod.CHECK,
    CARD: PaymentMethod.PAIEMENTPRO,
    OTHER: PaymentMethod.OTHER,
  }
  return mapping[method || ''] || PaymentMethod.CASH
}

/**
 * Sync a CustomOrderPayment to InvoicePayment
 * Called when a payment is added to a custom order
 */
export async function syncPaymentToInvoice(
  customOrderPaymentId: string,
  customOrderId: string,
  createdById?: string
): Promise<{ invoicePaymentId: string; receiptId: string }> {
  // Get the payment
  const payment = await prisma.customOrderPayment.findUnique({
    where: { id: customOrderPaymentId },
    include: {
      customOrder: {
        include: {
          customer: true,
          invoice: true,
        },
      },
      receivedBy: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!payment) {
    throw new Error('Paiement non trouvé')
  }

  // Get or create invoice
  let invoiceId = payment.customOrder.invoice?.id

  if (!invoiceId) {
    invoiceId = await createInvoiceFromCustomOrder(customOrderId, createdById)
  }

  // Create InvoicePayment
  const invoicePayment = await prisma.invoicePayment.create({
    data: {
      invoiceId,
      amount: payment.amount,
      paymentMethod: mapPaymentMethod(payment.paymentMethod),
      reference: `CP-${customOrderPaymentId.slice(-8)}`,
      paidAt: payment.paidAt,
      notes: payment.notes,
      createdById,
    },
  })

  // Link the invoice payment to custom order payment
  await prisma.customOrderPayment.update({
    where: { id: customOrderPaymentId },
    data: { invoicePaymentId: invoicePayment.id },
  })

  // Generate receipt
  const receiptNumber = await generateReceiptNumber()

  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber,
      customOrderPaymentId,
      invoicePaymentId: invoicePayment.id,
      customerName: payment.customOrder.customer.name || 'Client',
      customerPhone: payment.customOrder.customer.phone,
      customerEmail: payment.customOrder.customer.email,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'CASH',
      paymentDate: payment.paidAt,
      invoiceId,
      customOrderId,
      createdById,
      createdByName: payment.receivedBy?.name || null,
    },
  })

  // Update invoice amountPaid and status
  await updateInvoiceAmountAndStatus(invoiceId)

  return { invoicePaymentId: invoicePayment.id, receiptId: receipt.id }
}

/**
 * Update invoice amountPaid and status based on payments
 */
export async function updateInvoiceAmountAndStatus(invoiceId: string): Promise<void> {
  // Get all payments for this invoice
  const payments = await prisma.invoicePayment.findMany({
    where: { invoiceId },
    select: { amount: true },
  })

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  // Get the invoice total
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { total: true },
  })

  if (!invoice) return

  // Determine status
  let status: InvoiceStatus

  if (totalPaid <= 0) {
    status = InvoiceStatus.SENT
  } else if (totalPaid < invoice.total) {
    status = InvoiceStatus.PARTIAL
  } else {
    status = InvoiceStatus.PAID
  }

  // Update invoice
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: totalPaid,
      status,
      paidDate: status === InvoiceStatus.PAID ? new Date() : null,
    },
  })
}

/**
 * Delete a payment and its synced data
 * Called when a payment is deleted from custom order
 */
export async function deletePaymentAndSync(customOrderPaymentId: string): Promise<void> {
  // Get the payment with relations
  const payment = await prisma.customOrderPayment.findUnique({
    where: { id: customOrderPaymentId },
    include: {
      receipt: true,
      customOrder: {
        include: {
          invoice: true,
        },
      },
    },
  })

  if (!payment) return

  // Delete receipt if exists
  if (payment.receipt) {
    await prisma.receipt.delete({
      where: { id: payment.receipt.id },
    })
  }

  // Delete invoice payment if exists
  if (payment.invoicePaymentId) {
    await prisma.invoicePayment.delete({
      where: { id: payment.invoicePaymentId },
    })
  }

  // Delete the custom order payment
  await prisma.customOrderPayment.delete({
    where: { id: customOrderPaymentId },
  })

  // Update invoice amount and status
  if (payment.customOrder.invoice) {
    await updateInvoiceAmountAndStatus(payment.customOrder.invoice.id)
  }
}
