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
const COLOR_ZEBRA = '#fafafa'

const MAX_SUMMARY_ENTRIES_PER_GROUP = 8

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

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)) + '…'
}

export function buildFinancialReportPdf(input: BuildPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 30,
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

      // ============= EN-TÊTE (compact) =============
      doc.fontSize(16).fillColor(COLOR_PRIMARY).font('Helvetica-Bold').text('CÈCHÉMOI', leftX, 22)
      doc
        .fontSize(7.5)
        .fillColor(COLOR_MUTED)
        .font('Helvetica')
        .text("Faya Cité Génie 2000, Abidjan — +225 0759545410", leftX, 40)

      doc
        .fontSize(13)
        .fillColor(COLOR_TEXT)
        .font('Helvetica-Bold')
        .text(input.title, leftX, 22, { align: 'right', width: pageWidth })
      doc
        .fontSize(8)
        .fillColor(COLOR_MUTED)
        .font('Helvetica')
        .text(
          `Période : ${input.period.label}    ·    Émis le ${formatDateTimeFR(new Date())}`,
          leftX,
          40,
          { align: 'right', width: pageWidth }
        )

      let y = 58
      doc
        .moveTo(leftX, y)
        .lineTo(leftX + pageWidth, y)
        .strokeColor(COLOR_BORDER)
        .lineWidth(0.5)
        .stroke()
      y += 8

      // ============= RÉSUMÉ — disposition compacte, 2 colonnes par groupe =============
      // Chaque groupe occupe son propre bloc, label tronqué pour rester sur 1 ligne.
      const groupCount = Math.max(1, input.summary.length)
      const gap = 8
      const groupWidth = (pageWidth - gap * (groupCount - 1)) / groupCount

      const ENTRY_LABEL_PT = 7.5
      const ENTRY_VALUE_PT = 8.5
      const ENTRY_HEIGHT = 12 // px par ligne d'entrée (compact)
      const TITLE_HEIGHT = 12

      let maxBlockHeight = 0
      input.summary.forEach((group, idx) => {
        const visibleEntries = group.entries.slice(0, MAX_SUMMARY_ENTRIES_PER_GROUP)
        const overflow = group.entries.length - visibleEntries.length
        const blockHeight =
          TITLE_HEIGHT + visibleEntries.length * ENTRY_HEIGHT + (overflow > 0 ? ENTRY_HEIGHT : 0)
        if (blockHeight > maxBlockHeight) maxBlockHeight = blockHeight

        const gx = leftX + idx * (groupWidth + gap)
        // Titre du groupe
        doc
          .fontSize(7.5)
          .fillColor(COLOR_PRIMARY)
          .font('Helvetica-Bold')
          .text(truncate(group.title.toUpperCase(), 40), gx, y, {
            width: groupWidth,
            lineBreak: false,
            ellipsis: true,
          })

        let gy = y + TITLE_HEIGHT
        // Largeur de la colonne valeur ~45% (montants à droite)
        const valueColWidth = Math.max(70, Math.round(groupWidth * 0.42))
        const labelColWidth = groupWidth - valueColWidth - 4

        visibleEntries.forEach((entry) => {
          doc
            .fontSize(ENTRY_LABEL_PT)
            .fillColor(COLOR_MUTED)
            .font('Helvetica')
            .text(truncate(entry.label, 38), gx, gy + 1, {
              width: labelColWidth,
              lineBreak: false,
              ellipsis: true,
            })
          doc
            .fontSize(ENTRY_VALUE_PT)
            .fillColor(COLOR_TEXT)
            .font('Helvetica-Bold')
            .text(entry.value, gx + labelColWidth + 4, gy, {
              width: valueColWidth,
              align: 'right',
              lineBreak: false,
              ellipsis: true,
            })
          gy += ENTRY_HEIGHT
        })
        if (overflow > 0) {
          doc
            .fontSize(ENTRY_LABEL_PT)
            .fillColor(COLOR_MUTED)
            .font('Helvetica-Oblique')
            .text(`+ ${overflow} autre${overflow > 1 ? 's' : ''}`, gx, gy + 1, {
              width: groupWidth,
              lineBreak: false,
            })
        }
      })

      y += maxBlockHeight + 6

      doc
        .moveTo(leftX, y)
        .lineTo(leftX + pageWidth, y)
        .strokeColor(COLOR_BORDER)
        .lineWidth(0.5)
        .stroke()
      y += 6

      // ============= TABLEAU DÉTAIL =============
      const totalColWidth = input.columns.reduce((s, c) => s + (c.width ?? 80), 0)
      const scale = pageWidth / totalColWidth
      const scaledCols = input.columns.map((c) => ({ ...c, w: (c.width ?? 80) * scale }))

      // Calcul automatique de la hauteur de ligne : on essaie de tout faire tenir si possible
      const tableTop = y
      const pageBottom = doc.page.height - doc.page.margins.bottom - 20 // marge pour pied
      const availableHeight = pageBottom - tableTop - 18 // 18 = hauteur d'entête tableau
      const totalRows = input.rows.length || 1
      // Hauteur préférée 14 px, on réduit si besoin pour tenir sur une page (entre 11 et 14)
      const rowHeight = Math.max(11, Math.min(14, Math.floor(availableHeight / totalRows)))
      const headerHeight = 16
      const rowFontPt = rowHeight >= 13 ? 7.5 : 7

      const drawTableHeader = (yPos: number): number => {
        doc.rect(leftX, yPos, pageWidth, headerHeight).fillColor(COLOR_HEADER_BG).fill()
        let cx = leftX
        scaledCols.forEach((c) => {
          doc
            .fontSize(7.5)
            .fillColor(COLOR_TEXT)
            .font('Helvetica-Bold')
            .text(c.label, cx + 3, yPos + 4.5, {
              width: c.w - 6,
              align: c.align || 'left',
              lineBreak: false,
              ellipsis: true,
            })
          cx += c.w
        })
        return yPos + headerHeight
      }

      y = drawTableHeader(y)

      if (input.rows.length === 0) {
        doc
          .fontSize(9)
          .fillColor(COLOR_MUTED)
          .font('Helvetica-Oblique')
          .text('Aucune donnée pour la période sélectionnée.', leftX, y + 10, {
            align: 'center',
            width: pageWidth,
          })
      } else {
        input.rows.forEach((row, i) => {
          if (y + rowHeight > pageBottom) {
            doc.addPage()
            y = 30
            y = drawTableHeader(y)
          }
          if (i % 2 === 0) {
            doc.rect(leftX, y, pageWidth, rowHeight).fillColor(COLOR_ZEBRA).fill()
          }
          let cx = leftX
          scaledCols.forEach((c) => {
            const text = formatCell(row[c.key], c.type)
            doc
              .fontSize(rowFontPt)
              .fillColor(COLOR_TEXT)
              .font('Helvetica')
              .text(text, cx + 3, y + (rowHeight - rowFontPt) / 2 - 0.5, {
                width: c.w - 6,
                align: c.align || 'left',
                lineBreak: false,
                ellipsis: true,
              })
            cx += c.w
          })
          doc
            .moveTo(leftX, y + rowHeight)
            .lineTo(leftX + pageWidth, y + rowHeight)
            .strokeColor(COLOR_BORDER)
            .lineWidth(0.2)
            .stroke()
          y += rowHeight
        })
      }

      // ============= PIED DE PAGE =============
      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i)
        const pageY = doc.page.height - 20
        doc
          .fontSize(7)
          .fillColor(COLOR_MUTED)
          .font('Helvetica')
          .text(
            `CÈCHÉMOI · Document généré automatiquement · ${formatDateTimeFR(new Date())}`,
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
