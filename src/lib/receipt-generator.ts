import { prisma } from './prisma'

/**
 * Generate a unique receipt number
 * Format: REC-DDMMYY-0001
 */
export async function generateReceiptNumber(): Promise<string> {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear().toString().slice(-2)
  const datePrefix = `REC-${day}${month}${year}-`

  // Find the last receipt number for today
  const lastReceipt = await prisma.receipt.findFirst({
    where: {
      receiptNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      receiptNumber: 'desc',
    },
    select: {
      receiptNumber: true,
    },
  })

  let nextNumber = 1
  if (lastReceipt) {
    const lastNumber = parseInt(lastReceipt.receiptNumber.replace(datePrefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${datePrefix}${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Payment method labels in French
 */
export const paymentMethodLabels: Record<string, string> = {
  CASH: 'Especes',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOBILE_MONEY: 'MTN MoMo',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Cheque',
  CARD: 'Carte bancaire',
  OTHER: 'Autre',
}

/**
 * Get payment method label in French
 */
export function getPaymentMethodLabel(method: string): string {
  return paymentMethodLabels[method] || method
}
