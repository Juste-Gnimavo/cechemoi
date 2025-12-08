import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/mobile-jwt'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Token requis'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = refreshSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { refreshToken } = validation.data

    // Refresh the tokens
    const result = await refreshAccessToken(refreshToken)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    })
  } catch (error: any) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
