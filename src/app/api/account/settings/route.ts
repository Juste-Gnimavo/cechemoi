import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'
import { z } from 'zod'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  whatsappNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  language: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user settings from user metadata or create default
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        metadata: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Default settings
    const defaultSettings = {
      emailNotifications: true,
      smsNotifications: true,
      whatsappNotifications: true,
      marketingEmails: false,
      orderUpdates: true,
      promotions: true,
      language: 'fr',
    }

    const settings = user.metadata
      ? { ...defaultSettings, ...(user.metadata as any).settings }
      : defaultSettings

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const body = await req.json()

    const validation = updateSettingsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const settingsUpdate = validation.data

    // Get current user metadata
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    const currentMetadata = (user?.metadata as any) || {}
    const currentSettings = currentMetadata.settings || {}

    // Merge settings
    const newSettings = {
      ...currentSettings,
      ...settingsUpdate,
    }

    // Update user metadata
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...currentMetadata,
          settings: newSettings,
        },
      },
    })

    return NextResponse.json({ settings: newSettings })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
