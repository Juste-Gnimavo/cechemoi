import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/customers/export - Export all customers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv' // csv or json

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsappNumber: true,
        email: true,
        city: true,
        country: true,
        howDidYouHearAboutUs: true,
        createdAt: true,
        createdByStaffName: true,
        _count: {
          select: {
            orders: true,
            customerCustomOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        customers,
        total: customers.length,
      })
    }

    // CSV format
    const headers = [
      'Nom',
      'Telephone',
      'WhatsApp',
      'Email',
      'Ville',
      'Pays',
      'Source',
      'Commandes Boutique',
      'Commandes Sur-Mesure',
      'Date Creation',
      'Cree Par',
    ]

    const rows = customers.map((c) => [
      c.name || '',
      c.phone || '',
      c.whatsappNumber || '',
      c.email || '',
      c.city || '',
      c.country || '',
      c.howDidYouHearAboutUs || '',
      c._count.orders.toString(),
      c._count.customerCustomOrders.toString(),
      new Date(c.createdAt).toLocaleDateString('fr-FR'),
      c.createdByStaffName || '',
    ])

    // Build CSV content
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')),
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clients-cechemoi-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting customers:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
