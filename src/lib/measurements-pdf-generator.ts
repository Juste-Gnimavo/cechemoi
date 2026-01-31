import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, degrees } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

// Types
interface CustomerMeasurement {
  id: string
  measurementDate: Date
  unit: string
  takenByStaffName?: string | null

  // All measurements are strings to allow flexible input like "87-2" or "50 - 45"
  // Upper body (1-9)
  dos?: string | null
  carrureDevant?: string | null
  carrureDerriere?: string | null
  epaule?: string | null
  epauleManche?: string | null
  poitrine?: string | null
  tourDeTaille?: string | null
  longueurDetaille?: string | null
  bassin?: string | null

  // Arms (10-12)
  // 10. LONGUEUR DES MANCHES - 4 sub-fields (standalone)
  longueurManchesCourtes?: string | null
  longueurManchesAvantCoudes?: string | null
  longueurManchesNiveau34?: string | null
  longueurManchesLongues?: string | null
  tourDeManche?: string | null
  poignets?: string | null

  // Torso (13-17)
  pinces?: string | null
  longueurTotale?: string | null
  // 15. LONGUEUR DES ROBES - 6 sub-fields (standalone)
  longueurRobesAvantGenoux?: string | null
  longueurRobesNiveauGenoux?: string | null
  longueurRobesApresGenoux?: string | null
  longueurRobesMiMollets?: string | null
  longueurRobesChevilles?: string | null
  longueurRobesTresLongue?: string | null
  longueurTunique?: string | null
  ceinture?: string | null

  // Lower body (18-22)
  longueurPantalon?: string | null
  frappe?: string | null
  cuisse?: string | null
  genoux?: string | null
  // 22. LONGUEUR JUPE - 6 sub-fields (standalone)
  longueurJupeAvantGenoux?: string | null
  longueurJupeNiveauGenoux?: string | null
  longueurJupeApresGenoux?: string | null
  longueurJupeMiMollets?: string | null
  longueurJupeChevilles?: string | null
  longueurJupeTresLongue?: string | null

  // Notes
  autresMesures?: string | null
}

interface Customer {
  id: string
  name?: string | null
  phone: string
  email?: string | null
  whatsappNumber?: string | null
  dateOfBirth?: Date | null
  howDidYouHearAboutUs?: string | null
  image?: string | null
}

