import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, degrees } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

// Types
interface CustomOrderItem {
  id: string
  garmentType: string
  customType?: string | null
  description?: string | null
  quantity: number
  unitPrice: number
  status: string
  tailor?: {
    id: string
    name: string | null
  } | null
}

interface CustomOrderPayment {
  id: string
  amount: number
  paymentType: string
  paymentMethod?: string | null
  paidAt: Date
  notes?: string | null
}

interface CustomOrder {
  id: string
  orderNumber: string
  status: string
  priority: string
  orderDate: Date
  pickupDate: Date
  customerDeadline?: Date | null
  totalCost: number
  materialCost: number
  notes?: string | null
  customer: {
    id: string
    name?: string | null
    phone: string
    whatsappNumber?: string | null
    email?: string | null
    city?: string | null
    country?: string | null
  }
  measurement?: {
    id: string
    measurementDate: Date
  } | null
  items: CustomOrderItem[]
  payments: CustomOrderPayment[]
  createdBy?: {
    id: string
    name: string | null
  } | null
  createdAt: Date
}

// Status labels
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_PRODUCTION: 'En production',
  FITTING: 'Essayage',
  ALTERATIONS: 'Retouches',
  READY: 'Pret',
  DELIVERED: 'Livre',
  CANCELLED: 'Annule',
}

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CUTTING: 'Coupe',
  SEWING: 'Couture',
  FITTING: 'Essayage',
  ALTERATIONS: 'Retouches',
  FINISHING: 'Finitions',
  COMPLETED: 'Termine',
  DELIVERED: 'Livre',
}

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  VIP: 'VIP',
}

// Sanitize text for PDF
function sanitizeForPdf(text: string): string {
  if (!text) return ''
  return text
    .replace(/\u202f/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, (char) => {
      const replacements: Record<string, string> = {
        '\u00e9': 'e',
        '\u00e8': 'e',
        '\u00ea': 'e',
        '\u00eb': 'e',
        '\u00e0': 'a',
        '\u00e2': 'a',
        '\u00ee': 'i',
        '\u00ef': 'i',
        '\u00f4': 'o',
        '\u00f6': 'o',
        '\u00f9': 'u',
        '\u00fb': 'u',
        '\u00e7': 'c',
        '\u00c9': 'E',
        '\u00c8': 'E',
        '\u00c0': 'A',
        '\u00c7': 'C',
      }
      return replacements[char] || char
    })
}

function safeText(text: string | null | undefined): string {
  return sanitizeForPdf(text || '')
}

function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const formatted = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return sanitizeForPdf(formatted)
}

