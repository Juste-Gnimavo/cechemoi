import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/coupons/validate - Validate coupon code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { code, cartItems = [] } = body

    if (!code || code.trim() === '') {
      return NextResponse.json({ error: 'Code de coupon requis' }, { status: 400 })
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          where: {
            userId: (session.user as any).id,
          },
        },
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Code de coupon invalide' }, { status: 404 })
    }

    // Validation checks
    const now = new Date()
    const validationErrors: string[] = []

    // Check if active
    if (!coupon.active) {
      validationErrors.push('Ce coupon n\'est plus actif')
    }

    // Check start date
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      validationErrors.push('Ce coupon n\'est pas encore disponible')
    }

    // Check expiry date
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      validationErrors.push('Ce coupon a expiré')
    }

    // Check total usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      validationErrors.push('Ce coupon a atteint sa limite d\'utilisation')
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser && coupon.usages.length >= coupon.usageLimitPerUser) {
      validationErrors.push('Vous avez atteint la limite d\'utilisation de ce coupon')
    }

    // Check cart restrictions if cart items provided
    if (cartItems.length > 0) {
      // Fetch cart items with product details
      const productIds = cartItems.map((item: any) => item.productId)
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          categoryId: true,
        },
      })

      const productMap = new Map(products.map((p) => [p.id, p]))

      // Check if any products match allowed/excluded criteria
      let hasAllowedProduct = false
      let hasExcludedProduct = false

      for (const item of cartItems) {
        const product = productMap.get(item.productId)
        if (!product) continue

        // Check excluded products
        if (coupon.excludedProducts.includes(item.productId)) {
          hasExcludedProduct = true
          break
        }

        // Check excluded categories
        if (coupon.excludedCategories.includes(product.categoryId)) {
          hasExcludedProduct = true
          break
        }

        // Check allowed products (if specified)
        if (coupon.allowedProducts.length > 0) {
          if (coupon.allowedProducts.includes(item.productId)) {
            hasAllowedProduct = true
          }
        }

        // Check allowed categories (if specified)
        if (coupon.allowedCategories.length > 0) {
          if (coupon.allowedCategories.includes(product.categoryId)) {
            hasAllowedProduct = true
          }
        }
      }

      if (hasExcludedProduct) {
        validationErrors.push('Certains produits du panier ne sont pas éligibles pour ce coupon')
      }

      if (
        (coupon.allowedProducts.length > 0 || coupon.allowedCategories.length > 0) &&
        !hasAllowedProduct
      ) {
        validationErrors.push('Aucun produit du panier n\'est éligible pour ce coupon')
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ valid: false, errors: validationErrors }, { status: 400 })
    }

    // Coupon is valid
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscount: coupon.maximumDiscount,
      },
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation du coupon' },
      { status: 500 }
    )
  }
}
