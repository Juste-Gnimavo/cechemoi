import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getPaymentMethodLabel } from './receipt-generator'
import * as fs from 'fs'
import * as path from 'path'

interface ReceiptItem {
  description: string
  quantity: number
  unitPrice: number
}

interface ReceiptData {
  receiptNumber: string
  customerName: string
  customerPhone?: string | null
  customerEmail?: string | null
  amount: number
  paymentMethod: string
  paymentDate: Date
  invoiceNumber?: string | null
  customOrderNumber?: string | null
  createdByName?: string | null
  items?: ReceiptItem[]
  totalCost?: number
}

// Format currency without Unicode narrow spaces (WinAnsi compatible)
function formatCurrency(amount: number): string {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} FCFA`
}

// Format date in French format
function formatDate(date: Date): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} a ${hours}:${minutes}`
}

// Truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 2) + '..'
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Uint8Array> {
  // Create A5 document (148 x 210 mm) for receipt with items - larger than A6
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([419.53, 595.28]) // A5 in points

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const margin = 25

  // Colors
  const darkGray = rgb(0.2, 0.2, 0.2)
  const mediumGray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.7, 0.7, 0.7)
  const primaryColor = rgb(0.455, 0.267, 0.141) // #744424 - brand color

  let y = height - margin

  // === LOGO (small, top-left corner) ===
  try {
    const logoPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png')
    const logoBytes = fs.readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoDims = logoImage.scale(0.08) // Much smaller

    page.drawImage(logoImage, {
      x: margin,
      y: height - margin - logoDims.height + 12, // Higher position
      width: logoDims.width,
      height: logoDims.height,
    })
  } catch (error) {
    // Logo not available, draw text fallback
    page.drawText('CECHEMOI', {
      x: margin,
      y: y - 5,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    })
  }

  // Contact info on the right (no duplicate company name)
  const rightX = width - margin - 120
  page.drawText('Abidjan, Cote d\'Ivoire', {
    x: rightX,
    y: y - 5,
    size: 8,
    font: helvetica,
    color: lightGray,
  })
  page.drawText('Tel: +225 0759545410', {
    x: rightX,
    y: y - 15,
    size: 8,
    font: helvetica,
    color: lightGray,
  })
  page.drawText('www.cechemoi.com', {
    x: rightX,
    y: y - 25,
    size: 8,
    font: helvetica,
    color: lightGray,
  })

  y -= 40

  // Separator line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: primaryColor,
  })
  y -= 25

  // Receipt title
  page.drawText('RECU DE PAIEMENT', {
    x: width / 2 - 60,
    y,
    size: 14,
    font: helveticaBold,
    color: darkGray,
  })
  y -= 18

  // Receipt number
  page.drawText(`N${String.fromCharCode(176)} ${data.receiptNumber}`, {
    x: width / 2 - 50,
    y,
    size: 11,
    font: helveticaBold,
    color: primaryColor,
  })
  y -= 25

  // === CLIENT INFO ===
  page.drawText('Client:', {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: mediumGray,
  })
  page.drawText(data.customerName, {
    x: margin + 45,
    y,
    size: 10,
    font: helveticaBold,
    color: darkGray,
  })
  y -= 15

  if (data.customerPhone) {
    page.drawText('Tel:', {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: mediumGray,
    })
    page.drawText(data.customerPhone, {
      x: margin + 45,
      y,
      size: 10,
      font: helvetica,
      color: darkGray,
    })
    y -= 15
  }

  // === PAYMENT DETAILS (side by side) ===
  y -= 5

  // Left column - Date & Mode
  page.drawText('Date:', {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: mediumGray,
  })
  page.drawText(formatDate(data.paymentDate), {
    x: margin + 45,
    y,
    size: 10,
    font: helvetica,
    color: darkGray,
  })

  // Right column - References
  if (data.customOrderNumber) {
    page.drawText('Commande:', {
      x: width / 2,
      y,
      size: 9,
      font: helvetica,
      color: mediumGray,
    })
    page.drawText(data.customOrderNumber, {
      x: width / 2 + 55,
      y,
      size: 10,
      font: helvetica,
      color: darkGray,
    })
  }
  y -= 15

  page.drawText('Mode:', {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: mediumGray,
  })
  page.drawText(getPaymentMethodLabel(data.paymentMethod), {
    x: margin + 45,
    y,
    size: 10,
    font: helvetica,
    color: darkGray,
  })

  if (data.invoiceNumber) {
    page.drawText('Facture:', {
      x: width / 2,
      y,
      size: 9,
      font: helvetica,
      color: mediumGray,
    })
    page.drawText(data.invoiceNumber, {
      x: width / 2 + 55,
      y,
      size: 10,
      font: helvetica,
      color: darkGray,
    })
  }
  y -= 20

  // Separator
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: lightGray,
  })
  y -= 15

  // === ITEMS TABLE ===
  if (data.items && data.items.length > 0) {
    // Table header
    page.drawText('ARTICLES', {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: primaryColor,
    })
    y -= 15

    // Column headers
    const col1 = margin
    const col2 = width - margin - 120
    const col3 = width - margin - 60

    page.drawText('Description', {
      x: col1,
      y,
      size: 8,
      font: helveticaBold,
      color: mediumGray,
    })
    page.drawText('Qte', {
      x: col2,
      y,
      size: 8,
      font: helveticaBold,
      color: mediumGray,
    })
    page.drawText('Prix', {
      x: col3,
      y,
      size: 8,
      font: helveticaBold,
      color: mediumGray,
    })
    y -= 3

    // Line under headers
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: lightGray,
    })
    y -= 12

    // Items
    for (const item of data.items) {
      if (y < 150) break // Leave room for totals

      page.drawText(truncateText(item.description, 35), {
        x: col1,
        y,
        size: 9,
        font: helvetica,
        color: darkGray,
      })
      page.drawText(item.quantity.toString(), {
        x: col2 + 5,
        y,
        size: 9,
        font: helvetica,
        color: darkGray,
      })
      page.drawText(formatCurrency(item.unitPrice), {
        x: col3 - 10,
        y,
        size: 9,
        font: helvetica,
        color: darkGray,
      })
      y -= 14
    }

    y -= 5
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: lightGray,
    })
    y -= 15

    // Total cost if available
    if (data.totalCost && data.totalCost !== data.amount) {
      page.drawText('Total commande:', {
        x: margin,
        y,
        size: 9,
        font: helvetica,
        color: mediumGray,
      })
      page.drawText(formatCurrency(data.totalCost), {
        x: col3 - 10,
        y,
        size: 10,
        font: helveticaBold,
        color: darkGray,
      })
      y -= 15

      // Balance remaining
      const balance = data.totalCost - data.amount
      if (balance > 0) {
        page.drawText('Solde restant:', {
          x: margin,
          y,
          size: 9,
          font: helvetica,
          color: mediumGray,
        })
        page.drawText(formatCurrency(balance), {
          x: col3 - 10,
          y,
          size: 10,
          font: helvetica,
          color: rgb(0.8, 0.2, 0.2), // Red for remaining balance
        })
        y -= 15
      }
    }
  }

  y -= 10

  // === AMOUNT BOX ===
  const boxHeight = 50
  const boxY = y - boxHeight

  // Draw amount box
  page.drawRectangle({
    x: margin,
    y: boxY,
    width: width - 2 * margin,
    height: boxHeight,
    color: rgb(0.98, 0.96, 0.94),
    borderColor: primaryColor,
    borderWidth: 1.5,
  })

  // Amount label
  page.drawText('MONTANT PAYE', {
    x: margin + 15,
    y: boxY + boxHeight - 18,
    size: 10,
    font: helvetica,
    color: mediumGray,
  })

  // Amount value
  page.drawText(formatCurrency(data.amount), {
    x: margin + 15,
    y: boxY + 12,
    size: 18,
    font: helveticaBold,
    color: primaryColor,
  })

  // Checkmark or status on right side of box
  page.drawText('PAYE', {
    x: width - margin - 60,
    y: boxY + boxHeight / 2 - 8,
    size: 14,
    font: helveticaBold,
    color: rgb(0.15, 0.55, 0.25), // Green
  })

  y = boxY - 20

  // === FOOTER ===
  // Staff who received
  if (data.createdByName) {
    page.drawText(`Recu par: ${data.createdByName}`, {
      x: margin,
      y,
      size: 8,
      font: helvetica,
      color: mediumGray,
    })
    y -= 15
  }

  // Separator
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: primaryColor,
  })
  y -= 15

  // Thank you message
  const thankYouText = 'Merci pour votre confiance !'
  const thankYouWidth = helveticaBold.widthOfTextAtSize(thankYouText, 10)
  page.drawText(thankYouText, {
    x: (width - thankYouWidth) / 2,
    y,
    size: 10,
    font: helveticaBold,
    color: darkGray,
  })

  // Contact info footer
  const footerText = 'CECHEMOI - Abidjan, Cote d\'Ivoire | Tel: +225 0759545410 | www.cechemoi.com'
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 7)
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: margin,
    size: 7,
    font: helvetica,
    color: lightGray,
  })

  return pdfDoc.save()
}
