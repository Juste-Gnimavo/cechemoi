import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

// Sanitize text for PDF - replace special Unicode characters that WinAnsi cannot encode
function sanitizeForPdf(text: string): string {
  if (!text) return ''
  return text
    .replace(/\u202f/g, ' ')  // Narrow no-break space
    .replace(/\u00a0/g, ' ')  // Non-breaking space
    .replace(/\u2019/g, "'")  // Right single quotation mark
    .replace(/\u2018/g, "'")  // Left single quotation mark
    .replace(/\u201c/g, '"')  // Left double quotation mark
    .replace(/\u201d/g, '"')  // Right double quotation mark
    .replace(/\u2013/g, '-')  // En dash
    .replace(/\u2014/g, '-')  // Em dash
    .replace(/\u2026/g, '...') // Ellipsis
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Public access - invoice ID acts as access token
    // Find invoice by ID (no auth required)
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
        order: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
            shippingAddress: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Generate PDF
    const pdfBytes = await generateInvoicePDF(invoice)

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="facture-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}

async function generateInvoicePDF(invoice: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const margin = 50

  // =============================================
  // COLORS - Brand color #744424 (Wine Burgundy)
  // =============================================
  const primaryColor = rgb(0.455, 0.267, 0.141)  // #744424
  const textColor = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.5, 0.5, 0.5)
  const borderColor = rgb(0.85, 0.85, 0.85)
  const tableBorderColor = rgb(0.75, 0.75, 0.75)
  const tableHeaderBg = rgb(0.455, 0.267, 0.141)
  const tableRowAltBg = rgb(0.98, 0.97, 0.96)
  const successColor = rgb(0.15, 0.55, 0.25)
  const paidStampColor = rgb(0.15, 0.55, 0.25)  // Green for PAID
  const unpaidStampColor = rgb(0.8, 0.2, 0.2)   // Red for UNPAID

  let yPos = height - margin

  // =============================================
  // WATERMARK - NON PAYEE (if not paid)
  // Draw first so it appears behind content
  // =============================================
  const isPaid = invoice.status === 'PAID'

  if (!isPaid) {
    // Large diagonal watermark "NON PAYEE" - centered on page
    const watermarkText = 'NON PAYÉE'
    const watermarkSize = 80
    const watermarkWidth = helveticaBold.widthOfTextAtSize(watermarkText, watermarkSize)
    page.drawText(watermarkText, {
      x: (width - watermarkWidth) / 2,
      y: height / 2,
      size: watermarkSize,
      font: helveticaBold,
      color: rgb(0.9, 0.85, 0.85),  // Very light red
      rotate: degrees(-35),
    })
  } else {
    // Large diagonal watermark "PAYEE" - centered on page (for paid invoices)
    const watermarkText = 'PAYÉE'
    const watermarkSize = 80
    const watermarkWidth = helveticaBold.widthOfTextAtSize(watermarkText, watermarkSize)
    page.drawText(watermarkText, {
      x: (width - watermarkWidth) / 2,
      y: height / 2,
      size: watermarkSize,
      font: helveticaBold,
      color: rgb(0.85, 0.95, 0.85),  // Very light green
      rotate: degrees(-35),
    })
  }

  // =============================================
  // LOGO - Embed PNG logo (smaller, aligned top-left)
  // =============================================
  let logoWidth = 0
  try {
    const logoPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png')
    const logoBytes = fs.readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoDims = logoImage.scale(0.15) // Even smaller

    page.drawImage(logoImage, {
      x: margin,
      y: height - margin - logoDims.height + 15, // Higher position
      width: logoDims.width,
      height: logoDims.height,
    })
    logoWidth = logoDims.width
  } catch (error) {
    // Fallback: Draw text logo if image fails
    page.drawText('CÈCHÉMOI', {
      x: margin,
      y: yPos,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    })
    logoWidth = 60
  }

  // =============================================
  // HEADER - Company Info (next to logo)
  // =============================================
  const headerX = margin + logoWidth + 10
  page.drawText('CÈCHÉMOI', {
    x: headerX,
    y: yPos,
    size: 20,
    font: helveticaBold,
    color: primaryColor,
  })

  yPos -= 16
  page.drawText('Boutique de mode sur-mesure et prêt-à-porter', {
    x: headerX,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  })

  yPos -= 12
  page.drawText('Abidjan, Cote d\'Ivoire', {
    x: headerX,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  })

  yPos -= 11
  page.drawText('Tel / WhatsApp: +225 0759545410', {
    x: headerX,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  })

  yPos -= 11
  page.drawText('Siteweb: www.cechemoi.com', {
    x: headerX,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  })

  yPos -= 11
  page.drawText('Email: cechemoicreations@gmail.com', {
    x: headerX,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  })

  // =============================================
  // INVOICE BADGE (Right side)
  // =============================================
  const invoiceBadgeX = width - margin - 160
  const invoiceBadgeY = height - margin

  // Invoice badge background
  page.drawRectangle({
    x: invoiceBadgeX - 10,
    y: invoiceBadgeY - 55,
    width: 170,
    height: 65,
    color: rgb(0.98, 0.97, 0.96),
    borderColor: primaryColor,
    borderWidth: 2,
  })

  page.drawText('FACTURE', {
    x: invoiceBadgeX,
    y: invoiceBadgeY - 18,
    size: 18,
    font: helveticaBold,
    color: primaryColor,
  })

  page.drawText(safeText(invoice.invoiceNumber), {
    x: invoiceBadgeX,
    y: invoiceBadgeY - 34,
    size: 11,
    font: helveticaBold,
    color: textColor,
  })

  page.drawText(`Date: ${formatDate(invoice.issueDate)}`, {
    x: invoiceBadgeX,
    y: invoiceBadgeY - 48,
    size: 9,
    font: helvetica,
    color: lightGray,
  })

  // =============================================
  // DIVIDER LINE
  // =============================================
  yPos = height - margin - 95
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 2,
    color: primaryColor,
  })

  // =============================================
  // BILLING & SHIPPING INFO (Two columns - NO BORDERS)
  // =============================================
  yPos -= 25
  const colWidth = (width - margin * 2 - 30) / 2
  const billingX = margin
  const shippingX = margin + colWidth + 30

  // Billing Section Header
  page.drawText('FACTURÉ À', {
    x: billingX,
    y: yPos,
    size: 11,
    font: helveticaBold,
    color: primaryColor,
  })

  let billingY = yPos - 18
  page.drawText(safeText(invoice.customerName), {
    x: billingX,
    y: billingY,
    size: 11,
    font: helveticaBold,
    color: textColor,
  })

  if (invoice.customerPhone) {
    billingY -= 14
    page.drawText(`Tél: ${safeText(invoice.customerPhone)}`, {
      x: billingX,
      y: billingY,
      size: 10,
      font: helvetica,
      color: textColor,
    })
  }

  if (invoice.customerEmail) {
    billingY -= 13
    page.drawText(safeText(invoice.customerEmail), {
      x: billingX,
      y: billingY,
      size: 9,
      font: helvetica,
      color: lightGray,
    })
  }

  if (invoice.customerAddress) {
    billingY -= 13
    const addressLines = wrapText(invoice.customerAddress, 35)
    for (const line of addressLines) {
      page.drawText(line, {
        x: billingX,
        y: billingY,
        size: 9,
        font: helvetica,
        color: textColor,
      })
      billingY -= 12
    }
  }

  // City and Country - from shipping address if available
  if (invoice.order?.shippingAddress) {
    const cityCountry = [
      invoice.order.shippingAddress.city,
      invoice.order.shippingAddress.country || 'Cote d\'Ivoire'
    ].filter(Boolean).join(', ')

    if (cityCountry) {
      page.drawText(cityCountry, {
        x: billingX,
        y: billingY,
        size: 9,
        font: helvetica,
        color: textColor,
      })
      billingY -= 12
    }
  } else {
    // Default to Cote d'Ivoire if no shipping address
    page.drawText('Cote d\'Ivoire', {
      x: billingX,
      y: billingY,
      size: 9,
      font: helvetica,
      color: textColor,
    })
    billingY -= 12
  }

  // Shipping Section Header
  page.drawText('LIVRÉ À', {
    x: shippingX,
    y: yPos,
    size: 11,
    font: helveticaBold,
    color: primaryColor,
  })

  let shippingY = yPos - 18
  if (invoice.order?.shippingAddress) {
    const addr = invoice.order.shippingAddress

    page.drawText(safeText(addr.fullName), {
      x: shippingX,
      y: shippingY,
      size: 11,
      font: helveticaBold,
      color: textColor,
    })

    shippingY -= 14
    page.drawText(`Tel: ${safeText(addr.phone)}`, {
      x: shippingX,
      y: shippingY,
      size: 10,
      font: helvetica,
      color: textColor,
    })

    // Build address string
    const addressParts = []
    if (addr.quartier) addressParts.push(addr.quartier)
    if (addr.cite) addressParts.push(addr.cite)
    if (addr.rue) addressParts.push(addr.rue)
    if (addr.city) addressParts.push(addr.city)

    if (addressParts.length > 0) {
      shippingY -= 13
      const shipAddressLines = wrapText(addressParts.join(', '), 35)
      for (const line of shipAddressLines) {
        page.drawText(line, {
          x: shippingX,
          y: shippingY,
          size: 9,
          font: helvetica,
          color: textColor,
        })
        shippingY -= 12
      }
    }

    // Delivery instructions if any
    if (addr.instructions) {
      shippingY -= 5
      page.drawText(`Note: ${truncateText(addr.instructions, 40)}`, {
        x: shippingX,
        y: shippingY,
        size: 8,
        font: helvetica,
        color: lightGray,
      })
    }
  } else {
    page.drawText('Même adresse que la facturation', {
      x: shippingX,
      y: shippingY,
      size: 10,
      font: helvetica,
      color: lightGray,
    })
  }

  // =============================================
  // ARTICLES TABLE
  // =============================================
  const tableTop = yPos - 120
  const tableWidth = width - margin * 2

  // Column positions
  const col1 = margin // #
  const col2 = margin + 30 // Description
  const col3 = margin + 260 // Qty
  const col4 = margin + 320 // Unit Price
  const col5 = margin + 420 // Total

  // Table Header
  page.drawRectangle({
    x: margin,
    y: tableTop - 22,
    width: tableWidth,
    height: 25,
    color: tableHeaderBg,
  })

  page.drawText('#', {
    x: col1 + 8,
    y: tableTop - 15,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('DESCRIPTION', {
    x: col2,
    y: tableTop - 15,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('QTE', {
    x: col3,
    y: tableTop - 15,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('PRIX UNIT.', {
    x: col4,
    y: tableTop - 15,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('TOTAL', {
    x: col5,
    y: tableTop - 15,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  // Table Rows
  let itemY = tableTop - 45
  const rowHeight = 25

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i]

    // Check page break
    if (itemY < 180) break

    // Alternating row background
    if (i % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: itemY - 8,
        width: tableWidth,
        height: rowHeight,
        color: tableRowAltBg,
      })
    }

    // Row number
    page.drawText((i + 1).toString(), {
      x: col1 + 10,
      y: itemY,
      size: 9,
      font: helvetica,
      color: lightGray,
    })

    // Description
    page.drawText(truncateText(item.description, 38), {
      x: col2,
      y: itemY,
      size: 10,
      font: helvetica,
      color: textColor,
    })

    // Quantity
    page.drawText(item.quantity.toString(), {
      x: col3 + 10,
      y: itemY,
      size: 10,
      font: helveticaBold,
      color: textColor,
    })

    // Unit price
    page.drawText(formatCurrency(item.unitPrice), {
      x: col4,
      y: itemY,
      size: 10,
      font: helvetica,
      color: textColor,
    })

    // Total
    page.drawText(formatCurrency(item.total), {
      x: col5,
      y: itemY,
      size: 10,
      font: helveticaBold,
      color: textColor,
    })

    // Row border
    page.drawLine({
      start: { x: margin, y: itemY - 10 },
      end: { x: width - margin, y: itemY - 10 },
      thickness: 0.5,
      color: borderColor,
    })

    itemY -= rowHeight
  }

  // Table outer border
  const tableHeight = tableTop - itemY + 5
  page.drawRectangle({
    x: margin,
    y: itemY + 15,
    width: tableWidth,
    height: tableHeight,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  // =============================================
  // TOTALS SECTION
  // =============================================
  const totalsX = width - margin - 200
  let totalsY = itemY - 15

  // Totals box
  page.drawRectangle({
    x: totalsX - 10,
    y: totalsY - 95,
    width: 210,
    height: 100,
    color: rgb(0.98, 0.97, 0.96),
    borderColor: primaryColor,
    borderWidth: 1,
  })

  // Subtotal
  page.drawText('Sous-total', {
    x: totalsX,
    y: totalsY - 15,
    size: 10,
    font: helvetica,
    color: lightGray,
  })
  page.drawText(formatCurrency(invoice.subtotal), {
    x: totalsX + 120,
    y: totalsY - 15,
    size: 10,
    font: helvetica,
    color: textColor,
  })

  // Discount
  if (invoice.discount > 0) {
    page.drawText('Remise', {
      x: totalsX,
      y: totalsY - 30,
      size: 10,
      font: helvetica,
      color: successColor,
    })
    page.drawText(`-${formatCurrency(invoice.discount)}`, {
      x: totalsX + 120,
      y: totalsY - 30,
      size: 10,
      font: helvetica,
      color: successColor,
    })
  }

  // Shipping
  page.drawText('Livraison', {
    x: totalsX,
    y: totalsY - 45,
    size: 6,
    font: helvetica,
    color: lightGray,
  })
  page.drawText(invoice.shippingCost > 0 ? formatCurrency(invoice.shippingCost) : 'Payer au livreur', {
    x: totalsX + 120,
    y: totalsY - 45,
    size: 6,
    font: helvetica,
    color: invoice.shippingCost > 0 ? textColor : successColor,
  })

  // Tax
  if (invoice.tax > 0) {
    page.drawText('Taxes', {
      x: totalsX,
      y: totalsY - 60,
      size: 10,
      font: helvetica,
      color: lightGray,
    })
    page.drawText(formatCurrency(invoice.tax), {
      x: totalsX + 120,
      y: totalsY - 60,
      size: 10,
      font: helvetica,
      color: textColor,
    })
  }

  // Total line
  page.drawLine({
    start: { x: totalsX, y: totalsY - 70 },
    end: { x: totalsX + 190, y: totalsY - 70 },
    thickness: 2,
    color: primaryColor,
  })

  // Grand Total
  page.drawText('TOTAL TTC', {
    x: totalsX,
    y: totalsY - 85,
    size: 12,
    font: helveticaBold,
    color: primaryColor,
  })
  page.drawText(formatCurrency(invoice.total), {
    x: totalsX + 105,
    y: totalsY - 85,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  })

  // =============================================
  // ROUND STAMP - PAYEE only (green) - No stamp for unpaid
  // Positioned on the left side of totals
  // =============================================
  if (isPaid) {
    const stampCenterX = margin + 80
    const stampCenterY = totalsY - 70
    const stampRadius = 45

    // Draw stamp circle (outer)
    page.drawCircle({
      x: stampCenterX,
      y: stampCenterY,
      size: stampRadius,
      borderColor: paidStampColor,
      borderWidth: 5,
    })

    // Draw stamp circle (inner)
    page.drawCircle({
      x: stampCenterX,
      y: stampCenterY,
      size: stampRadius - 6,
      borderColor: paidStampColor,
      borderWidth: 1,
    })

    // Stamp text
    page.drawText('PAYÉE', {
      x: stampCenterX - 28,
      y: stampCenterY - 6,
      size: 16,
      font: helveticaBold,
      color: paidStampColor,
    })
  }

  // =============================================
  // NOTES SECTION
  // =============================================
  if (invoice.notes) {
    const notesY = totalsY - 120
    page.drawText('Notes:', {
      x: margin,
      y: notesY,
      size: 10,
      font: helveticaBold,
      color: primaryColor,
    })

    const noteLines = wrapText(invoice.notes, 70)
    let noteLineY = notesY - 14
    for (const line of noteLines) {
      page.drawText(line, {
        x: margin,
        y: noteLineY,
        size: 9,
        font: helvetica,
        color: textColor,
      })
      noteLineY -= 12
    }
  }

  // =============================================
  // FOOTER
  // =============================================
  const footerY = 55

  // Footer top line
  page.drawLine({
    start: { x: margin, y: footerY + 55 },
    end: { x: width - margin, y: footerY + 55 },
    thickness: 2,
    color: primaryColor,
  })

  // Legal disclaimer
  const legalText = 'Toute tenue ou tout accessoire pay\u00e9, retir\u00e9 ou livr\u00e9 ne pourra faire l\'objet ni de retour, ni d\'\u00e9change, ni de remboursement.'
  const legalText2 = 'Le paiement vaut acceptation sans r\u00e9serve.'
  const legalWidth = helvetica.widthOfTextAtSize(legalText, 7)
  const legal2Width = helvetica.widthOfTextAtSize(legalText2, 7)
  page.drawText(legalText, {
    x: (width - legalWidth) / 2,
    y: footerY + 42,
    size: 7,
    font: helvetica,
    color: lightGray,
  })
  page.drawText(legalText2, {
    x: (width - legal2Width) / 2,
    y: footerY + 32,
    size: 7,
    font: helvetica,
    color: lightGray,
  })

  // Tagline
  const taglineText = 'CECHEMOI - Elegance africaine sur-mesure. Mode feminine personnalisee a Abidjan'
  const taglineWidth = helveticaBold.widthOfTextAtSize(taglineText, 8)
  page.drawText(taglineText, {
    x: (width - taglineWidth) / 2,
    y: footerY + 18,
    size: 8,
    font: helveticaBold,
    color: primaryColor,
  })

  // Contact info
  const contactText = 'Abidjan, Cote d\'Ivoire | email: cechemoicreations@gmail.com | Tel: +225 0759545410 | Site web: www.cechemoi.com'
  const contactWidth = helvetica.widthOfTextAtSize(contactText, 8)
  page.drawText(contactText, {
    x: (width - contactWidth) / 2,
    y: footerY + 5,
    size: 8,
    font: helvetica,
    color: lightGray,
  })

  // Thank you message
  const thankYouText = 'Merci pour votre confiance!'
  const thankYouWidth = helveticaBold.widthOfTextAtSize(thankYouText, 9)
  page.drawText(thankYouText, {
    x: (width - thankYouWidth) / 2,
    y: footerY - 10,
    size: 9,
    font: helveticaBold,
    color: textColor,
  })

  return await pdfDoc.save()
}

function formatDate(dateString: string | Date): string {
  const date = new Date(dateString)
  const formatted = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  return sanitizeForPdf(formatted)
}

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  return sanitizeForPdf(formatted)
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

function truncateText(text: string, maxChars: number): string {
  const sanitized = sanitizeForPdf(text || '')
  if (sanitized.length <= maxChars) return sanitized
  return sanitized.substring(0, maxChars - 3) + '...'
}

// Safe text for PDF - sanitizes any string
function safeText(text: string | null | undefined): string {
  return sanitizeForPdf(text || '')
}
