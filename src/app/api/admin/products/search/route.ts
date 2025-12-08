import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/products/search - Search products for selection
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    const excludeId = searchParams.get('excludeId') // Don't show this product in results

    // Search by name or SKU
    const products = await prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
            ],
          },
          ...(excludeId ? [{ id: { not: excludeId } }] : []),
          { published: true }, // Only show published products
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        salePrice: true,
        images: true,
        stock: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche de produits' },
      { status: 500 }
    )
  }
}
