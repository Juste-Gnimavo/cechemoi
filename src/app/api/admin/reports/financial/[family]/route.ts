import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { fetchReport } from '@/lib/exports/queries'
import { FinancialFamily } from '@/lib/exports/types'

export const dynamic = 'force-dynamic'

const ALLOWED: FinancialFamily[] = [
  'online-sales',
  'custom-orders',
  'invoices',
  'transactions',
  'refunds',
  'expenses',
  'clients',
]

export async function GET(
  req: NextRequest,
  { params }: { params: { family: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const family = params.family as FinancialFamily
    if (!ALLOWED.includes(family)) {
      return NextResponse.json({ error: 'Famille inconnue' }, { status: 400 })
    }

    const sp = req.nextUrl.searchParams
    const data = await fetchReport(family, {
      period: sp.get('period') || 'month',
      startDate: sp.get('startDate') || undefined,
      endDate: sp.get('endDate') || undefined,
      status: sp.get('status') || undefined,
      paymentStatus: sp.get('paymentStatus') || undefined,
      paymentMethod: sp.get('paymentMethod') || undefined,
      source: sp.get('source') || undefined,
      type: sp.get('type') || undefined,
      dateBasis: sp.get('dateBasis') || undefined,
      segment: sp.get('segment') || undefined,
      page: sp.get('page') ? parseInt(sp.get('page')!, 10) : undefined,
      pageSize: sp.get('pageSize') ? parseInt(sp.get('pageSize')!, 10) : undefined,
      exportMode: false,
    })

    return NextResponse.json({
      success: true,
      family: data.family,
      title: data.title,
      period: {
        type: data.period.type,
        start: data.period.start.toISOString(),
        end: data.period.end.toISOString(),
        label: data.period.label,
      },
      summary: data.summary,
      columns: data.columns,
      rows: data.rows,
      pagination: data.pagination,
    })
  } catch (error) {
    console.error('Financial report error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
