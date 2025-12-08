import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr) {
      return NextResponse.json({ error: 'Date requise' }, { status: 400 })
    }

    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()

    // Get admin availability for this day of week
    const availability = await prisma.adminAvailability.findFirst({
      where: {
        dayOfWeek,
        enabled: true
      }
    })

    if (!availability) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: {
          notIn: ['CANCELLED']
        }
      },
      select: {
        time: true
      }
    })

    const bookedTimes = existingAppointments.map(a => a.time)

    // Generate time slots based on availability
    const slots = []
    const [startHour, startMin] = availability.startTime.split(':').map(Number)
    const [endHour, endMin] = availability.endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const slotDuration = availability.slotDuration
    const breakBetween = availability.breakBetween

    for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration + breakBetween) {
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

      slots.push({
        time: timeStr,
        available: !bookedTimes.includes(timeStr)
      })
    }

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
