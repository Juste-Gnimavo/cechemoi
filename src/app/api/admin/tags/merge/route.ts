import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/tags/merge - Merge multiple tags into one
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { sourceTags, targetTag } = body

    if (!sourceTags || !Array.isArray(sourceTags) || sourceTags.length === 0) {
      return NextResponse.json(
        { error: 'sourceTags doit être un tableau non vide' },
        { status: 400 }
      )
    }

    if (!targetTag) {
      return NextResponse.json(
        { error: 'targetTag est requis' },
        { status: 400 }
      )
    }

    // Find all products with any of the source tags
    const productsWithTags = await prisma.product.findMany({
      where: {
        OR: sourceTags.map(tag => ({
          tags: {
            has: tag,
          },
        })),
      },
      select: {
        id: true,
        tags: true,
      },
    })

    if (productsWithTags.length === 0) {
      return NextResponse.json(
        { error: 'Aucun produit avec ces tags' },
        { status: 404 }
      )
    }

    // Update each product: remove source tags, add target tag
    const updatePromises = productsWithTags.map(product => {
      // Remove all source tags
      let newTags = product.tags.filter(tag => !sourceTags.includes(tag))

      // Add target tag if not already present
      if (!newTags.includes(targetTag)) {
        newTags.push(targetTag)
      }

      return prisma.product.update({
        where: { id: product.id },
        data: { tags: newTags },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `${sourceTags.length} tag(s) fusionné(s) en "${targetTag}" dans ${productsWithTags.length} produit(s)`,
      updatedCount: productsWithTags.length,
    })
  } catch (error) {
    console.error('Error merging tags:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la fusion des tags' },
      { status: 500 }
    )
  }
}
