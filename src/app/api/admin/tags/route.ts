import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/tags - Get all unique tags with product counts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Fetch all products with tags
    const products = await prisma.product.findMany({
      select: {
        id: true,
        tags: true,
      },
    })

    // Aggregate tags
    const tagMap = new Map<string, { name: string; count: number; productIds: string[] }>()

    products.forEach(product => {
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach(tag => {
          if (tagMap.has(tag)) {
            const existing = tagMap.get(tag)!
            existing.count++
            existing.productIds.push(product.id)
          } else {
            tagMap.set(tag, {
              name: tag,
              count: 1,
              productIds: [product.id],
            })
          }
        })
      }
    })

    // Convert to array and sort by count (descending)
    const tags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count)

    // Calculate stats
    const totalTags = tags.length
    const totalProducts = products.length
    const productsWithTags = products.filter(p => p.tags && p.tags.length > 0).length
    const avgTagsPerProduct = productsWithTags > 0
      ? (tags.reduce((sum, tag) => sum + tag.count, 0) / productsWithTags).toFixed(2)
      : '0'
    const mostUsedTag = tags.length > 0 ? tags[0].name : null

    return NextResponse.json({
      success: true,
      tags,
      stats: {
        totalTags,
        totalProducts,
        productsWithTags,
        avgTagsPerProduct,
        mostUsedTag,
      },
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tags' },
      { status: 500 }
    )
  }
}
