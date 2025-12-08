import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if item exists in wishlist
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: params.productId,
        },
      },
    })

    if (!wishlistItem) {
      return NextResponse.json({ error: 'Article non trouvé dans la wishlist' }, { status: 404 })
    }

    // Delete the wishlist item
    await prisma.wishlistItem.delete({
      where: {
        id: wishlistItem.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
