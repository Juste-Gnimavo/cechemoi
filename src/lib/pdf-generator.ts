import PDFDocument from 'pdfkit'
import { formatPrice, formatDate } from '@/lib/utils'
import QRCode from 'qrcode'

// Get base URL from environment
const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://cave-express.ci'

interface OrderData {
  orderNumber: string
  createdAt: Date
  customer: {
    name: string
    phone: string
    whatsappNumber?: string
  }
  shippingAddress: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  status: string
}

export class PDFGeneratorService {
  /**
   * Generate Invoice PDF
   */
  async generateInvoice(order: OrderData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Facture ${order.orderNumber}`,
            Author: 'Cave Express',
            Subject: `Facture pour commande ${order.orderNumber}`,
          },
        })

        const buffers: Buffer[] = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
          resolve(pdfBuffer)
        })

        // Header
        doc.fontSize(24).fillColor('#ef4444').text('FACTURE', { align: 'right' })
        doc.moveDown(0.5)

        // Company Info
        doc.fontSize(12).fillColor('#000000')
        doc.text('Cave Express', 50, 100)
        doc.fontSize(10).fillColor('#666666')
        doc.text('Faya Cité Génie 2000', 50, 118)
        doc.text('Abidjan, Côte d\'Ivoire', 50, 133)
        doc.text('Tél: +225 0556791431', 50, 148)
        doc.text('Email: contact@cave-express.ci', 50, 163)

        // Invoice Number and Date
        doc.fontSize(10).fillColor('#000000')
        doc.text(`N° Facture: ${order.orderNumber}`, 400, 100)
        doc.text(`Date: ${formatDate(order.createdAt)}`, 400, 115)

        // Generate QR Code for order tracking
        const qrCodeDataUrl = await QRCode.toDataURL(
          `${getBaseUrl()}/orders/${order.orderNumber}`
        )
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
        doc.image(qrBuffer, 450, 140, { width: 80 })

        // Customer Info
        doc.moveDown(6)
        doc.fontSize(12).fillColor('#000000').text('Client:', { underline: true })
        doc.fontSize(10).fillColor('#666666')
        doc.text(order.customer.name, { indent: 20 })
        doc.text(`Tél: ${order.customer.phone}`, { indent: 20 })
        if (order.customer.whatsappNumber) {
          doc.text(`WhatsApp: ${order.customer.whatsappNumber}`, { indent: 20 })
        }

        // Shipping Address
        doc.moveDown(1)
        doc.fontSize(12).fillColor('#000000').text('Adresse de livraison:', { underline: true })
        doc.fontSize(10).fillColor('#666666')
        doc.text(order.shippingAddress.fullName, { indent: 20 })
        doc.text(order.shippingAddress.addressLine1, { indent: 20 })
        if (order.shippingAddress.addressLine2) {
          doc.text(order.shippingAddress.addressLine2, { indent: 20 })
        }
        doc.text(`${order.shippingAddress.city}, Côte d'Ivoire`, { indent: 20 })
        doc.text(`Tél: ${order.shippingAddress.phone}`, { indent: 20 })

        // Table Header
        doc.moveDown(2)
        const tableTop = doc.y
        const itemX = 50
        const qtyX = 300
        const priceX = 370
        const totalX = 470

        doc.fontSize(10).fillColor('#ffffff')
        doc.rect(50, tableTop, 495, 25).fill('#1e293b')

        doc.text('Produit', itemX + 5, tableTop + 8, { width: 240 })
        doc.text('Qté', qtyX, tableTop + 8, { width: 60, align: 'center' })
        doc.text('Prix Unit.', priceX, tableTop + 8, { width: 90, align: 'right' })
        doc.text('Total', totalX, tableTop + 8, { width: 70, align: 'right' })

        // Table Rows
        let currentY = tableTop + 35
        doc.fillColor('#000000').fontSize(9)

        order.items.forEach((item, index) => {
          if (currentY > 700) {
            doc.addPage()
            currentY = 50
          }

          const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff'
          doc.rect(50, currentY - 5, 495, 20).fill(bgColor)

          doc.fillColor('#000000')
          doc.text(item.name, itemX + 5, currentY, { width: 240 })
          doc.text(item.quantity.toString(), qtyX, currentY, { width: 60, align: 'center' })
          doc.text(formatPrice(item.price), priceX, currentY, { width: 90, align: 'right' })
          doc.text(formatPrice(item.total), totalX, currentY, { width: 70, align: 'right' })

          currentY += 20
        })

        // Totals
        currentY += 20
        doc.fontSize(10)

        doc.text('Sous-total:', 350, currentY)
        doc.text(formatPrice(order.subtotal), totalX, currentY, { width: 70, align: 'right' })

        currentY += 20
        doc.text('Livraison:', 350, currentY)
        doc.text(formatPrice(order.shippingCost), totalX, currentY, { width: 70, align: 'right' })

        if (order.discount > 0) {
          currentY += 20
          doc.text('Réduction:', 350, currentY)
          doc.text(`-${formatPrice(order.discount)}`, totalX, currentY, { width: 70, align: 'right' })
        }

        if (order.tax > 0) {
          currentY += 20
          doc.text('TVA:', 350, currentY)
          doc.text(formatPrice(order.tax), totalX, currentY, { width: 70, align: 'right' })
        }

        currentY += 25
        doc.fontSize(12).fillColor('#ef4444')
        doc.rect(350, currentY - 5, 195, 25).fill('#fee2e2')
        doc.fillColor('#000000')
        doc.text('TOTAL:', 355, currentY)
        doc.text(formatPrice(order.total), totalX, currentY, { width: 70, align: 'right' })

        // Payment Info
        currentY += 40
        doc.fontSize(10).fillColor('#000000')
        doc.text(`Mode de paiement: ${this.formatPaymentMethod(order.paymentMethod)}`, 50, currentY)
        doc.text(`Statut paiement: ${this.formatPaymentStatus(order.paymentStatus)}`, 50, currentY + 15)

        // Footer
        doc.fontSize(8).fillColor('#666666')
        doc.text(
          'Merci pour votre confiance! Pour toute question, contactez-nous au +225 0556791431',
          50,
          750,
          { align: 'center', width: 495 }
        )

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Generate Receipt PDF (simpler than invoice)
   */
  async generateReceipt(order: OrderData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        })

