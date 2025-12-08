import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.consultationType.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching consultation services:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
