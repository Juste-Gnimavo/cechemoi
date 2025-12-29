import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateMeasurementsPDF } from '@/lib/measurements-pdf-generator'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/account/measurements-pdf - Generate PDF for customer's own measurements
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get measurement ID from query params (optional - defaults to latest)
    const searchParams = req.nextUrl.searchParams
    const measurementId = searchParams.get('measurementId')

    // Fetch customer
    const customer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        whatsappNumber: true,
        dateOfBirth: true,
        howDidYouHearAboutUs: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 })
    }

    // Fetch measurement (specific or latest)
    let measurement
    if (measurementId) {
      measurement = await prisma.customerMeasurement.findFirst({
        where: {
          id: measurementId,
          customerId: userId,
        },
      })
    } else {
      // Get latest measurement
      measurement = await prisma.customerMeasurement.findFirst({
        where: { customerId: userId },
        orderBy: { measurementDate: 'desc' },
      })
    }

    if (!measurement) {
      return NextResponse.json(
        { error: 'Aucune mensuration trouvee' },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdfBytes = await generateMeasurementsPDF(customer, measurement)

    // Create filename
    const customerName = customer.name?.replace(/\s+/g, '_') || 'mes'
    const date = new Date(measurement.measurementDate).toISOString().split('T')[0]
    const filename = `mensurations_${customerName}_${date}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la generation du PDF' },
      { status: 500 }
    )
  }
}