// Sanitize text for PDF - replace special Unicode characters
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
      // Replace common French characters
      const replacements: Record<string, string> = {
        '\u00e9': 'e', // e acute
        '\u00e8': 'e', // e grave
        '\u00ea': 'e', // e circumflex
        '\u00eb': 'e', // e diaeresis
        '\u00e0': 'a', // a grave
        '\u00e2': 'a', // a circumflex
        '\u00ee': 'i', // i circumflex
        '\u00ef': 'i', // i diaeresis
        '\u00f4': 'o', // o circumflex
        '\u00f6': 'o', // o diaeresis
        '\u00f9': 'u', // u grave
        '\u00fb': 'u', // u circumflex
        '\u00e7': 'c', // c cedilla
        '\u00c9': 'E', // E acute
        '\u00c8': 'E', // E grave
        '\u00c0': 'A', // A grave
        '\u00c7': 'C', // C cedilla
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

function formatMeasurement(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === '') return ''

  // If it's a number, format with unit
  if (typeof value === 'number') {
    return `${value} ${unit}`
  }

  // If it's a string, return as-is (already formatted or a simple value)
  if (typeof value === 'string') {
    // Check if value already has a unit
    if (value.match(/\d+(\.\d+)?\s*(cm|inches)?$/i)) {
      return value.includes('cm') || value.includes('inches') ? value : `${value} ${unit}`
    }
    return value
  }

  return String(value)
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

// Draw info line with underline (like the original form)
function drawInfoLineWithUnderline(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  margin: number,
  width: number,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  textColor: ReturnType<typeof rgb>,
  lineColor: ReturnType<typeof rgb>
) {
  const labelText = `${label}:`
  page.drawText(labelText, {
    x: margin,
    y,
    size: 9,
    font: fontBold,
    color: textColor,
  })

  const labelWidth = fontBold.widthOfTextAtSize(labelText, 9)
  const lineStartX = margin + labelWidth + 5
  const lineEndX = width - margin

  // Value text
  if (value) {
    page.drawText(safeText(value), {
      x: lineStartX + 5,
      y,
      size: 9,
      font: fontRegular,
      color: textColor,
    })
  }

  // Underline
  page.drawLine({
    start: { x: lineStartX, y: y - 3 },
    end: { x: lineEndX, y: y - 3 },
    thickness: 0.5,
    color: lineColor,
  })
}

// Main PDF generation function
export async function generateMeasurementsPDF(
  customer: Customer,
  measurement: CustomerMeasurement
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const margin = 40

  // Colors - Brand colors matching the original form
  const brandOrange = rgb(0.9, 0.32, 0) // Orange/red like in the logo
  const tableHeaderRed = rgb(0.8, 0.15, 0.15) // Deep red for table header
  const textBlack = rgb(0.1, 0.1, 0.1)
  const textGray = rgb(0.4, 0.4, 0.4)
  const lineGray = rgb(0.7, 0.7, 0.7)
  const tableBorderColor = rgb(0.3, 0.3, 0.3)

  const topMargin = 25 // Reduced top margin
  let yPos = height - topMargin

  // =============================================
  // WATERMARK - CECHEMOI in transparent green
  // =============================================
  const watermarkText = 'CECHEMOI'
  const watermarkSize = 80
  const watermarkColor = rgb(0.85, 0.95, 0.85) // Very light green (transparent effect)

  // Draw watermark diagonally across the page
  page.drawText(watermarkText, {
    x: width / 2 - 150,
    y: height / 2 - 20,
    size: watermarkSize,
    font: helveticaBold,
    color: watermarkColor,
    rotate: degrees(45),
  })

  // =============================================
  // TITLE - FICHE D'IDENTIFICATION CLIENT
  // =============================================
  const titleText = "FICHE D'IDENTIFICATION CLIENT"
  const titleFontSize = 14
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, titleFontSize)
  const titleBoxWidth = titleWidth + 30
  const titleBoxHeight = 22
  const titleBoxX = (width - titleBoxWidth) / 2
  const titleBoxY = height - topMargin - titleBoxHeight

  // Title box with border
  page.drawRectangle({
    x: titleBoxX,
    y: titleBoxY,
    width: titleBoxWidth,
    height: titleBoxHeight,
    borderColor: brandOrange,
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  })

  // Title text centered
  page.drawText(titleText, {
    x: titleBoxX + 15,
    y: titleBoxY + 6,
    size: titleFontSize,
    font: helveticaBold,
    color: brandOrange,
  })

  // =============================================
  // LOGO (left) and CUSTOMER PHOTO (right)
  // =============================================
  const headerY = height - topMargin - titleBoxHeight - 8
  const logoSize = 45 // Logo size
  const photoSize = 55 // Customer photo size
  const photoBoxSize = photoSize + 4 // With border

  // Draw logo
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
    // Fallback: Draw text logo if image fails
    page.drawText('CECHEMOI', {
      x: margin,
      y: headerY - 20,
      size: 14,
      font: helveticaBold,
      color: brandOrange,
    })
  }

  // Customer photo placeholder/frame on the right
  const photoX = width - margin - photoBoxSize
  const photoY = headerY - photoBoxSize

  // Photo border/frame
  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoBoxSize,
    height: photoBoxSize,
    borderColor: tableBorderColor,
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  })

  // Try to embed customer photo if available
  if (customer.image) {
    try {
      // For S3 URLs, we need to fetch the image
      const imageUrl = customer.image
      if (imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        const imageBytes = new Uint8Array(arrayBuffer)

        let embeddedImage
        if (imageUrl.toLowerCase().includes('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes)
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes)
        }

        page.drawImage(embeddedImage, {
          x: photoX + 3,
          y: photoY + 3,
          width: photoSize,
          height: photoSize,
        })
      } else if (imageUrl.startsWith('/')) {
        // Local file
        const localPath = path.join(process.cwd(), 'public', imageUrl)
        const imageBytes = fs.readFileSync(localPath)

        let embeddedImage
        if (imageUrl.toLowerCase().includes('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes)
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes)
        }

        page.drawImage(embeddedImage, {
          x: photoX + 3,
          y: photoY + 3,
          width: photoSize,
          height: photoSize,
        })
      }
    } catch (imgError) {
      // If image loading fails, show placeholder text
      page.drawText('PHOTO', {
        x: photoX + 18,
        y: photoY + photoBoxSize / 2,
        size: 10,
        font: helvetica,
        color: textGray,
      })
    }
  } else {
    // No image - show placeholder
    page.drawText('PHOTO', {
      x: photoX + 18,
      y: photoY + photoBoxSize / 2,
      size: 10,
      font: helvetica,
      color: textGray,
    })
  }

  // =============================================
  // HEADER - Customer Info with underlines
  // =============================================
  yPos = headerY - photoBoxSize - 8

  const lineHeight = 14 // Reduced line height

  drawInfoLineWithUnderline(
    page, 'DATE', formatDate(measurement.measurementDate),
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight

  drawInfoLineWithUnderline(
    page, 'NOM ET PRENOMS DU CLIENT', customer.name || '',
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight

  drawInfoLineWithUnderline(
    page, "DATE D'ANNIVERSAIRE", customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '',
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight

  drawInfoLineWithUnderline(
    page, 'EMAIL', customer.email || '',
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight

  drawInfoLineWithUnderline(
    page, 'CONTACT(S)', customer.phone || '',
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight

  drawInfoLineWithUnderline(
    page, 'NUMERO WHATSAPP', customer.whatsappNumber || customer.phone || '',
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight

  drawInfoLineWithUnderline(
    page, 'PAR QUEL MOYEN AVEZ-VOUS CONNU CECHEMOI', customer.howDidYouHearAboutUs || '',
    yPos, margin, width, helveticaBold, helvetica, textBlack, lineGray
  )
  yPos -= lineHeight + 5

  // =============================================
  // MEASUREMENTS TABLE
  // =============================================
  const tableStartY = yPos
  const tableWidth = width - margin * 2
  const colNumWidth = 30
  const colLabelWidth = 200

  // Table Header - Red background like original
  page.drawRectangle({
    x: margin,
    y: tableStartY - 18,
    width: tableWidth,
    height: 20,
    color: tableHeaderRed,
  })

  // Header text
  page.drawText('N', {
    x: margin + 8,
    y: tableStartY - 13,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('PARTIES CONCERNEES', {
    x: margin + colNumWidth + 10,
    y: tableStartY - 13,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('MESURES', {
    x: margin + colNumWidth + colLabelWidth + 40,
    y: tableStartY - 13,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  // Vertical lines in header
  page.drawLine({
    start: { x: margin + colNumWidth, y: tableStartY + 2 },
    end: { x: margin + colNumWidth, y: tableStartY - 18 },
    thickness: 1,
    color: rgb(1, 1, 1),
  })

  page.drawLine({
    start: { x: margin + colNumWidth + colLabelWidth, y: tableStartY + 2 },
    end: { x: margin + colNumWidth + colLabelWidth, y: tableStartY - 18 },
    thickness: 1,
    color: rgb(1, 1, 1),
  })

  // Measurement rows - with expanded rows for length fields
  const standardMeasurements = [
    { num: 1, label: 'DOS', value: measurement.dos },
    { num: 2, label: 'CARRURE DEVANT', value: measurement.carrureDevant },
    { num: 3, label: 'CARRURE DERRIERE', value: measurement.carrureDerriere },
    { num: 4, label: 'EPAULE', value: measurement.epaule },
    { num: 5, label: 'EPAULE MANCHE', value: measurement.epauleManche },
    { num: 6, label: 'POITRINE', value: measurement.poitrine },
    { num: 7, label: 'TOUR DE TAILLE', value: measurement.tourDeTaille },
    { num: 8, label: 'LONGUEUR DETAILLE', value: measurement.longueurDetaille },
    { num: 9, label: 'BASSIN', value: measurement.bassin },
  ]

  const postManchesRows = [
    { num: 11, label: 'TOUR DE MANCHE', value: measurement.tourDeManche },
    { num: 12, label: 'POIGNETS', value: measurement.poignets },
    { num: 13, label: 'PINCES', value: measurement.pinces },
    { num: 14, label: 'LONGUEUR TOTALE', value: measurement.longueurTotale },
  ]

  const postRobesRows = [
    { num: 16, label: 'LONGUEUR TUNIQUE', value: measurement.longueurTunique },
    { num: 17, label: 'CEINTURE', value: measurement.ceinture },
    { num: 18, label: 'LONGUEUR PANTALON', value: measurement.longueurPantalon },
    { num: 19, label: 'FRAPPE', value: measurement.frappe },
    { num: 20, label: 'CUISSE', value: measurement.cuisse },
    { num: 21, label: 'GENOUX', value: measurement.genoux },
  ]

  const rowHeight = 16 // Reduced row height
  let rowY = tableStartY - 35

  // Helper function to draw a standard row
  const drawStandardRow = (m: { num: number; label: string; value: number | string | null | undefined }) => {
    // Row background (alternating)
    if (m.num % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: rowY - 3,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.97, 0.97, 0.97),
      })
    }

    // Row number
    page.drawText(m.num.toString(), {
      x: margin + 10,
      y: rowY + 2,
      size: 8,
      font: helvetica,
      color: textBlack,
    })

    // Vertical line after number
    page.drawLine({
      start: { x: margin + colNumWidth, y: rowY + 13 },
      end: { x: margin + colNumWidth, y: rowY - 3 },
      thickness: 0.5,
      color: tableBorderColor,
    })

    // Label
    page.drawText(m.label, {
      x: margin + colNumWidth + 8,
      y: rowY + 2,
      size: 8,
      font: helvetica,
      color: textBlack,
    })

    // Vertical line after label
    page.drawLine({
      start: { x: margin + colNumWidth + colLabelWidth, y: rowY + 13 },
      end: { x: margin + colNumWidth + colLabelWidth, y: rowY - 3 },
      thickness: 0.5,
      color: tableBorderColor,
    })

    // Value
    const valueText = formatMeasurement(m.value, measurement.unit || 'cm')
    page.drawText(valueText, {
      x: margin + colNumWidth + colLabelWidth + 8,
      y: rowY + 2,
      size: 8,
      font: helveticaBold,
      color: textBlack,
    })

    // Row bottom border
    page.drawLine({
      start: { x: margin, y: rowY - 3 },
      end: { x: margin + tableWidth, y: rowY - 3 },
      thickness: 0.5,
      color: tableBorderColor,
    })

    rowY -= rowHeight
  }

  // Helper to draw expanded row with sub-options (standalone fields)
  const drawExpandedRow = (
    num: number,
    label: string,
    subValues: Array<[string, string | null | undefined]>, // [label, value] pairs
    numLines: number
  ) => {
    const expandedHeight = numLines * 10 + 10 // Reduced height

    // Row background
    if (num % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: rowY - expandedHeight + 10,
        width: tableWidth,
        height: expandedHeight,
        color: rgb(0.97, 0.97, 0.97),
      })
    }

    // Row number (centered vertically)
    page.drawText(num.toString(), {
      x: margin + 10,
      y: rowY - (expandedHeight / 2) + 10,
      size: 8,
      font: helvetica,
      color: textBlack,
    })

    // Vertical line after number
    page.drawLine({
      start: { x: margin + colNumWidth, y: rowY + 10 },
      end: { x: margin + colNumWidth, y: rowY - expandedHeight + 10 },
      thickness: 0.5,
      color: tableBorderColor,
    })

    // Label (centered vertically)
    page.drawText(label, {
      x: margin + colNumWidth + 8,
      y: rowY - (expandedHeight / 2) + 10,
      size: 8,
      font: helvetica,
      color: textBlack,
    })

    // Vertical line after label
    page.drawLine({
      start: { x: margin + colNumWidth + colLabelWidth, y: rowY + 10 },
      end: { x: margin + colNumWidth + colLabelWidth, y: rowY - expandedHeight + 10 },
      thickness: 0.5,
      color: tableBorderColor,
    })

    // Draw sub-options in two columns
    const valueColStart = margin + colNumWidth + colLabelWidth + 6
    const valueColWidth = (tableWidth - colNumWidth - colLabelWidth) / 2
    let subRowY = rowY + 1

    for (let i = 0; i < subValues.length; i += 2) {
      // Left column
      const [leftLabel, leftVal] = subValues[i]
      page.drawText(`${leftLabel}: ${leftVal ?? ''}`, {
        x: valueColStart,
        y: subRowY,
        size: 7,
        font: helvetica,
        color: textBlack,
      })

      // Right column (if exists)
      if (i + 1 < subValues.length) {
        const [rightLabel, rightVal] = subValues[i + 1]
        page.drawText(`${rightLabel}: ${rightVal ?? ''}`, {
          x: valueColStart + valueColWidth,
          y: subRowY,
          size: 7,
          font: helvetica,
          color: textBlack,
        })
      }

      subRowY -= 9
    }

    // Row bottom border
    page.drawLine({
      start: { x: margin, y: rowY - expandedHeight + 10 },
      end: { x: margin + tableWidth, y: rowY - expandedHeight + 10 },
      thickness: 0.5,
      color: tableBorderColor,
    })

    rowY -= expandedHeight
  }

  // Draw rows 1-9
  for (const m of standardMeasurements) {
    drawStandardRow(m)
  }

  // Row 10: LONGUEUR DES MANCHES (expanded - standalone fields)
  drawExpandedRow(
    10,
    'LONGUEUR DES MANCHES',
    [
      ['Manches courtes', measurement.longueurManchesCourtes],
      ['Niveau 3/4', measurement.longueurManchesNiveau34],
      ['Avant les coudes', measurement.longueurManchesAvantCoudes],
      ['Manches longues', measurement.longueurManchesLongues],
    ],
    2
  )

  // Draw rows 11-14
  for (const m of postManchesRows) {
    drawStandardRow(m)
  }

  // Row 15: LONGUEUR DES ROBES (expanded - standalone fields)
  drawExpandedRow(
    15,
    'LONGUEUR DES ROBES',
    [
      ['Avant les genoux', measurement.longueurRobesAvantGenoux],
      ['Mi-mollets', measurement.longueurRobesMiMollets],
      ['Au niveau des genoux', measurement.longueurRobesNiveauGenoux],
      ['Niveau des chevilles', measurement.longueurRobesChevilles],
      ['Apres les genoux (crayon)', measurement.longueurRobesApresGenoux],
      ['Tres longue', measurement.longueurRobesTresLongue],
    ],
    3
  )

  // Draw rows 16-21
  for (const m of postRobesRows) {
    drawStandardRow(m)
  }

  // Row 22: LONGUEUR JUPE (expanded - standalone fields)
  drawExpandedRow(
    22,
    'LONGUEUR JUPE',
    [
      ['Avant les genoux', measurement.longueurJupeAvantGenoux],
      ['Mi-mollets', measurement.longueurJupeMiMollets],
      ['Au niveau des genoux', measurement.longueurJupeNiveauGenoux],
      ['Niveau des chevilles', measurement.longueurJupeChevilles],
      ['Apres les genoux (crayon)', measurement.longueurJupeApresGenoux],
      ['Tres longue', measurement.longueurJupeTresLongue],
    ],
    3
  )

  // Table outer border
  const tableHeight = tableStartY - rowY + 3
  page.drawRectangle({
    x: margin,
    y: rowY - 5,
    width: tableWidth,
    height: tableHeight,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  // =============================================
  // NOTES SECTION
  // =============================================
  yPos = rowY - 15

  page.drawText('AUTRES MESURES OU OBSERVATIONS:', {
    x: margin,
    y: yPos,
    size: 9,
    font: helveticaBold,
    color: textBlack,
  })

  yPos -= 10

  // Notes box - reduced height
  page.drawRectangle({
    x: margin,
    y: yPos - 35,
    width: tableWidth,
    height: 40,
    borderColor: tableBorderColor,
    borderWidth: 1,
  })

  // Notes text
  if (measurement.autresMesures) {
    const noteLines = wrapText(measurement.autresMesures, 90)
    let noteY = yPos - 10
    for (const line of noteLines.slice(0, 3)) {
      page.drawText(line, {
        x: margin + 8,
        y: noteY,
        size: 8,
        font: helvetica,
        color: textBlack,
      })
      noteY -= 10
    }
  }

  // =============================================
  // FOOTER - Compact
  // =============================================
  const footerY = 20

  // Divider line
  page.drawLine({
    start: { x: margin, y: footerY + 22 },
    end: { x: width - margin, y: footerY + 22 },
    thickness: 0.5,
    color: brandOrange,
  })

  // Company info - single line
  const footerText = '01 BP 4790 Abidjan 01 - COCODY, Riviera Palmeraie - Tel: (+225) 0759545410 / 0767188230 - www.cechemoi.com'
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 7)

  page.drawText(sanitizeForPdf(footerText), {
    x: (width - footerWidth) / 2,
    y: footerY + 10,
    size: 7,
    font: helvetica,
    color: textGray,
  })

  // Staff info (who took measurements) - on same line as footer
  if (measurement.takenByStaffName) {
    const staffText = `Mesures prises par: ${measurement.takenByStaffName}`
    page.drawText(sanitizeForPdf(staffText), {
      x: margin,
      y: footerY,
      size: 6,
      font: helvetica,
      color: textGray,
    })
  }

  return await pdfDoc.save()
}
