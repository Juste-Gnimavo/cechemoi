import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { generateMeasurementsPDF } from '@/lib/measurements-pdf-generator'
import { uploadToS3, generateMeasurementPdfKey } from '@/lib/s3-client'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/customers/[id]/measurements-pdf - Generate PDF for customer measurements
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get measurement ID from query params (optional - defaults to latest)
    const searchParams = req.nextUrl.searchParams
    const measurementId = searchParams.get('measurementId')

    // Fetch customer
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
        image: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Fetch measurement (specific or latest)
    let measurement
    if (measurementId) {
      measurement = await prisma.customerMeasurement.findFirst({
        where: {
          id: measurementId,
          customerId: params.id,
        },
      })
    } else {
      // Get latest measurement
      measurement = await prisma.customerMeasurement.findFirst({
        where: { customerId: params.id },
        orderBy: { measurementDate: 'desc' },
      })
    }

    if (!measurement) {
      return NextResponse.json(
        { error: 'Aucune mensuration trouvée pour ce client' },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdfBytes = await generateMeasurementsPDF(customer, measurement)
    const pdfBuffer = Buffer.from(pdfBytes)

    // Create filename
    const customerName = customer.name?.replace(/\s+/g, '_') || 'client'
    const date = new Date(measurement.measurementDate).toISOString().split('T')[0]
    const filename = `mensurations_${customerName}_${date}.pdf`

    // Upload to S3
    try {
      const s3Key = generateMeasurementPdfKey(params.id, measurement.id)
      const s3Url = await uploadToS3(s3Key, pdfBuffer, 'application/pdf')

      // Update measurement record with PDF info
      await prisma.customerMeasurement.update({
        where: { id: measurement.id },
        data: {
          pdfUrl: s3Url,
          pdfKey: s3Key,
          pdfGeneratedAt: new Date(),
        },
      })
    } catch (s3Error) {
      // Log S3 error but don't fail the request - PDF will still be returned
      console.error('S3 upload error (PDF still returned):', s3Error)
    }

    // Return PDF for download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
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
