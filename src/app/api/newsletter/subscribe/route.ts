import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * Newsletter subscription endpoint
 * No authentication required
 *
 * POST /api/newsletter/subscribe
 *
 * Body:
 *   - email: string (required)
 *   - name: string (optional)
 */

const subscribeSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = subscribeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { email, name } = validation.data

    // For now, we'll store newsletter subscriptions in the User table with metadata
    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update metadata to indicate newsletter subscription
      const metadata = existingUser.metadata as any || {}
      if (metadata.newsletter?.subscribed) {
        return NextResponse.json({
          success: true,
          message: 'Vous êtes déjà abonné à notre newsletter',
          alreadySubscribed: true,
        })
      }

      // Update subscription status
      await prisma.user.update({
        where: { email },
        data: {
          metadata: {
            ...metadata,
            newsletter: {
              subscribed: true,
              subscribedAt: new Date().toISOString(),
              source: 'website',
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Merci! Vous êtes maintenant abonné à notre newsletter',
      })
    }

    // Create new user record for newsletter subscription
    // Generate a unique phone number for newsletter-only users (required by schema)
    const newsletterPhone = `+225NEWSLETTER${Date.now().toString().slice(-8)}`

    await prisma.user.create({
      data: {
        email,
        name: name || '',
        phone: newsletterPhone,
        role: 'CUSTOMER',
        metadata: {
          newsletter: {
            subscribed: true,
            subscribedAt: new Date().toISOString(),
            source: 'website',
          },
          newsletterOnly: true, // Flag to indicate this is newsletter-only user
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Merci! Vous êtes maintenant abonné à notre newsletter',
    })
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cette adresse email est déjà abonnée',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer plus tard.'
      },
      { status: 500 }
    )
  }
}
