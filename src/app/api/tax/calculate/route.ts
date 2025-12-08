import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/tax/calculate - Calculate tax for an order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subtotal, shippingCost, country, userId } = body

    // Validate required fields
    if (subtotal === undefined || subtotal === null) {
      return NextResponse.json(
        { error: 'Sous-total requis' },
        { status: 400 }
      )
    }

    // Check if user has tax exemption
    if (userId) {
      const exemption = await prisma.taxExemption.findFirst({
        where: {
          userId,
          enabled: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } },
          ],
        },
      })

      if (exemption) {
        return NextResponse.json({
          success: true,
          taxAmount: 0,
          taxRate: 0,
          exempt: true,
          exemptionReason: exemption.reason,
        })
      }
    }

    // Get settings to check if tax calculation is enabled
    const settings = await prisma.settings.findFirst()

    if (!settings || !settings.calculateTax) {
      return NextResponse.json({
        success: true,
        taxAmount: 0,
        taxRate: 0,
        taxDisabled: true,
      })
    }

    // Find applicable tax rate
    let applicableTaxRate = null

    if (country) {
      // Try to find a tax rate for the specific country
      applicableTaxRate = await prisma.taxRate.findFirst({
        where: {
          country,
          enabled: true,
        },
        orderBy: {
          priority: 'asc',
        },
      })
    }

    // If no country-specific rate, use default rate
    if (!applicableTaxRate) {
      applicableTaxRate = await prisma.taxRate.findFirst({
        where: {
          isDefault: true,
          enabled: true,
        },
      })
    }

    // If still no rate, use settings default
    const taxRate = applicableTaxRate?.rate ?? settings.taxRate

    // Calculate tax on subtotal
    let taxableAmount = subtotal

    // Add shipping to taxable amount if applicable
    if (applicableTaxRate?.applyToShipping && shippingCost) {
      taxableAmount += shippingCost
    }

    const taxAmount = (taxableAmount * taxRate) / 100

    return NextResponse.json({
      success: true,
      taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimals
      taxRate,
      taxName: applicableTaxRate?.name || 'TVA',
      country: applicableTaxRate?.country || 'Défaut',
      applyToShipping: applicableTaxRate?.applyToShipping ?? false,
    })
  } catch (error) {
    console.error('Error calculating tax:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul de la taxe' },
      { status: 500 }
    )
  }
}

// GET /api/tax/calculate - Get tax info for a country
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country')

    // Get settings
    const settings = await prisma.settings.findFirst()

    if (!settings || !settings.calculateTax) {
      return NextResponse.json({
        success: true,
        enabled: false,
        rate: 0,
      })
    }

    // Find applicable tax rate
    let applicableTaxRate = null

    if (country) {
      applicableTaxRate = await prisma.taxRate.findFirst({
        where: {
          country,
          enabled: true,
        },
        orderBy: {
          priority: 'asc',
        },
      })
    }

    // If no country-specific rate, use default
    if (!applicableTaxRate) {
      applicableTaxRate = await prisma.taxRate.findFirst({
        where: {
          isDefault: true,
          enabled: true,
        },
      })
    }

    const rate = applicableTaxRate?.rate ?? settings.taxRate

    return NextResponse.json({
      success: true,
      enabled: true,
      rate,
      name: applicableTaxRate?.name || 'TVA',
      applyToShipping: applicableTaxRate?.applyToShipping ?? false,
      pricesIncludeTax: settings.pricesIncludeTax,
    })
  } catch (error) {
    console.error('Error getting tax info:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations de taxe' },
      { status: 500 }
    )
  }
}
