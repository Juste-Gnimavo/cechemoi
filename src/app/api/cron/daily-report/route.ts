import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

/**
 * Cron Job: Daily Sales Report
 * Run daily at 8 PM to send daily report to admin
 *
 * Setup with Vercel Cron or external cron service:
 * Schedule: 0 20 * * * (8 PM daily)
 * curl https://yourapp.com/api/cron/daily-report?secret=YOUR_SECRET_KEY
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('[Cron] Sending daily sales report...')

    // Send daily sales report (notification service calculates stats)
    await notificationService.sendDailySalesReport()

    return NextResponse.json({
      success: true,
      message: 'Daily sales report sent successfully',
    })
  } catch (error) {
    console.error('[Cron] Daily report error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du rapport quotidien' },
      { status: 500 }
    )
  }
}