        const buffers: Buffer[] = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
          resolve(pdfBuffer)
        })

        // Header
        doc.fontSize(20).fillColor('#ef4444').text('REÇU DE PAIEMENT', { align: 'center' })
        doc.moveDown(2)

        // Company Info
        doc.fontSize(12).fillColor('#000000').text('Cave Express', { align: 'center' })
        doc.fontSize(10).fillColor('#666666')
        doc.text('Faya Cité Génie 2000, Abidjan', { align: 'center' })
        doc.text('Tél: +225 0556791431', { align: 'center' })
        doc.moveDown(2)

        // Receipt Info
        doc.fontSize(12).fillColor('#000000')
        doc.text(`Commande N°: ${order.orderNumber}`, { align: 'center' })
        doc.text(`Date: ${formatDate(order.createdAt)}`, { align: 'center' })
        doc.moveDown(2)

        // Customer
        doc.fontSize(11).text(`Client: ${order.customer.name}`)
        doc.fontSize(10).text(`Téléphone: ${order.customer.phone}`)
        doc.moveDown(1.5)

        // Items
        doc.fontSize(11).text('Articles:', { underline: true })
        doc.moveDown(0.5)

        order.items.forEach((item) => {
          doc.fontSize(10)
          doc.text(`• ${item.name}`, { indent: 20 })
          doc.text(`  ${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(item.total)}`, {
            indent: 25,
          })
        })

        doc.moveDown(1.5)

        // Totals
        doc.fontSize(11)
        doc.text(`Sous-total: ${formatPrice(order.subtotal)}`)
        doc.text(`Livraison: ${formatPrice(order.shippingCost)}`)
        if (order.discount > 0) {
          doc.text(`Réduction: -${formatPrice(order.discount)}`)
        }

        doc.moveDown(0.5)
        doc.fontSize(14).fillColor('#ef4444')
        doc.text(`TOTAL PAYÉ: ${formatPrice(order.total)}`, { underline: true })

        doc.moveDown(2)
        doc.fontSize(10).fillColor('#000000')
        doc.text(`Mode de paiement: ${this.formatPaymentMethod(order.paymentMethod)}`)
        doc.text(`Statut: ${this.formatPaymentStatus(order.paymentStatus)}`)

        // QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(
          `${getBaseUrl()}/orders/${order.orderNumber}`
        )
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
        doc.moveDown(2)
        doc.image(qrBuffer, 230, doc.y, { width: 100, align: 'center' })

        doc.moveDown(6)
        doc.fontSize(9).fillColor('#666666')
        doc.text('Ce reçu confirme votre paiement. Conservez-le précieusement.', { align: 'center' })
        doc.text('Merci de votre confiance!', { align: 'center' })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      STRIPE: 'Carte bancaire (Stripe)',
      WAVE: 'Wave',
      ORANGE_MONEY: 'Orange Money',
      MTN_MOBILE_MONEY: 'MTN Mobile Money',
      CASH_ON_DELIVERY: 'Paiement à la livraison',
    }

    return methods[method] || method
  }

  /**
   * Format payment status for display
   */
  private formatPaymentStatus(status: string): string {
    const statuses: Record<string, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Payé',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
    }

    return statuses[status] || status
  }
}

export const pdfGenerator = new PDFGeneratorService()
