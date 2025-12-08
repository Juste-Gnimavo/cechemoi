import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/inventory/alerts - Get low stock and out of stock alerts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') || 'all' // 'low', 'out', 'all'

    // Get low stock products
    let lowStockProducts: any[] = []
    if (type === 'low' || type === 'all') {
      // Get all products and filter in memory since Prisma doesn't support field comparison
      const allProducts = await prisma.product.findMany({
        where: {
          stock: {
            gt: 0,
          },
          published: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          lowStockThreshold: true,
          price: true,
          images: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          stock: 'asc',
        },
      })

      // Filter products where stock <= lowStockThreshold
      lowStockProducts = allProducts.filter(
        (p) => p.lowStockThreshold && p.stock <= p.lowStockThreshold
      )
    }

    // Get out of stock products
    let outOfStockProducts: any[] = []
    if (type === 'out' || type === 'all') {
      outOfStockProducts = await prisma.product.findMany({
        where: {
          stock: 0,
          published: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          lowStockThreshold: true,
          price: true,
          images: true,
          category: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })
    }

    return NextResponse.json({
      success: true,
      lowStockProducts,
      outOfStockProducts,
      summary: {
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalAlerts: lowStockProducts.length + outOfStockProducts.length,
      },
    })
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des alertes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory/alerts/send - Send low stock alerts to admins
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get all low stock and out of stock products
    const allProducts = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
        published: true,
      },
      select: {
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
      },
    })

    // Filter products where stock <= lowStockThreshold
    const lowStockProducts = allProducts.filter(
      (p) => p.lowStockThreshold && p.stock <= p.lowStockThreshold
    )

    const outOfStockProducts = await prisma.product.findMany({
      where: {
        stock: 0,
        published: true,
      },
      select: {
        name: true,
        sku: true,
      },
    })

    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune alerte à envoyer',
      })
    }

    // Get admin users
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    })

    // Build alert message
    let message = '📊 Rapport d\'Inventaire\n\n'

    if (lowStockProducts.length > 0) {
      message += `⚠️ Stock Faible (${lowStockProducts.length}):\n`
      lowStockProducts.slice(0, 5).forEach((p) => {
        message += `• ${p.name} - ${p.stock}/${p.lowStockThreshold} unités\n`
      })
      if (lowStockProducts.length > 5) {
        message += `... et ${lowStockProducts.length - 5} autres\n`
      }
      message += '\n'
    }

    if (outOfStockProducts.length > 0) {
      message += `❌ Rupture de Stock (${outOfStockProducts.length}):\n`
      outOfStockProducts.slice(0, 5).forEach((p) => {
        message += `• ${p.name}\n`
      })
      if (outOfStockProducts.length > 5) {
        message += `... et ${outOfStockProducts.length - 5} autres\n`
      }
    }

    // Note: Automatic stock alerts are now sent via notification service
    // This endpoint returns alert data for manual review
    return NextResponse.json({
      success: true,
      message: `Alertes d'inventaire`,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 10),
      outOfStockProducts: outOfStockProducts.slice(0, 10),
    })
  } catch (error) {
    console.error('Error sending stock alerts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des alertes' },
      { status: 500 }
    )
  }
}
