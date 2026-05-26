import PDFDocument from 'pdfkit'
import { formatXOF, formatDateFR, formatDateTimeFR } from './formatters'

export interface PdfColumn {
  key: string
  label: string
  width?: number
  type?: 'string' | 'number' | 'currency' | 'date' | 'datetime'
  align?: 'left' | 'right' | 'center'
}

export interface PdfSummaryEntry {
  label: string
  value: string
}

export interface PdfSummaryGroup {
  title: string
  entries: PdfSummaryEntry[]
}

export interface BuildPdfInput {
  title: string
  period: { start: Date; end: Date; label: string }
  summary: PdfSummaryGroup[]
  columns: PdfColumn[]
  rows: Record<string, unknown>[]
}

const COLOR_PRIMARY = '#ef4444'
const COLOR_TEXT = '#111827'
const COLOR_MUTED = '#6b7280'
const COLOR_BORDER = '#e5e7eb'
const COLOR_HEADER_BG = '#fef2f2'

function formatCell(value: unknown, type?: PdfColumn['type']): string {
  if (value == null || value === '') return '—'
  switch (type) {
    case 'currency':
      return formatXOF(Number(value))
    case 'date':
      return formatDateFR(value as Date | string)
    case 'datetime':
      return formatDateTimeFR(value as Date | string)
    case 'number':
      return new Intl.NumberFormat('fr-FR').format(Number(value))
    default:
      return String(value)
  }
}

export function buildFinancialReportPdf(input: BuildPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
        bufferPages: true,
        info: {
          Title: input.title,
          Author: 'CÈCHÉMOI',
          Subject: `Rapport financier — ${input.period.label}`,
        },
      })

      const buffers: Buffer[] = []
      doc.on('data', (b) => buffers.push(b))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
      const leftX = doc.page.margins.left

      // ============= EN-TÊTE =============
      doc.fontSize(20).fillColor(COLOR_PRIMARY).font('Helvetica-Bold').text('CÈCHÉMOI', leftX, 30)
      doc.fontSize(9).fillColor(COLOR_MUTED).font('Helvetica')
      doc.text('Faya Cité Génie 2000, Abidjan, Côte d\'Ivoire', leftX, 53)
      doc.text('Tél : +225 0759545410   ·   cechemoicreations@gmail.com', leftX, 65)

      doc
        .fontSize(16)
        .fillColor(COLOR_TEXT)
        .font('Helvetica-Bold')
        .text(input.title, leftX, 30, { align: 'right' })
      doc
        .fontSize(10)
        .fillColor(COLOR_MUTED)
        .font('Helvetica')
        .text(`Période : ${input.period.label}`, leftX, 53, { align: 'right' })
      doc.text(`Émis le : ${formatDateTimeFR(new Date())}`, leftX, 65, {
        align: 'right',
      })

      doc
        .moveTo(leftX, 90)
        .lineTo(leftX + pageWidth, 90)
        .strokeColor(COLOR_BORDER)
        .lineWidth(1)
        .stroke()

      // ============= RÉSUMÉ =============
      let y = 105
      doc.fontSize(12).fillColor(COLOR_TEXT).font('Helvetica-Bold').text('Résumé', leftX, y)
      y += 18

      const groupCount = input.summary.length || 1
      const groupWidth = pageWidth / groupCount

      input.summary.forEach((group, idx) => {
        const gx = leftX + idx * groupWidth
        doc
          .fontSize(9)
          .fillColor(COLOR_PRIMARY)
          .font('Helvetica-Bold')
          .text(group.title.toUpperCase(), gx, y, { width: groupWidth - 10 })
        let gy = y + 13
        group.entries.forEach((entry) => {
          doc.fontSize(9).fillColor(COLOR_MUTED).font('Helvetica').text(entry.label, gx, gy, {
            width: groupWidth - 10,
          })
          doc.fontSize(9).fillColor(COLOR_TEXT).font('Helvetica-Bold').text(entry.value, gx, gy + 10, {
            width: groupWidth - 10,
          })
          gy += 26
        })
      })

      const maxRows = Math.max(...input.summary.map((g) => g.entries.length), 0)
      y += 18 + maxRows * 26 + 10

      doc
        .moveTo(leftX, y)
        .lineTo(leftX + pageWidth, y)
        .strokeColor(COLOR_BORDER)
        .lineWidth(1)
        .stroke()
      y += 12

      // ============= TABLEAU DÉTAIL =============
      doc.fontSize(12).fillColor(COLOR_TEXT).font('Helvetica-Bold').text('Détail des opérations', leftX, y)
      y += 18

      const totalColWidth = input.columns.reduce((s, c) => s + (c.width ?? 80), 0)
      const scale = pageWidth / totalColWidth
      const scaledCols = input.columns.map((c) => ({ ...c, w: (c.width ?? 80) * scale }))

      const drawHeader = (yPos: number): number => {
        doc.rect(leftX, yPos, pageWidth, 22).fillColor(COLOR_HEADER_BG).fill()
        let cx = leftX
        scaledCols.forEach((c) => {
          doc
            .fontSize(9)
            .fillColor(COLOR_TEXT)
            .font('Helvetica-Bold')
            .text(c.label, cx + 4, yPos + 7, {
              width: c.w - 8,
              align: c.align || 'left',
              lineBreak: false,
            })
          cx += c.w
        })
        return yPos + 22
      }

      y = drawHeader(y)

      const rowHeight = 18
      const pageBottom = doc.page.height - doc.page.margins.bottom - 30

      input.rows.forEach((row, i) => {
        if (y + rowHeight > pageBottom) {
          doc.addPage()
          y = 40
          y = drawHeader(y)
        }
        // Zebra
        if (i % 2 === 0) {
          doc.rect(leftX, y, pageWidth, rowHeight).fillColor('#fafafa').fill()
        }
        let cx = leftX
        scaledCols.forEach((c) => {
          const text = formatCell(row[c.key], c.type)
          doc.fontSize(8).fillColor(COLOR_TEXT).font('Helvetica').text(text, cx + 4, y + 5, {
            width: c.w - 8,
            align: c.align || 'left',
            lineBreak: false,
            ellipsis: true,
          })
          cx += c.w
        })
        // Bottom border
        doc
          .moveTo(leftX, y + rowHeight)
          .lineTo(leftX + pageWidth, y + rowHeight)
          .strokeColor(COLOR_BORDER)
          .lineWidth(0.3)
          .stroke()
        y += rowHeight
      })

      if (input.rows.length === 0) {
        doc.fontSize(10).fillColor(COLOR_MUTED).font('Helvetica-Oblique').text('Aucune donnée pour la période sélectionnée.', leftX, y + 10, { align: 'center', width: pageWidth })
      }

      // ============= PIED DE PAGE =============
      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i)
        const pageY = doc.page.height - 30
        doc
          .fontSize(8)
          .fillColor(COLOR_MUTED)
          .font('Helvetica')
          .text(
            `CÈCHÉMOI — Document généré automatiquement — ${formatDateTimeFR(new Date())}`,
            leftX,
            pageY,
            { align: 'left' }
          )
        doc.text(`Page ${i + 1} / ${range.count}`, leftX, pageY, {
          align: 'right',
          width: pageWidth,
        })
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
