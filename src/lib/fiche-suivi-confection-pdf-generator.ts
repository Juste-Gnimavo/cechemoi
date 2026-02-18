import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

// Types
interface FicheSuiviData {
  orderNumber: string
  orderDate: Date
  status: string
  notes?: string | null
  customer: { name?: string | null; phone: string }
  items: Array<{
    garmentType: string
    customType?: string | null
    tailor?: { name: string | null } | null
  }>
  materialMovements: Array<{
    material: { name: string; unit: string }
    quantity: number
    unitPrice: number
    totalCost: number
    notes?: string | null
    createdAt: Date
  }>
  createdBy?: { name: string | null } | null
}

// Sanitize text for PDF (reused from custom-order-pdf-generator)
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

function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const formatted = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return sanitizeForPdf(`${formatted} a ${time}`)
}

function formatCurrency(amount: number): string {
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

export async function generateFicheSuiviConfectionPDF(data: FicheSuiviData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const { width, height } = page.getSize()
  const margin = 40

  // Colors
  const brandOrange = rgb(0.9, 0.32, 0)
  const tableHeaderRed = rgb(0.8, 0.15, 0.15)
  const textBlack = rgb(0.1, 0.1, 0.1)
  const textGray = rgb(0.4, 0.4, 0.4)
  const lineGray = rgb(0.7, 0.7, 0.7)
  const tableBorderColor = rgb(0.3, 0.3, 0.3)

  let yPos = height - 25

  // =============================================
  // WATERMARK
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
  // LOGO (top left)
  // =============================================
  const logoSize = 50
  try {
    const logoPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png')
    const logoBytes = fs.readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    page.drawImage(logoImage, {
      x: margin,
      y: height - 25 - logoSize,
      width: logoSize,
      height: logoSize,
    })
  } catch {
    page.drawText('CECHEMOI', {
      x: margin,
      y: height - 50,
      size: 14,
      font: helveticaBold,
      color: brandOrange,
    })
  }

  // =============================================
  // TITLE (centered, boxed)
  // =============================================
  const titleText = 'FICHE DE SUIVI CONFECTION CECHEMOI'
  const titleFontSize = 13
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, titleFontSize)
  const titleBoxWidth = titleWidth + 30
  const titleBoxHeight = 24
  const titleBoxX = (width - titleBoxWidth) / 2
  const titleBoxY = height - 35 - titleBoxHeight

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
    y: titleBoxY + 7,
    size: titleFontSize,
    font: helveticaBold,
    color: brandOrange,
  })

  // =============================================
  // INFO BLOCK (2 columns)
  // =============================================
  yPos = titleBoxY - 25

  const infoBlockY = yPos
  const infoBlockHeight = 55
  const halfWidth = (width - margin * 2) / 2

  // Border around info block
  page.drawRectangle({
    x: margin,
    y: infoBlockY - infoBlockHeight,
    width: width - margin * 2,
    height: infoBlockHeight,
    borderColor: tableBorderColor,
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  })

  // Vertical divider
  page.drawLine({
    start: { x: margin + halfWidth, y: infoBlockY },
    end: { x: margin + halfWidth, y: infoBlockY - infoBlockHeight },
    thickness: 0.5,
    color: lineGray,
  })

  // Left column
  const leftX = margin + 10
  let infoY = infoBlockY - 14

  page.drawText('Fiche N :', { x: leftX, y: infoY, size: 9, font: helveticaBold, color: textBlack })
  page.drawText(safeText(data.orderNumber), { x: leftX + 55, y: infoY, size: 9, font: helvetica, color: textBlack })

  infoY -= 14
  const garmentTypes = data.items.map(i => {
    const base = safeText(i.garmentType)
    return i.customType ? `${base} (${safeText(i.customType)})` : base
  }).join(', ')
  page.drawText("Type d'article :", { x: leftX, y: infoY, size: 9, font: helveticaBold, color: textBlack })
  const garmentText = garmentTypes.length > 40 ? garmentTypes.substring(0, 40) + '...' : garmentTypes
  page.drawText(garmentText, { x: leftX + 85, y: infoY, size: 8, font: helvetica, color: textBlack })

  infoY -= 14
  page.drawText('Date du rdv client :', { x: leftX, y: infoY, size: 9, font: helveticaBold, color: textBlack })
  page.drawText('......................................', { x: leftX + 105, y: infoY, size: 9, font: helvetica, color: lineGray })

  // Right column
  const rightX = margin + halfWidth + 10
  infoY = infoBlockY - 14

  page.drawText('Date du jour :', { x: rightX, y: infoY, size: 9, font: helveticaBold, color: textBlack })
  page.drawText(formatDate(data.orderDate), { x: rightX + 80, y: infoY, size: 9, font: helvetica, color: textBlack })

  infoY -= 14
  page.drawText('Nom du client :', { x: rightX, y: infoY, size: 9, font: helveticaBold, color: textBlack })
  page.drawText(safeText(data.customer.name || data.customer.phone), { x: rightX + 85, y: infoY, size: 9, font: helvetica, color: textBlack })

  infoY -= 14
  const uniqueTailors = [...new Set(data.items.filter(i => i.tailor?.name).map(i => safeText(i.tailor!.name)))]
  page.drawText('Couturier :', { x: rightX, y: infoY, size: 9, font: helveticaBold, color: textBlack })
  page.drawText(uniqueTailors.length > 0 ? uniqueTailors.join(', ') : 'Non assigne', {
    x: rightX + 65,
    y: infoY,
    size: 9,
    font: helvetica,
    color: uniqueTailors.length > 0 ? textBlack : textGray,
  })

  // =============================================
  // TABLE: Besoin en materiels
  // =============================================
  yPos = infoBlockY - infoBlockHeight - 20

  page.drawText('Besoin en materiels', {
    x: (width - helveticaBold.widthOfTextAtSize('Besoin en materiels', 11)) / 2,
    y: yPos,
    size: 11,
    font: helveticaOblique,
    color: textBlack,
  })

  yPos -= 8
  const tableStartY = yPos
  const tableWidth = width - margin * 2

  // Column widths
  const colWidths = {
    num: 30,
    name: 160,
    qty: 65,
    unitPrice: 80,
    totalPrice: 80,
    obs: tableWidth - 30 - 160 - 65 - 80 - 80,
  }

  // Table header
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
  page.drawText('Nom du materiel', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.name
  page.drawText('Quantite', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.qty
  page.drawText('Prix unitaire', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.unitPrice
  page.drawText('Prix total', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })
  colX += colWidths.totalPrice
  page.drawText('Observation', { x: colX, y: tableStartY - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) })

  // Table rows - minimum 8 rows like the paper form
  const minRows = 8
  const totalRows = Math.max(minRows, data.materialMovements.length)
  const rowHeight = 18
  let rowY = tableStartY - 35

  let grandTotalCost = 0

  for (let i = 0; i < totalRows; i++) {
    // Alternating row background
    if (i % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: rowY - 3,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.97, 0.97, 0.97),
      })
    }

    colX = margin + 5

    if (i < data.materialMovements.length) {
      const mov = data.materialMovements[i]
      grandTotalCost += mov.totalCost

      // N
      page.drawText(String(i + 1).padStart(2, '0'), { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
      colX += colWidths.num

      // Nom du materiel
      const matName = safeText(mov.material.name).substring(0, 35)
      page.drawText(matName, { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
      colX += colWidths.name

      // Quantite
      page.drawText(`${mov.quantity} ${safeText(mov.material.unit)}`, { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textBlack })
      colX += colWidths.qty

      // Prix unitaire
      page.drawText(formatCurrency(mov.unitPrice), { x: colX, y: rowY + 2, size: 7, font: helvetica, color: textBlack })
      colX += colWidths.unitPrice

      // Prix total
      page.drawText(formatCurrency(mov.totalCost), { x: colX, y: rowY + 2, size: 7, font: helveticaBold, color: textBlack })
      colX += colWidths.totalPrice

      // Observation
      if (mov.notes) {
        page.drawText(safeText(mov.notes).substring(0, 20), { x: colX, y: rowY + 2, size: 7, font: helvetica, color: textGray })
      }
    } else {
      // Empty row with row number
      page.drawText(String(i + 1).padStart(2, '0'), { x: colX, y: rowY + 2, size: 8, font: helvetica, color: textGray })
    }

    // Row bottom border
    page.drawLine({
      start: { x: margin, y: rowY - 3 },
      end: { x: margin + tableWidth, y: rowY - 3 },
      thickness: 0.5,
      color: lineGray,
    })

    rowY -= rowHeight
  }

  // TOTAL GENERAL row
  rowY += rowHeight // Go back up to after last row
  rowY -= rowHeight
  page.drawRectangle({
    x: margin,
    y: rowY - 3,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0.95, 0.95, 0.95),
  })

  page.drawText('TOTAL GENERAL', {
    x: margin + colWidths.num + 5,
    y: rowY + 2,
    size: 9,
    font: helveticaBold,
    color: tableHeaderRed,
  })

  if (grandTotalCost > 0) {
    const totalX = margin + colWidths.num + colWidths.name + colWidths.qty + colWidths.unitPrice
    page.drawText(formatCurrency(grandTotalCost), {
      x: totalX,
      y: rowY + 2,
      size: 8,
      font: helveticaBold,
      color: textBlack,
    })
  }

  // Row bottom border for total
  page.drawLine({
    start: { x: margin, y: rowY - 3 },
    end: { x: margin + tableWidth, y: rowY - 3 },
    thickness: 0.5,
    color: lineGray,
  })

  // Table outer border
  const tableEndY = rowY - 3
  page.drawRectangle({
    x: margin,
    y: tableEndY,
    width: tableWidth,
    height: tableStartY - tableEndY + 2,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  // Column vertical lines
  let vLineX = margin + colWidths.num
  for (const w of [colWidths.name, colWidths.qty, colWidths.unitPrice, colWidths.totalPrice]) {
    page.drawLine({
      start: { x: vLineX, y: tableStartY + 2 },
      end: { x: vLineX, y: tableEndY },
      thickness: 0.5,
      color: lineGray,
    })
    vLineX += w
  }
  // Last vertical line before observation
  page.drawLine({
    start: { x: vLineX, y: tableStartY + 2 },
    end: { x: vLineX, y: tableEndY },
    thickness: 0.5,
    color: lineGray,
  })

  // =============================================
  // DATES DE CONFECTION
  // =============================================
  yPos = tableEndY - 20

  // Find oldest material movement date
  const oldestMovement = data.materialMovements.length > 0
    ? data.materialMovements.reduce((oldest, mov) =>
        new Date(mov.createdAt) < new Date(oldest.createdAt) ? mov : oldest
      )
    : null

  // Arrow icon (small triangle)
  const arrowChar = '>'

  page.drawText(arrowChar, { x: margin, y: yPos, size: 9, font: helveticaBold, color: brandOrange })
  page.drawText('Date et heure de la remise du materiel au couturier pour confection', {
    x: margin + 12,
    y: yPos,
    size: 9,
    font: helveticaBold,
    color: textBlack,
  })

  yPos -= 16
  page.drawText('Jour :', { x: margin + 10, y: yPos, size: 9, font: helvetica, color: textBlack })
  if (oldestMovement) {
    page.drawText(formatDateTime(oldestMovement.createdAt), {
      x: margin + 45,
      y: yPos,
      size: 9,
      font: helveticaBold,
      color: textBlack,
    })
  } else {
    page.drawText('....../....../..........   a  ..........', {
      x: margin + 45,
      y: yPos,
      size: 9,
      font: helvetica,
      color: lineGray,
    })
  }

  yPos -= 20
  page.drawText(arrowChar, { x: margin, y: yPos, size: 9, font: helveticaBold, color: brandOrange })
  page.drawText("Date et heure de la fin de la confection et depot de l'article par le couturier a l'assistante", {
    x: margin + 12,
    y: yPos,
    size: 9,
    font: helveticaBold,
    color: textBlack,
  })

  yPos -= 16
  page.drawText('Jour :', { x: margin + 10, y: yPos, size: 9, font: helvetica, color: textBlack })
  page.drawText('....../....../..........   a  ..........', {
    x: margin + 45,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lineGray,
  })

  // =============================================
  // CONTROLE QUALITE
  // =============================================
  yPos -= 25

  const cqTitle = 'Controle qualite'
  page.drawText(cqTitle, {
    x: (width - helveticaOblique.widthOfTextAtSize(cqTitle, 11)) / 2,
    y: yPos,
    size: 11,
    font: helveticaOblique,
    color: textBlack,
  })

  yPos -= 20

  // TENUE REUSSIE
  page.drawText('TENUE REUSSIE :', { x: margin, y: yPos, size: 10, font: helveticaBold, color: textBlack })

  // OUI checkbox
  const checkboxSize = 12
  const ouiX = margin + 120
  page.drawRectangle({
    x: ouiX,
    y: yPos - 2,
    width: checkboxSize,
    height: checkboxSize,
    borderColor: textBlack,
    borderWidth: 1,
  })
  page.drawText('OUI', { x: ouiX + checkboxSize + 5, y: yPos, size: 10, font: helvetica, color: textBlack })

  // NON checkbox
  const nonX = width - margin - 80
  page.drawRectangle({
    x: nonX,
    y: yPos - 2,
    width: checkboxSize,
    height: checkboxSize,
    borderColor: textBlack,
    borderWidth: 1,
  })
  page.drawText('NON', { x: nonX + checkboxSize + 5, y: yPos, size: 10, font: helvetica, color: textBlack })

  yPos -= 25

  // FINITIONS
  page.drawText('FINITIONS:', { x: margin, y: yPos, size: 10, font: helveticaBold, color: textBlack })

  const finOptionsX = margin + 85
  // PARFAITES
  page.drawRectangle({
    x: finOptionsX,
    y: yPos - 2,
    width: checkboxSize,
    height: checkboxSize,
    borderColor: textBlack,
    borderWidth: 1,
  })
  page.drawText('PARFAITES', { x: finOptionsX + checkboxSize + 5, y: yPos, size: 9, font: helvetica, color: textBlack })

  // ACCEPTABLES
  const accX = finOptionsX + 110
  page.drawRectangle({
    x: accX,
    y: yPos - 2,
    width: checkboxSize,
    height: checkboxSize,
    borderColor: textBlack,
    borderWidth: 1,
  })
  page.drawText('ACCEPTABLES', { x: accX + checkboxSize + 5, y: yPos, size: 9, font: helvetica, color: textBlack })

  // A CORRIGER
  const corX = accX + 120
  page.drawRectangle({
    x: corX,
    y: yPos - 2,
    width: checkboxSize,
    height: checkboxSize,
    borderColor: textBlack,
    borderWidth: 1,
  })
  page.drawText('A CORRIGER', { x: corX + checkboxSize + 5, y: yPos, size: 9, font: helvetica, color: textBlack })

  // =============================================
  // COMMENTAIRES OU OBSERVATIONS
  // =============================================
  yPos -= 30

  const commTitle = 'Commentaires ou observations'
  page.drawText(commTitle, {
    x: (width - helveticaOblique.widthOfTextAtSize(commTitle, 11)) / 2,
    y: yPos,
    size: 11,
    font: helveticaOblique,
    color: textBlack,
  })

  yPos -= 18

  // 3 dotted lines for comments (pre-filled with notes if available)
  const noteLines = data.notes ? wrapText(data.notes, 90) : []
  for (let i = 0; i < 3; i++) {
    if (i < noteLines.length) {
      page.drawText(noteLines[i], {
        x: margin,
        y: yPos,
        size: 8,
        font: helvetica,
        color: textBlack,
      })
    }
    // Dotted line
    page.drawLine({
      start: { x: margin, y: yPos - 5 },
      end: { x: width - margin, y: yPos - 5 },
      thickness: 0.5,
      color: lineGray,
      dashArray: [2, 2],
    })
    yPos -= 18
  }

  // =============================================
  // VISAS
  // =============================================
  yPos -= 10

  // VISA ASSISTANTE (left)
  page.drawLine({
    start: { x: margin, y: yPos + 5 },
    end: { x: margin + 180, y: yPos + 5 },
    thickness: 1,
    color: textBlack,
  })
  page.drawText('VISA ASSISTANTE', {
    x: margin,
    y: yPos - 8,
    size: 10,
    font: helveticaBold,
    color: textBlack,
  })

  // VISA COUTURIER (right)
  const visaCoutX = width - margin - 180
  page.drawLine({
    start: { x: visaCoutX, y: yPos + 5 },
    end: { x: width - margin, y: yPos + 5 },
    thickness: 1,
    color: textBlack,
  })
  page.drawText('VISA COUTURIER', {
    x: visaCoutX + 30,
    y: yPos - 8,
    size: 10,
    font: helveticaBold,
    color: textBlack,
  })

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

  const footerText = 'Cechemoi, Societe au capital de 1.000.000 F CFA, sise a Abidjan-Cocody Riviera Palmeraie. Rue L194'
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 6)
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: footerY + 12,
    size: 6,
    font: helvetica,
    color: textGray,
  })

  const footerText2 = 'Contacts : (+225) 0759545410 / 0767188230 / 2731940681 - Email : cechemoicreations@gmail.com - Web : www.cechemoi.com'
  const footerWidth2 = helvetica.widthOfTextAtSize(footerText2, 6)
  page.drawText(footerText2, {
    x: (width - footerWidth2) / 2,
    y: footerY + 3,
    size: 6,
    font: helvetica,
    color: textGray,
  })

  // Created by
  if (data.createdBy) {
    const staffText = `Fiche creee par: ${safeText(data.createdBy.name)}`
    page.drawText(staffText, {
      x: margin,
      y: footerY - 6,
      size: 6,
      font: helvetica,
      color: textGray,
    })
  }

  // Generation date
  const genDateText = `Genere le: ${formatDate(new Date())}`
  page.drawText(genDateText, {
    x: width - margin - helvetica.widthOfTextAtSize(genDateText, 6),
    y: footerY - 6,
    size: 6,
    font: helvetica,
    color: textGray,
  })

  return await pdfDoc.save()
}
