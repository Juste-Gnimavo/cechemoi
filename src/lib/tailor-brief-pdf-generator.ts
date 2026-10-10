import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'
import {
  PRIORITY_LABEL_FR,
  assertNoMonetaryKeys,
  formatBriefDate,
  type TailorBrief,
} from '@/lib/tailor-brief'

/**
 * PDF « Fiche couturier ». Ne reçoit que l'objet `TailorBrief` (aucun montant,
 * voir src/lib/tailor-brief.ts). Volontairement distinct de la fiche de suivi
 * confection, qui contient les prix des matières.
 */

const MAX_IMAGES = 6

// Les polices standard de pdf-lib encodent en WinAnsi : les accents français
// passent, pas les émojis ni les espaces fines.
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

function pdfSafe(text: string | null | undefined): string {
  if (!text) return ''
  let out = ''
  for (const ch of text.replace(/[  ]/g, ' ').replace(/\r/g, '')) {
    const code = ch.codePointAt(0)!
    if (ch === '\n' || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) out += ch
    else if (WIN_ANSI_EXTRA.has(ch)) out += ch
  }
  return out
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of pdfSafe(text).split('\n')) {
    let current = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate
      else {
        if (current) lines.push(current)
        current = word
      }
    }
    lines.push(current)
  }
  return lines
}

async function loadImage(pdfDoc: PDFDocument, url: string): Promise<PDFImage | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const input = Buffer.from(await res.arrayBuffer())
    // Normalise tout format (webp, heic converti, png lourd…) en JPEG raisonnable.
    const jpeg = await sharp(input)
      .rotate()
      .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toBuffer()
    return await pdfDoc.embedJpg(jpeg)
  } catch (error) {
    console.error('Fiche couturier : image non intégrée', url, error)
    return null
  }
}

