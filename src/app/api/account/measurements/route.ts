import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/account/measurements - Get customer's own measurements (read-only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get all measurements for this customer (ordered by date, most recent first)
    const measurements = await prisma.customerMeasurement.findMany({
      where: { customerId: userId },
      orderBy: { measurementDate: 'desc' },
      select: {
        id: true,
        measurementDate: true,
        unit: true,
        takenByStaffName: true,

        // Upper body
        dos: true,
        carrureDevant: true,
        carrureDerriere: true,
        epaule: true,
        epauleManche: true,
        poitrine: true,
        tourDeTaille: true,
        longueurDetaille: true,
        bassin: true,

        // Arms
        longueurManches: true,
        tourDeManche: true,
        poignets: true,

        // Torso
        pinces: true,
        longueurTotale: true,
        longueurRobes: true,
        longueurTunique: true,
        ceinture: true,

        // Lower body
        longueurPantalon: true,
        frappe: true,
        cuisse: true,
        genoux: true,
        longueurJupe: true,

        // Notes
        autresMesures: true,

        createdAt: true,
      },
    })

    // Get the latest measurement as "current"
    const currentMeasurement = measurements[0] || null

    return NextResponse.json({
      success: true,
      currentMeasurement,
      measurementHistory: measurements,
      totalMeasurements: measurements.length,
    })
  } catch (error) {
    console.error('Error fetching customer measurements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des mensurations' },
      { status: 500 }
    )
  }
}
