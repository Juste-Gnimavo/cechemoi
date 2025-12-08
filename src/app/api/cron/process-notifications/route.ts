/**
 * Cron Job: Process Scheduled Notifications
 *
 * This endpoint should be called periodically (e.g., every 5 minutes)
 * by an external cron service (Vercel Cron, GitHub Actions, etc.)
 *
 * POST /api/cron/process-notifications
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized access attempt to process-notifications')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting scheduled notification processing...')

    // Process all due scheduled notifications
    await notificationService.processScheduledNotifications()

    console.log('[Cron] Scheduled notification processing completed')

    return NextResponse.json({
      success: true,
      message: 'Scheduled notifications processed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Error processing scheduled notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing and Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request)
}