export async function generateTailorBriefPDF(brief: TailorBrief): Promise<Uint8Array> {
  assertNoMonetaryKeys(brief)

  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`Fiche couturier ${brief.orderNumber}`)
  pdfDoc.setAuthor('CÈCHÉMOI')

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const PAGE: [number, number] = [595.28, 841.89] // A4
  const margin = 40
  const contentWidth = PAGE[0] - margin * 2

  const brandOrange = rgb(0.9, 0.32, 0)
  const textBlack = rgb(0.1, 0.1, 0.1)
  const textGray = rgb(0.4, 0.4, 0.4)
  const rowFill = rgb(0.97, 0.97, 0.97)

  let page: PDFPage = pdfDoc.addPage(PAGE)
  let y = PAGE[1] - margin

  const ensure = (needed: number) => {
    if (y - needed < margin + 20) {
      page = pdfDoc.addPage(PAGE)
      y = PAGE[1] - margin
    }
  }

  const text = (
    value: string,
    x: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page.drawText(pdfSafe(value), {
      x,
      y,
      size: opts.size ?? 10,
      font: opts.font ?? regular,
      color: opts.color ?? textBlack,
    })
  }

  const paragraph = (value: string, opts: { font?: PDFFont; size?: number; indent?: number } = {}) => {
    const size = opts.size ?? 10
    const indent = opts.indent ?? 0
    for (const line of wrap(value, opts.font ?? regular, size, contentWidth - indent)) {
      ensure(size + 4)
      text(line, margin + indent, { font: opts.font, size })
      y -= size + 4
    }
  }

  // `keepWith` : hauteur du premier bloc qui suit, pour ne pas laisser un titre seul en bas de page.
  const sectionTitle = (title: string, keepWith = 20) => {
    ensure(40 + keepWith)
    y -= 10
    text(title.toUpperCase(), margin, { font: bold, size: 11, color: brandOrange })
    y -= 6
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 1,
      color: brandOrange,
    })
    y -= 16
  }

  // ---------------------------------------------------------------- En-tête
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.png'))
    const logo = await pdfDoc.embedPng(logoBytes)
    page.drawImage(logo, { x: margin, y: y - 44, width: 44, height: 44 })
  } catch {
    text('CÈCHÉMOI', margin, { font: bold, size: 14, color: brandOrange })
  }

  const title = 'FICHE COUTURIER'
  page.drawText(title, {
    x: PAGE[0] - margin - bold.widthOfTextAtSize(title, 18),
    y: y - 18,
    size: 18,
    font: bold,
    color: brandOrange,
  })
  const sub = pdfSafe(`Commande ${brief.orderNumber}`)
  page.drawText(sub, {
    x: PAGE[0] - margin - bold.widthOfTextAtSize(sub, 12),
    y: y - 38,
    size: 12,
    font: bold,
    color: textBlack,
  })
  y -= 66

  // Bloc d'informations, deux colonnes.
  const info: Array<[string, string]> = [
    ['Couturier', brief.tailor.name],
    ['Cliente', brief.customerFirstName],
    ['Commande du', formatBriefDate(brief.orderDate)],
    ['Retrait prévu le', formatBriefDate(brief.pickupDate)],
  ]
  if (brief.customerDeadline) info.push(['Délai souhaité', formatBriefDate(brief.customerDeadline)])
  info.push(['Priorité', PRIORITY_LABEL_FR[brief.priority] ?? brief.priority])

  const colWidth = contentWidth / 2
  for (let i = 0; i < info.length; i += 2) {
    ensure(16)
    for (let c = 0; c < 2 && i + c < info.length; c++) {
      const [label, value] = info[i + c]
      const x = margin + c * colWidth
      text(`${label} :`, x, { size: 9, color: textGray })
      text(value, x + 92, { font: bold, size: 10 })
    }
    y -= 16
  }

  if (brief.note) {
    y -= 6
    const lines = wrap(brief.note, italic, 10, contentWidth - 20)
    const boxHeight = lines.length * 14 + 22
    ensure(boxHeight + 4)
    page.drawRectangle({
      x: margin,
      y: y - boxHeight + 12,
      width: contentWidth,
      height: boxHeight,
      color: rgb(1, 0.96, 0.92),
      borderColor: brandOrange,
      borderWidth: 0.8,
    })
    text("Note de l'atelier", margin + 10, { font: bold, size: 9, color: brandOrange })
    y -= 14
    for (const line of lines) {
      text(line, margin + 10, { font: italic, size: 10 })
      y -= 14
    }
    y -= 6
  }

  // ---------------------------------------------------------------- Articles
  sectionTitle(`Articles à confectionner (${brief.items.length})`)
  brief.items.forEach((item, index) => {
    ensure(30)
    text(`${index + 1}. ${item.label}`, margin, { font: bold, size: 11 })
    const qty = `Quantité : ${item.quantity}`
    page.drawText(qty, {
      x: margin + contentWidth - regular.widthOfTextAtSize(qty, 10),
      y,
      size: 10,
      font: regular,
      color: textBlack,
    })
    y -= 15
    if (item.description) paragraph(item.description, { indent: 14 })
    if (item.notes) paragraph(`Remarque : ${item.notes}`, { indent: 14, font: italic })
    y -= 6
  })

  // ---------------------------------------------------------------- Mesures
  sectionTitle('Mesures')
  if (!brief.measurements || brief.measurements.values.length === 0) {
    paragraph("Aucune mesure n'est rattachée à cette commande. Demandez-les à l'atelier.", {
      font: italic,
    })
  } else {
    const m = brief.measurements
    paragraph(`Prises le ${formatBriefDate(m.takenAt)}, en ${m.unit}.`, { font: italic, size: 9 })
    y -= 4
    const rowHeight = 18
    const half = contentWidth / 2
    for (let i = 0; i < m.values.length; i += 2) {
      ensure(rowHeight)
      if ((i / 2) % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: y - 5,
          width: contentWidth,
          height: rowHeight,
          color: rowFill,
        })
      }
      for (let c = 0; c < 2 && i + c < m.values.length; c++) {
        const { label, value } = m.values[i + c]
        const x = margin + c * half + 6
        text(label, x, { size: 10 })
        const v = pdfSafe(value)
        page.drawText(v, {
          x: margin + (c + 1) * half - 10 - bold.widthOfTextAtSize(v, 11),
          y,
          size: 11,
          font: bold,
          color: textBlack,
        })
      }
      y -= rowHeight
    }
    if (m.observations) {
      y -= 6
      paragraph('Observations :', { font: bold, size: 10 })
      paragraph(m.observations, { indent: 10 })
    }
  }

  // ---------------------------------------------------------------- Matières
  if (brief.materials.length > 0) {
    sectionTitle('Matières remises')
    for (const mat of brief.materials) {
      const qty = mat.quantity.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
      paragraph(`• ${mat.name}${mat.color ? ` (${mat.color})` : ''} : ${qty} ${mat.unit}`)
    }
  }

  // ---------------------------------------------------------------- Modèle
  const images = brief.attachments.filter((a) => a.category === 'image')
  const media = brief.attachments.filter((a) => a.category !== 'image')

  if (images.length > 0) {
    const embedded = (
      await Promise.all(images.slice(0, MAX_IMAGES).map((a) => loadImage(pdfDoc, a.fileUrl)))
    ).filter((img): img is PDFImage => img !== null)

    const gap = 14
    const cellWidth = (contentWidth - gap) / 2
    const cellHeight = 230
    sectionTitle('Photos du modèle', embedded.length > 0 ? cellHeight : 20)
    for (let i = 0; i < embedded.length; i += 2) {
      ensure(cellHeight + gap)
      for (let c = 0; c < 2 && i + c < embedded.length; c++) {
        const img = embedded[i + c]
        const scale = Math.min(cellWidth / img.width, cellHeight / img.height)
        const w = img.width * scale
        const h = img.height * scale
        page.drawImage(img, {
          x: margin + c * (cellWidth + gap) + (cellWidth - w) / 2,
          y: y - h,
          width: w,
          height: h,
        })
      }
      y -= cellHeight + gap
    }
    const missing = images.length - embedded.length
    if (missing > 0) {
      paragraph(
        `${missing} photo${missing > 1 ? 's' : ''} non intégrée${missing > 1 ? 's' : ''} : demandez-la${missing > 1 ? 's' : ''} à l'atelier.`,
        { font: italic, size: 9 }
      )
    }
  }

  if (media.length > 0) {
    sectionTitle('Vocaux et vidéos')
    for (const a of media) {
      paragraph(`• ${a.category === 'audio' ? 'Vocal' : 'Vidéo'} : ${a.description || a.name}`, {
        font: bold,
        size: 10,
      })
      paragraph(a.fileUrl, { indent: 12, size: 8 })
    }
  }

  // ---------------------------------------------------------------- Pied de page
  const pages = pdfDoc.getPages()
  pages.forEach((p, i) => {
    const footer = pdfSafe(
      `CÈCHÉMOI — Fiche couturier ${brief.orderNumber} — page ${i + 1}/${pages.length}`
    )
    p.drawText(footer, {
      x: (PAGE[0] - regular.widthOfTextAtSize(footer, 8)) / 2,
      y: 22,
      size: 8,
      font: regular,
      color: textGray,
    })
  })

  return pdfDoc.save()
}
