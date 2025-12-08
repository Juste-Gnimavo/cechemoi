import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

// GET /api/exchange-rate - Get exchange rate or convert amount
// Query params:
//   - amount: number to convert (optional)
//   - from: 'XOF' or 'EUR' (default: 'XOF')
// Examples:
//   /api/exchange-rate                    → returns rate info
//   /api/exchange-rate?amount=7800        → converts 7800 XOF to EUR
//   /api/exchange-rate?amount=7800&from=XOF → converts 7800 XOF to EUR
//   /api/exchange-rate?amount=10&from=EUR   → converts 10 EUR to XOF
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const amountParam = searchParams.get('amount')
    const from = (searchParams.get('from') || 'XOF').toUpperCase()

    // Get settings
    const settings = await prisma.settings.findFirst({
      select: {
        eurToXofRate: true,
        currency: true,
        currencySymbol: true,
      },
    })

    // Default rate if no settings exist
    const rate = settings?.eurToXofRate ?? 680

    // If amount is provided, do conversion
    if (amountParam) {
      const amount = parseFloat(amountParam)

      if (isNaN(amount)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid amount',
        }, { status: 400 })
      }

      let result: number
      let to: string

      if (from === 'XOF') {
        // Convert XOF to EUR
        result = Math.round((amount / rate) * 100) / 100 // Round to 2 decimals
        to = 'EUR'
      } else if (from === 'EUR') {
        // Convert EUR to XOF
        result = Math.round(amount * rate)
        to = 'XOF'
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid currency. Use XOF or EUR',
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        amount,
        from,
        to,
        result,
        rate,
      })
    }

    // No amount - return rate info
    return NextResponse.json({
      success: true,
      data: {
        eurToXofRate: rate,
        from: 'EUR',
        to: 'XOF',
        currency: settings?.currency ?? 'XOF',
        currencySymbol: settings?.currencySymbol ?? 'CFA',
        example: {
          eur: 1,
          xof: rate,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du taux de change',
      },
      { status: 500 }
    )
  }
}
