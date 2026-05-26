import * as XLSX from 'xlsx'
import { formatXOF, formatDateFR, formatDateTimeFR } from './formatters'

export interface ExcelColumn {
  key: string
  label: string
  width?: number
  type?: 'string' | 'number' | 'currency' | 'date' | 'datetime'
}

export interface ExcelSummaryEntry {
  label: string
  value: string | number
}

export interface ExcelSummaryGroup {
  title: string
  entries: ExcelSummaryEntry[]
}

export interface BuildWorkbookInput {
  title: string
  period: { start: Date; end: Date; label: string }
  summary: ExcelSummaryGroup[]
  columns: ExcelColumn[]
  rows: Record<string, unknown>[]
}

function formatCell(value: unknown, type?: ExcelColumn['type']): string | number {
  if (value == null || value === '') return ''
  switch (type) {
    case 'currency':
      return formatXOF(Number(value))
    case 'date':
      return formatDateFR(value as Date | string)
    case 'datetime':
      return formatDateTimeFR(value as Date | string)
    case 'number':
      return Number(value)
    default:
      return String(value)
  }
}

export function buildWorkbook(input: BuildWorkbookInput): Buffer {
  const wb = XLSX.utils.book_new()

  // Feuille Résumé
  const summaryRows: (string | number)[][] = []
  summaryRows.push([input.title])
  summaryRows.push([`Période : ${input.period.label}`])
  summaryRows.push([`Généré le : ${formatDateTimeFR(new Date())}`])
  summaryRows.push([])

  for (const group of input.summary) {
    summaryRows.push([group.title])
    for (const entry of group.entries) {
      summaryRows.push([entry.label, entry.value])
    }
    summaryRows.push([])
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé')

  // Feuille Détail
  const detailHeader = input.columns.map((c) => c.label)
  const detailBody = input.rows.map((row) =>
    input.columns.map((c) => formatCell(row[c.key], c.type))
  )
  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeader, ...detailBody])
  wsDetail['!cols'] = input.columns.map((c) => ({ wch: c.width ?? 18 }))
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Détail')

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return out as Buffer
}
