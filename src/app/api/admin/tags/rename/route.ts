import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/tags/rename - Rename a tag globally
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { oldName, newName } = body

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: 'oldName et newName sont requis' },
        { status: 400 }
      )
    }

    if (oldName === newName) {
      return NextResponse.json(
        { error: 'Les noms sont identiques' },
        { status: 400 }
      )
    }

    // Find all products with the old tag
    const productsWithTag = await prisma.product.findMany({
      where: {
        tags: {
          has: oldName,
        },
      },
      select: {
        id: true,
        tags: true,
      },
    })

    if (productsWithTag.length === 0) {
      return NextResponse.json(
        { error: 'Aucun produit avec ce tag' },
        { status: 404 }
      )
    }

    // Update each product
    const updatePromises = productsWithTag.map(product => {
      const newTags = product.tags.map(tag =>
        tag === oldName ? newName : tag
      )
      return prisma.product.update({
        where: { id: product.id },
        data: { tags: newTags },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Tag renommé dans ${productsWithTag.length} produit(s)`,
      updatedCount: productsWithTag.length,
    })
  } catch (error) {
    console.error('Error renaming tag:', error)
    return NextResponse.json(
      { error: 'Erreur lors du renommage du tag' },
      { status: 500 }
    )
  }
}
