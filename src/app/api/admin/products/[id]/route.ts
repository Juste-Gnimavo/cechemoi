import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'
import { redis } from '@/lib/redis'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/products/[id] - Get product details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        productCategories: {
          include: {
            category: true,
          },
        },
        variations: {
          orderBy: { createdAt: 'asc' },
        },
        attributes: {
          orderBy: { createdAt: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      slug,
      description,
      shortDescription,
      longDescription,
      price,
      salePrice,
      sku,
      stock,
      lowStockThreshold,
      images,
      categoryId,
      categoryIds, // Additional categories (multi-category support)
      published,
      featured,
      isWine, // Product type flag
      // Wine specific
      vintage,
      region,
      country,
      grapeVariety,
      alcoholContent,
      volume,
      wineType,
      // Metadata
      weight,
      dimensions,
      tags,
      metaTitle,
      metaDescription,
      taxClassId,
      relatedProducts,
      upsellProducts,
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      })

      if (skuExists) {
        return NextResponse.json({ error: 'Ce SKU existe déjà' }, { status: 400 })
      }
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 400 })
      }
    }

    // Handle categoryIds update - delete existing and create new
    if (categoryIds !== undefined) {
      await prisma.productCategory.deleteMany({
        where: { productId: params.id },
      })

      if (categoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: categoryIds.map((catId: string) => ({
            productId: params.id,
            categoryId: catId,
          })),
        })
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(longDescription !== undefined && { longDescription }),
        ...(price && { price: parseFloat(price) }),
        ...(salePrice !== undefined && {
          salePrice: salePrice ? parseFloat(salePrice) : null,
        }),
        ...(sku && { sku }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
        ...(images && { images }),
        ...(categoryId && { categoryId }),
        ...(published !== undefined && { published }),
        ...(featured !== undefined && { featured }),
        ...(isWine !== undefined && { isWine }),
        // Wine fields (clear if not a wine product)
        ...(vintage !== undefined && { vintage: isWine === false ? null : vintage }),
        ...(region !== undefined && { region: isWine === false ? null : region }),
        ...(country !== undefined && { country: isWine === false ? null : country }),
        ...(grapeVariety !== undefined && { grapeVariety: isWine === false ? null : grapeVariety }),
        ...(alcoholContent !== undefined && {
          alcoholContent: isWine === false ? null : (alcoholContent ? parseFloat(alcoholContent) : null),
        }),
        ...(volume !== undefined && { volume: isWine === false ? null : volume }),
        ...(wineType !== undefined && { wineType: isWine === false ? null : wineType }),
        // Metadata
        ...(weight !== undefined && {
          weight: weight ? parseFloat(weight) : null,
        }),
        ...(dimensions !== undefined && { dimensions }),
        ...(tags !== undefined && { tags }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(taxClassId !== undefined && { taxClassId: taxClassId || null }),
        ...(relatedProducts !== undefined && { relatedProducts }),
        ...(upsellProducts !== undefined && { upsellProducts }),
      },
      include: {
        category: true,
        productCategories: {
          include: {
            category: true,
          },
        },
        variations: true,
        attributes: true,
      },
    })

    // Check stock levels and send notifications if needed
    if (stock !== undefined) {
      const newStock = parseInt(stock)

      // Out of stock notification
      if (newStock === 0 && existingProduct.stock > 0) {
        notificationService.sendOutOfStockAlert(params.id).catch((error) => {
          console.error('Error sending out of stock notification:', error)
        })
      }
      // Low stock notification
      else if (newStock > 0 && newStock <= product.lowStockThreshold && existingProduct.stock > product.lowStockThreshold) {
        notificationService.sendLowStockAlert(params.id).catch((error) => {
          console.error('Error sending low stock notification:', error)
        })
      }
    }

    // Invalidate product cache
    await redis.invalidateProducts()

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    // Warn if product has orders
    if (product._count.orderItems > 0) {
      return NextResponse.json(
        {
          error: `Ce produit a ${product._count.orderItems} commande(s) associée(s). Considérez de le dépublier au lieu de le supprimer.`,
        },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    // Invalidate product cache
    await redis.invalidateProducts()

    return NextResponse.json({ success: true, message: 'Produit supprimé' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    )
  }
}
