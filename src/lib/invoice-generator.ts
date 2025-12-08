import { prisma } from '@/lib/prisma'

/**
 * Generate a unique invoice number in format: INV-YYYY-NNNN
 * Example: INV-2025-0001, INV-2025-0002, etc.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Find the latest invoice for the current year
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
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

  if (latestInvoice) {
    // Extract the number part from INV-2025-0001
    const parts = latestInvoice.invoiceNumber.split('-')
    const currentNumber = parseInt(parts[2], 10)

    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1
    }
  }

  // Pad with zeros to 4 digits
  const paddedNumber = String(nextNumber).padStart(4, '0')

  return `${prefix}${paddedNumber}`
}

/**
 * Check if an invoice number already exists
 */
export async function invoiceNumberExists(invoiceNumber: string): Promise<boolean> {
  const existing = await prisma.invoice.findUnique({
    where: {
      invoiceNumber,
    },
    select: {
      id: true,
    },
  })

  return !!existing
}
