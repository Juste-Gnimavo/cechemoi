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

  // 10. LONGUEUR DES MANCHES - 4 sub-fields
  longueurManchesCourtes: z.string().nullable().optional(),
  longueurManchesAvantCoudes: z.string().nullable().optional(),
  longueurManchesNiveau34: z.string().nullable().optional(),
  longueurManchesLongues: z.string().nullable().optional(),

  // Arms continued (11-12)
  tourDeManche: z.string().nullable().optional(),
  poignets: z.string().nullable().optional(),

  // Torso (13-14)
  pinces: z.string().nullable().optional(),
  longueurTotale: z.string().nullable().optional(),

  // 15. LONGUEUR DES ROBES - 6 sub-fields
  longueurRobesAvantGenoux: z.string().nullable().optional(),
  longueurRobesNiveauGenoux: z.string().nullable().optional(),
  longueurRobesApresGenoux: z.string().nullable().optional(),
  longueurRobesMiMollets: z.string().nullable().optional(),
  longueurRobesChevilles: z.string().nullable().optional(),
  longueurRobesTresLongue: z.string().nullable().optional(),

  // Torso continued (16-17)
  longueurTunique: z.string().nullable().optional(),
  ceinture: z.string().nullable().optional(),

  // Lower body (18-21)
  longueurPantalon: z.string().nullable().optional(),
  frappe: z.string().nullable().optional(),
  cuisse: z.string().nullable().optional(),
  genoux: z.string().nullable().optional(),

  // 22. LONGUEUR JUPE - 6 sub-fields
  longueurJupeAvantGenoux: z.string().nullable().optional(),
  longueurJupeNiveauGenoux: z.string().nullable().optional(),
  longueurJupeApresGenoux: z.string().nullable().optional(),
  longueurJupeMiMollets: z.string().nullable().optional(),
  longueurJupeChevilles: z.string().nullable().optional(),
  longueurJupeTresLongue: z.string().nullable().optional(),

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

        // Upper body (1-9)
        dos: validatedData.dos,
        carrureDevant: validatedData.carrureDevant,
        carrureDerriere: validatedData.carrureDerriere,
        epaule: validatedData.epaule,
        epauleManche: validatedData.epauleManche,
        poitrine: validatedData.poitrine,
        tourDeTaille: validatedData.tourDeTaille,
        longueurDetaille: validatedData.longueurDetaille,
        bassin: validatedData.bassin,

        // 10. LONGUEUR DES MANCHES - 4 sub-fields
        longueurManchesCourtes: validatedData.longueurManchesCourtes,
        longueurManchesAvantCoudes: validatedData.longueurManchesAvantCoudes,
        longueurManchesNiveau34: validatedData.longueurManchesNiveau34,
        longueurManchesLongues: validatedData.longueurManchesLongues,

        // Arms continued (11-12)
        tourDeManche: validatedData.tourDeManche,
        poignets: validatedData.poignets,

        // Torso (13-14)
        pinces: validatedData.pinces,
        longueurTotale: validatedData.longueurTotale,

        // 15. LONGUEUR DES ROBES - 6 sub-fields
        longueurRobesAvantGenoux: validatedData.longueurRobesAvantGenoux,
        longueurRobesNiveauGenoux: validatedData.longueurRobesNiveauGenoux,
        longueurRobesApresGenoux: validatedData.longueurRobesApresGenoux,
        longueurRobesMiMollets: validatedData.longueurRobesMiMollets,
        longueurRobesChevilles: validatedData.longueurRobesChevilles,
        longueurRobesTresLongue: validatedData.longueurRobesTresLongue,

        // Torso continued (16-17)
        longueurTunique: validatedData.longueurTunique,
        ceinture: validatedData.ceinture,

        // Lower body (18-21)
        longueurPantalon: validatedData.longueurPantalon,
        frappe: validatedData.frappe,
        cuisse: validatedData.cuisse,
        genoux: validatedData.genoux,

        // 22. LONGUEUR JUPE - 6 sub-fields
        longueurJupeAvantGenoux: validatedData.longueurJupeAvantGenoux,
        longueurJupeNiveauGenoux: validatedData.longueurJupeNiveauGenoux,
        longueurJupeApresGenoux: validatedData.longueurJupeApresGenoux,
        longueurJupeMiMollets: validatedData.longueurJupeMiMollets,
        longueurJupeChevilles: validatedData.longueurJupeChevilles,
        longueurJupeTresLongue: validatedData.longueurJupeTresLongue,

        // Notes
        autresMesures: validatedData.autresMesures,
      },
    })

    return NextResponse.json({
      success: true,
      measurement,
      message: 'Mensurations enregistrees avec succes',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: error.errors },
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

// PUT /api/admin/customers/[id]/measurements - Update or create single measurement (no versioning)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = measurementSchema.parse(body)

    // Check if customer already has a measurement
    const existingMeasurement = await prisma.customerMeasurement.findFirst({
      where: { customerId: params.id },
      orderBy: { measurementDate: 'desc' },
    })

    const measurementData = {
      measurementDate: validatedData.measurementDate
        ? new Date(validatedData.measurementDate)
        : new Date(),
      unit: validatedData.unit,

      // Staff tracking
      takenByStaffId: (session.user as any).id,
      takenByStaffName: (session.user as any).name || 'Admin',

      // Upper body (1-9)
      dos: validatedData.dos,
      carrureDevant: validatedData.carrureDevant,
      carrureDerriere: validatedData.carrureDerriere,
      epaule: validatedData.epaule,
      epauleManche: validatedData.epauleManche,
      poitrine: validatedData.poitrine,
      tourDeTaille: validatedData.tourDeTaille,
      longueurDetaille: validatedData.longueurDetaille,
      bassin: validatedData.bassin,

      // 10. LONGUEUR DES MANCHES - 4 sub-fields
      longueurManchesCourtes: validatedData.longueurManchesCourtes,
      longueurManchesAvantCoudes: validatedData.longueurManchesAvantCoudes,
      longueurManchesNiveau34: validatedData.longueurManchesNiveau34,
      longueurManchesLongues: validatedData.longueurManchesLongues,

      // Arms continued (11-12)
      tourDeManche: validatedData.tourDeManche,
      poignets: validatedData.poignets,

      // Torso (13-14)
      pinces: validatedData.pinces,
      longueurTotale: validatedData.longueurTotale,

      // 15. LONGUEUR DES ROBES - 6 sub-fields
      longueurRobesAvantGenoux: validatedData.longueurRobesAvantGenoux,
      longueurRobesNiveauGenoux: validatedData.longueurRobesNiveauGenoux,
      longueurRobesApresGenoux: validatedData.longueurRobesApresGenoux,
      longueurRobesMiMollets: validatedData.longueurRobesMiMollets,
      longueurRobesChevilles: validatedData.longueurRobesChevilles,
      longueurRobesTresLongue: validatedData.longueurRobesTresLongue,

      // Torso continued (16-17)
      longueurTunique: validatedData.longueurTunique,
      ceinture: validatedData.ceinture,

      // Lower body (18-21)
      longueurPantalon: validatedData.longueurPantalon,
      frappe: validatedData.frappe,
      cuisse: validatedData.cuisse,
      genoux: validatedData.genoux,

      // 22. LONGUEUR JUPE - 6 sub-fields
      longueurJupeAvantGenoux: validatedData.longueurJupeAvantGenoux,
      longueurJupeNiveauGenoux: validatedData.longueurJupeNiveauGenoux,
      longueurJupeApresGenoux: validatedData.longueurJupeApresGenoux,
      longueurJupeMiMollets: validatedData.longueurJupeMiMollets,
      longueurJupeChevilles: validatedData.longueurJupeChevilles,
      longueurJupeTresLongue: validatedData.longueurJupeTresLongue,

      // Notes
      autresMesures: validatedData.autresMesures,
    }

    let measurement

    if (existingMeasurement) {
      // Update existing measurement
      measurement = await prisma.customerMeasurement.update({
        where: { id: existingMeasurement.id },
        data: measurementData,
      })
    } else {
      // Create new measurement
      measurement = await prisma.customerMeasurement.create({
        data: {
          customerId: params.id,
          ...measurementData,
        },
      })
    }

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

    console.error('Error updating measurement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement des mensurations' },
      { status: 500 }
    )
  }
}