function formatCurrency(amount: number): string {
  // Use simple formatting to avoid Unicode narrow spaces from toLocaleString
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} FCFA`
}

function wrapText(text: string, maxChars: number): string[] {
  const sanitized = sanitizeForPdf(text || '')
  const words = sanitized.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim()
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)

  return lines
}

// Main PDF generation function
export async function generateCustomOrderPDF(order: CustomOrder): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const margin = 40

  // Colors
  const brandOrange = rgb(0.9, 0.32, 0)
  const tableHeaderRed = rgb(0.8, 0.15, 0.15)
  const textBlack = rgb(0.1, 0.1, 0.1)
  const textGray = rgb(0.4, 0.4, 0.4)
  const lineGray = rgb(0.7, 0.7, 0.7)
  const tableBorderColor = rgb(0.3, 0.3, 0.3)
  const greenColor = rgb(0.1, 0.6, 0.2)
  const orangeColor = rgb(0.9, 0.5, 0.1)

  const topMargin = 25
  let yPos = height - topMargin

  // =============================================
  // WATERMARK (centered properly)
  // =============================================
  const watermarkText = 'CECHEMOI'
  const watermarkSize = 70
  const watermarkColor = rgb(0.9, 0.95, 0.9)
  const watermarkWidth = helveticaBold.widthOfTextAtSize(watermarkText, watermarkSize)

  page.drawText(watermarkText, {
    x: (width - watermarkWidth) / 2 - 50,
    y: height / 2 - 50,
    size: watermarkSize,
    font: helveticaBold,
    color: watermarkColor,
    rotate: degrees(45),
  })

  // =============================================
  // TITLE - FICHE DE COMMANDE SUR-MESURE
  // =============================================
  const titleText = 'FICHE DE COMMANDE SUR-MESURE'
  const titleFontSize = 14
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, titleFontSize)
  const titleBoxWidth = titleWidth + 30
  const titleBoxHeight = 22
  const titleBoxX = (width - titleBoxWidth) / 2
  const titleBoxY = height - topMargin - titleBoxHeight

  page.drawRectangle({
    x: titleBoxX,
    y: titleBoxY,
    width: titleBoxWidth,
    height: titleBoxHeight,
    borderColor: brandOrange,
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  })

  page.drawText(titleText, {
    x: titleBoxX + 15,
    y: titleBoxY + 6,
    size: titleFontSize,
    font: helveticaBold,
    color: brandOrange,
  })

  // =============================================
  // LOGO
  // =============================================
  const headerY = height - topMargin - titleBoxHeight - 10
  const logoSize = 45

  try {
    const logoPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png')
    const logoBytes = fs.readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)

    page.drawImage(logoImage, {
      x: margin,
      y: headerY - logoSize,
      width: logoSize,
      height: logoSize,
    })
  } catch {
    page.drawText('CECHEMOI', {
      x: margin,
      y: headerY - 20,
      size: 14,
      font: helveticaBold,
      color: brandOrange,
    })
  }

  // =============================================
  // ORDER INFO BOX (right side)
  // =============================================
  const infoBoxWidth = 200
  const infoBoxHeight = 55
  const infoBoxX = width - margin - infoBoxWidth
  const infoBoxY = headerY - infoBoxHeight

  page.drawRectangle({
    x: infoBoxX,
    y: infoBoxY,
    width: infoBoxWidth,
    height: infoBoxHeight,
    borderColor: tableBorderColor,
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  })

  // Order number
  page.drawText('N Commande:', {
    x: infoBoxX + 8,
    y: infoBoxY + infoBoxHeight - 15,
    size: 9,
    font: helvetica,
    color: textGray,
  })
  page.drawText(order.orderNumber, {
    x: infoBoxX + 80,
    y: infoBoxY + infoBoxHeight - 15,
    size: 11,
    font: helveticaBold,
    color: textBlack,
  })

  // Status
  page.drawText('Statut:', {
    x: infoBoxX + 8,
    y: infoBoxY + infoBoxHeight - 30,
    size: 9,
    font: helvetica,
    color: textGray,
  })
  page.drawText(STATUS_LABELS[order.status] || order.status, {
    x: infoBoxX + 80,
    y: infoBoxY + infoBoxHeight - 30,
    size: 9,
    font: helveticaBold,
    color: order.status === 'DELIVERED' ? greenColor : order.status === 'CANCELLED' ? rgb(0.8, 0.1, 0.1) : textBlack,
  })

  // Priority
  page.drawText('Priorite:', {
    x: infoBoxX + 8,
    y: infoBoxY + infoBoxHeight - 45,
    size: 9,
    font: helvetica,
    color: textGray,
  })
  page.drawText(PRIORITY_LABELS[order.priority] || order.priority, {
    x: infoBoxX + 80,
    y: infoBoxY + infoBoxHeight - 45,
    size: 9,
    font: helveticaBold,
    color: order.priority === 'VIP' ? rgb(0.8, 0.1, 0.1) : order.priority === 'URGENT' ? orangeColor : textBlack,
  })

  // =============================================
  // CUSTOMER SECTION
  // =============================================
  yPos = headerY - logoSize - 20

  page.drawRectangle({
    x: margin,
    y: yPos - 60,
    width: width - margin * 2,
    height: 70,
    borderColor: tableBorderColor,
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  })

  page.drawText('INFORMATIONS CLIENT', {
    x: margin + 10,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandOrange,
  })

  yPos -= 15
  page.drawText(`Nom: ${safeText(order.customer.name)}`, {
    x: margin + 10,
    y: yPos,
    size: 9,
    font: helvetica,
    color: textBlack,
  })

  page.drawText(`Tel: ${order.customer.phone}`, {
    x: margin + 250,
    y: yPos,
    size: 9,
    font: helvetica,
    color: textBlack,
  })

  yPos -= 12
  if (order.customer.email) {
    page.drawText(`Email: ${safeText(order.customer.email)}`, {
      x: margin + 10,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textBlack,
    })
  }

  if (order.customer.whatsappNumber) {
    page.drawText(`WhatsApp: ${order.customer.whatsappNumber}`, {
      x: margin + 250,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textBlack,
    })
  }

  yPos -= 12
  if (order.customer.city) {
    page.drawText(`Ville: ${safeText(order.customer.city)}${order.customer.country ? `, ${safeText(order.customer.country)}` : ''}`, {
      x: margin + 10,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textBlack,
    })
  }

  // =============================================
  // DATES SECTION
  // =============================================
  yPos -= 30

  page.drawText('DATES IMPORTANTES', {
    x: margin,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandOrange,
  })

  yPos -= 15
  const datesBoxY = yPos - 25

  page.drawRectangle({
    x: margin,
    y: datesBoxY,
    width: (width - margin * 2) / 3 - 5,
    height: 35,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  page.drawText('Date commande', {
    x: margin + 8,
    y: datesBoxY + 22,
    size: 8,
    font: helvetica,
    color: textGray,
  })
  page.drawText(formatDate(order.orderDate), {
    x: margin + 8,
    y: datesBoxY + 8,
    size: 10,
    font: helveticaBold,
    color: textBlack,
  })

  const pickupBoxX = margin + (width - margin * 2) / 3
  page.drawRectangle({
    x: pickupBoxX,
    y: datesBoxY,
    width: (width - margin * 2) / 3 - 5,
    height: 35,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  page.drawText('Date de retrait', {
    x: pickupBoxX + 8,
    y: datesBoxY + 22,
    size: 8,
    font: helvetica,
    color: textGray,
  })
  page.drawText(formatDate(order.pickupDate), {
    x: pickupBoxX + 8,
    y: datesBoxY + 8,
    size: 10,
    font: helveticaBold,
    color: orangeColor,
  })

  if (order.customerDeadline) {
    const deadlineBoxX = margin + ((width - margin * 2) / 3) * 2
    page.drawRectangle({
      x: deadlineBoxX,
      y: datesBoxY,
      width: (width - margin * 2) / 3 - 5,
      height: 35,
      borderColor: tableBorderColor,
      borderWidth: 1,
    })

    page.drawText('Deadline client', {
      x: deadlineBoxX + 8,
      y: datesBoxY + 22,
      size: 8,
      font: helvetica,
      color: textGray,
    })
    page.drawText(formatDate(order.customerDeadline), {
      x: deadlineBoxX + 8,
      y: datesBoxY + 8,
      size: 10,
      font: helveticaBold,
      color: rgb(0.8, 0.1, 0.1),
    })
  }

  // =============================================
  // ITEMS TABLE
  // =============================================
  yPos = datesBoxY - 25

  page.drawText('ARTICLES', {
    x: margin,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandOrange,
  })

  yPos -= 5
  const tableStartY = yPos
  const tableWidth = width - margin * 2
  const colWidths = {
    num: 25,
    type: 150,
    qty: 40,
    price: 80,
    status: 80,
    tailor: 140,
  }

  // Table Header
  page.drawRectangle({
    x: margin,
    y: tableStartY - 18,
    width: tableWidth,
    height: 20,
    color: tableHeaderRed,
  })

  let colX = margin + 5
  page.drawText('N', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.num
  page.drawText('TYPE', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.type
  page.drawText('QTE', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.qty
  page.drawText('PRIX', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.price
  page.drawText('STATUT', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.status
  page.drawText('COUTURIER', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })

  // Table Rows
  let rowY = tableStartY - 35
  const rowHeight = 18

  order.items.forEach((item, index) => {
    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: rowY - 3,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.97, 0.97, 0.97),
      })
    }

    colX = margin + 5
    page.drawText((index + 1).toString(), { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
    colX += colWidths.num

    const typeText = item.customType ? `${item.garmentType} (${item.customType})` : item.garmentType
    page.drawText(safeText(typeText).substring(0, 35), { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
    colX += colWidths.type

    page.drawText(item.quantity.toString(), { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
    colX += colWidths.qty

    const itemTotal = (item.unitPrice * item.quantity).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    page.drawText(`${itemTotal} F`, { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
    colX += colWidths.price

    page.drawText(ITEM_STATUS_LABELS[item.status] || item.status, { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
    colX += colWidths.status

    page.drawText(safeText(item.tailor?.name || 'Non assigne'), { x: colX, y: rowY + 2, size: 8, font: helvetica, color: item.tailor ? textBlack : textGray })

    // Row bottom border
    page.drawLine({
      start: { x: margin, y: rowY - 3 },
      end: { x: margin + tableWidth, y: rowY - 3 },
      thickness: 0.5,
      color: lineGray,
    })

    rowY -= rowHeight
  })

  // Table border
  const tableHeight = tableStartY - rowY + 5
  page.drawRectangle({
    x: margin,
    y: rowY + rowHeight - 3,
    width: tableWidth,
    height: tableHeight,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  // =============================================
  // FINANCIAL SUMMARY
  // =============================================
  yPos = rowY - 10

  page.drawText('RESUME FINANCIER', {
    x: margin,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandOrange,
  })

  yPos -= 5
  const financeBoxWidth = 200
  const financeBoxHeight = 100
  const financeBoxX = width - margin - financeBoxWidth

  page.drawRectangle({
    x: financeBoxX,
    y: yPos - financeBoxHeight,
    width: financeBoxWidth,
    height: financeBoxHeight,
    borderColor: tableBorderColor,
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  })

  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = order.totalCost + order.materialCost - totalPaid

  let finY = yPos - 15
  const finLabelX = financeBoxX + 10
  const finValueX = financeBoxX + financeBoxWidth - 10

  // Cost of items
  page.drawText('Cout tenues:', { x: finLabelX, y: finY, size: 9, font: helvetica, color: textGray })
  const itemsCostText = formatCurrency(order.totalCost)
  page.drawText(itemsCostText, { x: finValueX - helvetica.widthOfTextAtSize(itemsCostText, 9), y: finY, size: 9, font: helvetica, color: textBlack })

  finY -= 14
  // Material cost
  page.drawText('Cout materiel:', { x: finLabelX, y: finY, size: 9, font: helvetica, color: textGray })
  const materialCostText = formatCurrency(order.materialCost)
  page.drawText(materialCostText, { x: finValueX - helvetica.widthOfTextAtSize(materialCostText, 9), y: finY, size: 9, font: helvetica, color: textBlack })

  finY -= 14
  // Total
  page.drawLine({ start: { x: finLabelX, y: finY + 10 }, end: { x: finValueX, y: finY + 10 }, thickness: 0.5, color: lineGray })
  page.drawText('TOTAL:', { x: finLabelX, y: finY, size: 10, font: helveticaBold, color: textBlack })
  const totalText = formatCurrency(order.totalCost + order.materialCost)
  page.drawText(totalText, { x: finValueX - helveticaBold.widthOfTextAtSize(totalText, 10), y: finY, size: 10, font: helveticaBold, color: textBlack })

  finY -= 14
  // Paid
  page.drawText('Paye:', { x: finLabelX, y: finY, size: 9, font: helvetica, color: greenColor })
  const paidText = formatCurrency(totalPaid)
  page.drawText(paidText, { x: finValueX - helvetica.widthOfTextAtSize(paidText, 9), y: finY, size: 9, font: helvetica, color: greenColor })

  finY -= 14
  // Balance
  page.drawText('RELIQUAT:', { x: finLabelX, y: finY, size: 10, font: helveticaBold, color: balance > 0 ? orangeColor : greenColor })
  const balanceText = formatCurrency(balance)
  page.drawText(balanceText, { x: finValueX - helveticaBold.widthOfTextAtSize(balanceText, 10), y: finY, size: 10, font: helveticaBold, color: balance > 0 ? orangeColor : greenColor })

  // =============================================
  // PAYMENTS TABLE (full width)
  // =============================================
  yPos = yPos - financeBoxHeight - 20

  if (order.payments.length > 0) {
    page.drawText('HISTORIQUE DES PAIEMENTS', {
      x: margin,
      y: yPos,
      size: 10,
      font: helveticaBold,
      color: brandOrange,
    })

    yPos -= 5
    const payTableStartY = yPos
    const payTableWidth = width - margin * 2
    const payColWidths = {
      num: 25,
      date: 80,
      amount: 100,
      method: 100,
      type: 80,
      notes: payTableWidth - 25 - 80 - 100 - 100 - 80,
    }

    // Payment table header
    page.drawRectangle({
      x: margin,
      y: payTableStartY - 16,
      width: payTableWidth,
      height: 18,
      color: tableHeaderRed,
    })

    let payColX = margin + 5
    page.drawText('N', { x: payColX, y: payTableStartY - 12, size: 7, font: helveticaBold, color: rgb(1, 1, 1) })
    payColX += payColWidths.num
    page.drawText('DATE', { x: payColX, y: payTableStartY - 12, size: 7, font: helveticaBold, color: rgb(1, 1, 1) })
    payColX += payColWidths.date
    page.drawText('MONTANT', { x: payColX, y: payTableStartY - 12, size: 7, font: helveticaBold, color: rgb(1, 1, 1) })
    payColX += payColWidths.amount
    page.drawText('MODE', { x: payColX, y: payTableStartY - 12, size: 7, font: helveticaBold, color: rgb(1, 1, 1) })
    payColX += payColWidths.method
    page.drawText('TYPE', { x: payColX, y: payTableStartY - 12, size: 7, font: helveticaBold, color: rgb(1, 1, 1) })
    payColX += payColWidths.type
    page.drawText('NOTES', { x: payColX, y: payTableStartY - 12, size: 7, font: helveticaBold, color: rgb(1, 1, 1) })

    // Payment rows
    let payRowY = payTableStartY - 30
    const payRowHeight = 14

    const paymentTypeLabels: Record<string, string> = {
      DEPOSIT: 'Avance',
      INSTALLMENT: 'Acompte',
      FINAL: 'Solde',
    }

    order.payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: payRowY - 2,
          width: payTableWidth,
          height: payRowHeight,
          color: rgb(0.97, 0.97, 0.97),
        })
      }

      payColX = margin + 5
      page.drawText((index + 1).toString(), { x: payColX, y: payRowY + 2, size: 7, font: helvetica, color: textBlack })
      payColX += payColWidths.num

      page.drawText(formatDate(payment.paidAt), { x: payColX, y: payRowY + 2, size: 7, font: helvetica, color: textBlack })
      payColX += payColWidths.date

      page.drawText(formatCurrency(payment.amount), { x: payColX, y: payRowY + 2, size: 7, font: helveticaBold, color: greenColor })
      payColX += payColWidths.amount

      page.drawText(safeText(payment.paymentMethod || '-'), { x: payColX, y: payRowY + 2, size: 7, font: helvetica, color: textBlack })
      payColX += payColWidths.method

      page.drawText(paymentTypeLabels[payment.paymentType] || payment.paymentType, { x: payColX, y: payRowY + 2, size: 7, font: helvetica, color: textBlack })
      payColX += payColWidths.type

      const notesText = safeText(payment.notes || '-').substring(0, 30)
      page.drawText(notesText, { x: payColX, y: payRowY + 2, size: 7, font: helvetica, color: textGray })

      // Row bottom border
      page.drawLine({
        start: { x: margin, y: payRowY - 2 },
        end: { x: margin + payTableWidth, y: payRowY - 2 },
        thickness: 0.5,
        color: lineGray,
      })

      payRowY -= payRowHeight
    })

    // Total row
    page.drawRectangle({
      x: margin,
      y: payRowY - 2,
      width: payTableWidth,
      height: payRowHeight + 2,
      color: rgb(0.95, 0.95, 0.95),
    })

    page.drawText('TOTAL PAYE:', { x: margin + payColWidths.num + 5, y: payRowY + 2, size: 8, font: helveticaBold, color: textBlack })
    page.drawText(formatCurrency(totalPaid), { x: margin + payColWidths.num + payColWidths.date + 5, y: payRowY + 2, size: 8, font: helveticaBold, color: greenColor })

    // Table border
    const payTableHeight = payTableStartY - payRowY + 5
    page.drawRectangle({
      x: margin,
      y: payRowY - 2,
      width: payTableWidth,
      height: payTableHeight,
      borderColor: tableBorderColor,
      borderWidth: 1,
    })

    yPos = payRowY - 15
  }

  // =============================================
  // NOTES SECTION
  // =============================================

  if (order.notes) {
    page.drawText('NOTES:', { x: margin, y: yPos, size: 9, font: helveticaBold, color: textBlack })
    yPos -= 5

    page.drawRectangle({
      x: margin,
      y: yPos - 40,
      width: tableWidth,
      height: 45,
      borderColor: tableBorderColor,
      borderWidth: 1,
    })

    const noteLines = wrapText(order.notes, 100)
    let noteY = yPos - 12
    for (const line of noteLines.slice(0, 3)) {
      page.drawText(line, { x: margin + 8, y: noteY, size: 8, font: helvetica, color: textBlack })
      noteY -= 10
    }
  }

  // =============================================
  // FOOTER
  // =============================================
  const footerY = 25

  page.drawLine({
    start: { x: margin, y: footerY + 22 },
    end: { x: width - margin, y: footerY + 22 },
    thickness: 0.5,
    color: brandOrange,
  })

  // Company info
  const footerText = '01 BP 4790 Abidjan 01 - COCODY, Riviera Palmeraie - Tel: (+225) 0759545410 / 0767188230 - www.cechemoi.com'
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 7)

  page.drawText(sanitizeForPdf(footerText), {
    x: (width - footerWidth) / 2,
    y: footerY + 10,
    size: 7,
    font: helvetica,
    color: textGray,
  })

  // Created by
  if (order.createdBy) {
    const staffText = `Fiche creee par: ${order.createdBy.name}`
    page.drawText(sanitizeForPdf(staffText), {
      x: margin,
      y: footerY,
      size: 6,
      font: helvetica,
      color: textGray,
    })
  }

  // Generation date
  const genDateText = `Genere le: ${formatDate(new Date())}`
  page.drawText(genDateText, {
    x: width - margin - helvetica.widthOfTextAtSize(genDateText, 6),
    y: footerY,
    size: 6,
    font: helvetica,
    color: textGray,
  })

  return await pdfDoc.save()
}
