import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// DELETE /api/admin/tags/[name] - Delete a tag from all products
export async function DELETE(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const tagName = decodeURIComponent(params.name)

    if (!tagName) {
      return NextResponse.json({ error: 'Nom du tag requis' }, { status: 400 })
    }

    // Find all products with this tag
    const productsWithTag = await prisma.product.findMany({
      where: {
        tags: {
          has: tagName,
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

    // Remove the tag from each product
    const updatePromises = productsWithTag.map(product => {
      const newTags = product.tags.filter(tag => tag !== tagName)
      return prisma.product.update({
        where: { id: product.id },
        data: { tags: newTags },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Tag supprimé de ${productsWithTag.length} produit(s)`,
      updatedCount: productsWithTag.length,
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du tag' },
      { status: 500 }
    )
  }
}
