import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Validates API key from request headers
 * Checks X-API-Key header against stored API key in settings
 */
export async function validateApiKey(req: NextRequest): Promise<boolean> {
  try {
    // Get API key from header
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key')

    if (!apiKey) {
      return false
    }

    // Get settings from database
    const settings = await prisma.settings.findFirst({
      where: {
        enableAPI: true,
      },
    })

    if (!settings || !settings.apiKey) {
      return false
    }

    // Compare API keys
    return apiKey === settings.apiKey
  } catch (error) {
    console.error('Error validating API key:', error)
    return false
  }
}

/**
 * Gets API key information (for debugging/logging)
 */
export async function getApiKeyInfo(apiKey: string) {
  try {
    const settings = await prisma.settings.findFirst({
      where: {
        apiKey,
        enableAPI: true,
      },
      select: {
        id: true,
        siteName: true,
        enableAPI: true,
      },
    })

    return settings
  } catch (error) {
    console.error('Error getting API key info:', error)
    return null
  }
}
