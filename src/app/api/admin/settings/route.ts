import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/settings - Get all settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default-settings',
        },
      })
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()

    // Get or create settings
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default-settings',
        },
      })
    }

    // Generate API key if enableAPI is true and no key exists
    let apiKey = body.apiKey
    if (body.enableAPI && !apiKey) {
      apiKey = crypto.randomBytes(32).toString('hex')
    }

    // Update settings
    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        // General
        ...(body.siteName && { siteName: body.siteName }),
        ...(body.siteDescription !== undefined && { siteDescription: body.siteDescription }),
        ...(body.siteUrl !== undefined && { siteUrl: body.siteUrl }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.zipCode !== undefined && { zipCode: body.zipCode }),
        ...(body.country !== undefined && { country: body.country }),

        // Currency
        ...(body.currency && { currency: body.currency }),
        ...(body.currencySymbol && { currencySymbol: body.currencySymbol }),
        ...(body.currencyPosition && { currencyPosition: body.currencyPosition }),
        ...(body.thousandSeparator !== undefined && { thousandSeparator: body.thousandSeparator }),
        ...(body.decimalSeparator !== undefined && { decimalSeparator: body.decimalSeparator }),
        ...(body.decimals !== undefined && { decimals: body.decimals }),
        ...(body.taxRate !== undefined && { taxRate: body.taxRate }),
        ...(body.pricesIncludeTax !== undefined && { pricesIncludeTax: body.pricesIncludeTax }),
        ...(body.calculateTax !== undefined && { calculateTax: body.calculateTax }),
        ...(body.eurToXofRate !== undefined && { eurToXofRate: body.eurToXofRate }),

        // Shipping
        ...(body.freeShippingThreshold !== undefined && { freeShippingThreshold: body.freeShippingThreshold }),
        ...(body.flatShippingRate !== undefined && { flatShippingRate: body.flatShippingRate }),
        ...(body.shippingCalculation && { shippingCalculation: body.shippingCalculation }),

        // Product Settings
        ...(body.shopPageDisplay && { shopPageDisplay: body.shopPageDisplay }),
        ...(body.productsPerPage !== undefined && { productsPerPage: body.productsPerPage }),
        ...(body.defaultSorting && { defaultSorting: body.defaultSorting }),
        ...(body.stockDisplayFormat && { stockDisplayFormat: body.stockDisplayFormat }),
        ...(body.lowStockThreshold !== undefined && { lowStockThreshold: body.lowStockThreshold }),
        ...(body.outOfStockVisibility !== undefined && { outOfStockVisibility: body.outOfStockVisibility }),
        ...(body.enableReviews !== undefined && { enableReviews: body.enableReviews }),
        ...(body.reviewsRequirePurchase !== undefined && { reviewsRequirePurchase: body.reviewsRequirePurchase }),

        // Cart & Checkout
        ...(body.enableGuestCheckout !== undefined && { enableGuestCheckout: body.enableGuestCheckout }),
        ...(body.cartPageEnabled !== undefined && { cartPageEnabled: body.cartPageEnabled }),
        ...(body.enableCoupons !== undefined && { enableCoupons: body.enableCoupons }),
        ...(body.calculateShipping !== undefined && { calculateShipping: body.calculateShipping }),
        ...(body.requirePhone !== undefined && { requirePhone: body.requirePhone }),
        ...(body.requireEmail !== undefined && { requireEmail: body.requireEmail }),

        // Account & Privacy
        ...(body.enableRegistration !== undefined && { enableRegistration: body.enableRegistration }),
        ...(body.accountCreation && { accountCreation: body.accountCreation }),
        ...(body.privacyPolicyPage !== undefined && { privacyPolicyPage: body.privacyPolicyPage }),
        ...(body.termsPage !== undefined && { termsPage: body.termsPage }),
        ...(body.enableNewsletterSignup !== undefined && { enableNewsletterSignup: body.enableNewsletterSignup }),

        // Email Settings
        ...(body.emailFromName && { emailFromName: body.emailFromName }),
        ...(body.emailFromAddress !== undefined && { emailFromAddress: body.emailFromAddress }),
        ...(body.enableOrderEmails !== undefined && { enableOrderEmails: body.enableOrderEmails }),
        ...(body.enableWelcomeEmail !== undefined && { enableWelcomeEmail: body.enableWelcomeEmail }),
        ...(body.enableLowStockEmail !== undefined && { enableLowStockEmail: body.enableLowStockEmail }),
        ...(body.lowStockEmailRecipient !== undefined && { lowStockEmailRecipient: body.lowStockEmailRecipient }),

        // Permalinks
        ...(body.productSlugPrefix !== undefined && { productSlugPrefix: body.productSlugPrefix }),
        ...(body.categorySlugPrefix !== undefined && { categorySlugPrefix: body.categorySlugPrefix }),

        // API & Advanced
        ...(body.enableAPI !== undefined && { enableAPI: body.enableAPI }),
        ...(apiKey && { apiKey }),
        ...(body.enableWebhooks !== undefined && { enableWebhooks: body.enableWebhooks }),
        ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl }),

        // Social Media
        ...(body.facebookUrl !== undefined && { facebookUrl: body.facebookUrl }),
        ...(body.instagramUrl !== undefined && { instagramUrl: body.instagramUrl }),
        ...(body.twitterUrl !== undefined && { twitterUrl: body.twitterUrl }),
        ...(body.whatsappNumber !== undefined && { whatsappNumber: body.whatsappNumber }),

        // Maintenance
        ...(body.maintenanceMode !== undefined && { maintenanceMode: body.maintenanceMode }),
        ...(body.maintenanceMessage !== undefined && { maintenanceMessage: body.maintenanceMessage }),
      },
    })

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    )
  }
}
