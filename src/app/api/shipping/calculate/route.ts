import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/shipping/calculate - Calculate shipping cost for an order
export async function POST(req: NextRequest) {
  try {
    // Handle empty body gracefully
    let body
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Corps de la requête vide', success: false, methods: [] },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { error: 'Format JSON invalide', success: false, methods: [] },
        { status: 400 }
      )
    }

    const { country, orderTotal, orderWeight, items } = body

    // Validate required fields
    if (!country) {
      return NextResponse.json(
        { error: 'Pays requis' },
        { status: 400 }
      )
    }

    // Find the shipping zone for this country
    const zone = await prisma.shippingZone.findFirst({
      where: {
        countries: {
          has: country,
        },
        enabled: true,
      },
      include: {
        methods: {
          where: {
            enabled: true,
          },
          orderBy: {
            cost: 'asc', // Sort by cost, cheapest first
          },
        },
      },
    })

    // If no zone found, try to use default zone (Ivory Coast)
    let availableMethods = zone?.methods || []

    if (!zone || availableMethods.length === 0) {
      const defaultZone = await prisma.shippingZone.findFirst({
        where: {
          isDefault: true,
          enabled: true,
        },
        include: {
          methods: {
            where: {
              enabled: true,
            },
            orderBy: {
              cost: 'asc',
            },
          },
        },
      })

      availableMethods = defaultZone?.methods || []
    }

    if (availableMethods.length === 0) {
      return NextResponse.json({
        success: true,
        methods: [],
        message: 'Aucune méthode de livraison disponible pour ce pays',
      })
    }

    // Calculate shipping cost for each method
    const calculatedMethods = availableMethods.map((method) => {
      let shippingCost: number | null = 0
      let isVariable = false

      switch (method.costType) {
        case 'free':
          shippingCost = 0
          break

        case 'variable':
          // Variable shipping (e.g., Yango) - cost determined by delivery service
          shippingCost = null
          isVariable = true
          break

        case 'flat_rate':
          shippingCost = method.cost
          // Check if order qualifies for free shipping
          if (method.minOrderAmount && orderTotal >= method.minOrderAmount) {
            shippingCost = 0
          }
          break

        case 'weight_based':
          if (method.weightRanges && orderWeight) {
            const ranges = method.weightRanges as Array<{
              min: number
              max: number | null
              cost: number
            }>
            const matchingRange = ranges.find(
              (range) =>
                orderWeight >= range.min &&
                (range.max === null || orderWeight <= range.max)
            )
            shippingCost = matchingRange?.cost || method.cost
          } else {
            shippingCost = method.cost
          }
          break

        case 'price_based':
          if (method.priceRanges && orderTotal) {
            const ranges = method.priceRanges as Array<{
              min: number
              max: number | null
              cost: number
            }>
            const matchingRange = ranges.find(
              (range) =>
                orderTotal >= range.min &&
                (range.max === null || orderTotal <= range.max)
            )
            shippingCost = matchingRange?.cost || method.cost
          } else {
            shippingCost = method.cost
          }
          break

        default:
          shippingCost = method.cost
      }

      return {
        id: method.id,
        name: method.name,
        description: method.description,
        cost: shippingCost,
        costType: method.costType,
        isVariable,
        estimatedDays: method.estimatedDays,
        taxable: method.taxable,
      }
    })

    return NextResponse.json({
      success: true,
      methods: calculatedMethods,
      zoneName: zone?.name || 'Zone par défaut',
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des frais de livraison' },
      { status: 500 }
    )
  }
}

// GET /api/shipping/calculate - Get available shipping methods for a country
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country')

    if (!country) {
      return NextResponse.json(
        { error: 'Pays requis' },
        { status: 400 }
      )
    }

    // Find the shipping zone for this country
    const zone = await prisma.shippingZone.findFirst({
      where: {
        countries: {
          has: country,
        },
        enabled: true,
      },
      include: {
        methods: {
          where: {
            enabled: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            costType: true,
            cost: true,
            minOrderAmount: true,
            estimatedDays: true,
            taxable: true,
          },
        },
      },
    })

    // If no zone found, use default zone
    if (!zone) {
      const defaultZone = await prisma.shippingZone.findFirst({
        where: {
          isDefault: true,
          enabled: true,
        },
        include: {
          methods: {
            where: {
              enabled: true,
            },
            select: {
              id: true,
              name: true,
              description: true,
              costType: true,
              cost: true,
              minOrderAmount: true,
              estimatedDays: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        zone: defaultZone,
        isDefault: true,
      })
    }

    return NextResponse.json({
      success: true,
      zone,
      isDefault: false,
    })
  } catch (error) {
    console.error('Error getting shipping methods:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des méthodes de livraison' },
      { status: 500 }
    )
  }
}
