import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { TailorBriefError, buildTailorBrief } from '@/lib/tailor-brief'
import { generateTailorBriefPDF } from '@/lib/tailor-brief-pdf-generator'

export const dynamic = 'force-dynamic'

// GET /api/admin/custom-orders/[id]/notify-tailor/preview-pdf?tailorId=…&note=…
// Aperçu du PDF exactement tel qu'il partira, avant l'envoi.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'production')
    if (denied) return denied

    const tailorId = req.nextUrl.searchParams.get('tailorId')
    if (!tailorId) {
      return NextResponse.json({ error: 'Couturier non précisé' }, { status: 400 })
    }
    const note = (req.nextUrl.searchParams.get('note') || '').slice(0, 1000)

    const brief = await buildTailorBrief(params.id, tailorId, note)
    const pdf = Buffer.from(await generateTailorBriefPDF(brief))

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="apercu-fiche-couturier.pdf"',
        'Content-Length': pdf.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof TailorBriefError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Aperçu fiche couturier :', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
