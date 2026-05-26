import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { fetchReport } from '@/lib/exports/queries'
import { buildWorkbook } from '@/lib/exports/excel'
import { buildFinancialReportPdf } from '@/lib/exports/pdf-report'
import { FinancialFamily } from '@/lib/exports/types'
import { formatDateFR } from '@/lib/exports/formatters'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel-compat, ne nuit pas sinon

const ALLOWED: FinancialFamily[] = [
  'online-sales',
  'custom-orders',
  'invoices',
  'transactions',
  'refunds',
  'expenses',
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const family = body.family as FinancialFamily
    const format = (body.format || 'xlsx') as 'xlsx' | 'pdf'

    if (!ALLOWED.includes(family)) {
      return NextResponse.json({ error: 'Famille inconnue' }, { status: 400 })
    }
    if (!['xlsx', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })
    }

    const data = await fetchReport(family, {
      period: body.period || 'month',
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      paymentMethod: body.paymentMethod,
      source: body.source,
      type: body.type,
      exportMode: true,
    })

    const baseFilename = `rapport-${family}-${formatDateFR(data.period.start).replaceAll('/', '-')}-au-${formatDateFR(data.period.end).replaceAll('/', '-')}`

    if (format === 'xlsx') {
      const buf = buildWorkbook({
        title: data.title,
        period: data.period,
        summary: data.summary,
        columns: data.columns,
        rows: data.rows,
      })
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${baseFilename}.xlsx"`,
          'Content-Length': String(buf.byteLength),
        },
      })
    }

    // PDF
    const pdfBuf = await buildFinancialReportPdf({
      title: data.title,
      period: data.period,
      summary: data.summary,
      columns: data.columns,
      rows: data.rows,
    })
    return new NextResponse(new Uint8Array(pdfBuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseFilename}.pdf"`,
        'Content-Length': String(pdfBuf.byteLength),
      },
    })
  } catch (error: any) {
    console.error('Export financial report error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
