import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notification-service'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

/**
 * Cron Job: Birthday Greetings
 * Run daily at 8 AM (Abidjan = UTC+0) to send birthday greetings
 *
 * Setup with Vercel Cron or external cron service:
 * Schedule: 0 8 * * * (8 AM daily UTC)
 * curl https://yourapp.com/api/cron/birthday-greetings?secret=YOUR_SECRET_KEY
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('[Cron] Checking for birthdays...')

    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth() // 0-indexed
    const currentDay = now.getUTCDate()

    // Check if current year is a leap year
    const isLeapYear = (year: number) =>
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

    // For Feb 28 in non-leap years, also include Feb 29 birthdays
    const includeFeb29 = currentMonth === 1 && currentDay === 28 && !isLeapYear(currentYear)

    // Get all customers with a dateOfBirth set
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
      },
    })

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const customer of customers) {
      if (!customer.dateOfBirth) continue

      const birthMonth = customer.dateOfBirth.getUTCMonth()
      const birthDay = customer.dateOfBirth.getUTCDate()

      // Check if today is the customer's birthday
      const isBirthday =
        (birthMonth === currentMonth && birthDay === currentDay) ||
        // Special case: Feb 29 birthday on non-leap year → send on Feb 28
        (includeFeb29 && birthMonth === 1 && birthDay === 29)

      if (!isBirthday) continue

      // Check if we already sent a greeting this year (prevent duplicates)
      const existingLog = await prisma.birthdayGreetingLog.findUnique({
        where: {
          userId_year: {
            userId: customer.id,
            year: currentYear,
          },
        },
      })

      if (existingLog) {
        skipped++
        console.log(`[Cron] Skipped ${customer.name} - already sent for ${currentYear}`)
        continue
      }

      // Send birthday greeting
      try {
        const result = await notificationService.sendBirthdayGreeting(customer.id)

        const channels: string[] = []
        if (result.channels?.sms) channels.push('SMS')
        if (result.channels?.whatsapp) channels.push('WHATSAPP')
        if (result.channel) channels.push(result.channel)

        await prisma.birthdayGreetingLog.create({
          data: {
            userId: customer.id,
            year: currentYear,
            status: result.success ? 'sent' : 'failed',
            channels,
          },
        })

        if (result.success) {
          sent++
          console.log(`[Cron] 🎂 Birthday greeting sent to ${customer.name}`)
        } else {
          failed++
          console.log(`[Cron] ❌ Failed to send birthday greeting to ${customer.name}`)
        }
      } catch (error) {
        failed++
        console.error(`[Cron] Error sending birthday greeting to ${customer.name}:`, error)

        // Log the failure
        await prisma.birthdayGreetingLog.create({
          data: {
            userId: customer.id,
            year: currentYear,
            status: 'failed',
            channels: [],
          },
        })
      }
    }

    console.log(`[Cron] Birthday greetings complete: ${sent} sent, ${skipped} skipped, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Birthday greetings processed`,
      stats: { sent, skipped, failed, totalChecked: customers.length },
    })
  } catch (error) {
    console.error('[Cron] Birthday greetings error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des voeux d\'anniversaire' },
      { status: 500 }
    )
  }
}
