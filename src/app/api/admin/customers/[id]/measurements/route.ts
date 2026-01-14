import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// Measurement validation schema
// All measurements are strings to allow flexible input like "87-2" or "50 - 45"
const measurementSchema = z.object({
  measurementDate: z.string().optional(),
  unit: z.enum(['cm', 'inches']).default('cm'),

  // Upper body (1-9)
  dos: z.string().nullable().optional(),
  carrureDevant: z.string().nullable().optional(),
  carrureDerriere: z.string().nullable().optional(),
  epaule: z.string().nullable().optional(),
  epauleManche: z.string().nullable().optional(),
  poitrine: z.string().nullable().optional(),
  tourDeTaille: z.string().nullable().optional(),
  longueurDetaille: z.string().nullable().optional(),
  bassin: z.string().nullable().optional(),

  // Arms (10-12)
  longueurManches: z.string().nullable().optional(),
  tourDeManche: z.string().nullable().optional(),
  poignets: z.string().nullable().optional(),

  // Torso (13-17)
  pinces: z.string().nullable().optional(),
  longueurTotale: z.string().nullable().optional(),
  longueurRobes: z.string().nullable().optional(),
  longueurTunique: z.string().nullable().optional(),
  ceinture: z.string().nullable().optional(),

  // Lower body (18-22)
  longueurPantalon: z.string().nullable().optional(),
  frappe: z.string().nullable().optional(),
  cuisse: z.string().nullable().optional(),
  genoux: z.string().nullable().optional(),
  longueurJupe: z.string().nullable().optional(),

  // Notes
  autresMesures: z.string().nullable().optional(),
})

// GET /api/admin/customers/[id]/measurements - Get all measurements for a customer (history)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        whatsappNumber: true,
        dateOfBirth: true,
        howDidYouHearAboutUs: true,
        createdByStaffId: true,
        createdByStaffName: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Get all measurements (ordered by date, most recent first)
    const measurements = await prisma.customerMeasurement.findMany({
      where: { customerId: params.id },
      orderBy: { measurementDate: 'desc' },
    })

    // Get the latest measurement as "current"
    const currentMeasurement = measurements[0] || null

    return NextResponse.json({
      success: true,
      customer,
      currentMeasurement,
      measurementHistory: measurements,
      totalMeasurements: measurements.length,
    })
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des mensurations' },
      { status: 500 }
    )
  }
}

// POST /api/admin/customers/[id]/measurements - Add new measurement record
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = measurementSchema.parse(body)

    // Create new measurement record (history)
    const measurement = await prisma.customerMeasurement.create({
      data: {
        customerId: params.id,
        measurementDate: validatedData.measurementDate
          ? new Date(validatedData.measurementDate)
          : new Date(),
        unit: validatedData.unit,

        // Staff tracking
        takenByStaffId: (session.user as any).id,
        takenByStaffName: (session.user as any).name || 'Admin',

        // Upper body
        dos: validatedData.dos,
        carrureDevant: validatedData.carrureDevant,
        carrureDerriere: validatedData.carrureDerriere,
        epaule: validatedData.epaule,
        epauleManche: validatedData.epauleManche,
        poitrine: validatedData.poitrine,
        tourDeTaille: validatedData.tourDeTaille,
        longueurDetaille: validatedData.longueurDetaille,
        bassin: validatedData.bassin,

        // Arms
        longueurManches: validatedData.longueurManches,
        tourDeManche: validatedData.tourDeManche,
        poignets: validatedData.poignets,

        // Torso
        pinces: validatedData.pinces,
        longueurTotale: validatedData.longueurTotale,
        longueurRobes: validatedData.longueurRobes,
        longueurTunique: validatedData.longueurTunique,
        ceinture: validatedData.ceinture,

        // Lower body
        longueurPantalon: validatedData.longueurPantalon,
        frappe: validatedData.frappe,
        cuisse: validatedData.cuisse,
        genoux: validatedData.genoux,
        longueurJupe: validatedData.longueurJupe,

        // Notes
        autresMesures: validatedData.autresMesures,
      },
    })

    return NextResponse.json({
      success: true,
      measurement,
      message: 'Mensurations enregistrées avec succès',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement des mensurations' },
      { status: 500 }
    )
  }
}
