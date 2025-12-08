import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/mobile-jwt'
import { pushNotificationService } from '@/lib/push-notification-service'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/mobile/devices
 * Register a device token for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { deviceToken, platform, deviceModel, osVersion, appVersion } = body

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'deviceToken est requis' },
        { status: 400 }
      )
    }

    if (!platform || !['IOS', 'ANDROID', 'WEB'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'platform doit être IOS, ANDROID, ou WEB' },
        { status: 400 }
      )
    }

    // Register the device
    await pushNotificationService.registerDevice(
      user.id,
      deviceToken,
      platform,
      { deviceModel, osVersion, appVersion }
    )

    return NextResponse.json({
      success: true,
      message: 'Appareil enregistré pour les notifications push',
    })
  } catch (error: any) {
    console.error('[API] Error registering device:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enregistrement de l\'appareil' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/mobile/devices
 * Unregister a device token
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const deviceToken = searchParams.get('token')

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'token est requis' },
        { status: 400 }
      )
    }

    await pushNotificationService.unregisterDevice(deviceToken)

    return NextResponse.json({
      success: true,
      message: 'Appareil désinscrit des notifications push',
    })
  } catch (error: any) {
    console.error('[API] Error unregistering device:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désinscription de l\'appareil' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/mobile/devices
 * Get user's registered devices
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    const devices = await pushNotificationService.getUserDevices(user.id)

    return NextResponse.json({
      success: true,
      devices: devices.map(d => ({
        id: d.id,
        platform: d.platform,
        deviceModel: d.deviceModel,
        osVersion: d.osVersion,
        appVersion: d.appVersion,
        lastUsedAt: d.lastUsedAt,
        createdAt: d.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('[API] Error getting devices:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des appareils' },
      { status: 500 }
    )
  }
}
