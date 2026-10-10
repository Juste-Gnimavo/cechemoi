import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TailorBriefError, buildTailorBrief } from '@/lib/tailor-brief'
import { generateTailorBriefPDF } from '@/lib/tailor-brief-pdf-generator'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}

function unavailable() {
  return new NextResponse(
    "Cette fiche couturier n'est plus disponible. Demandez un nouvel envoi à l'atelier CÈCHÉMOI.",
    { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...PRIVATE_HEADERS } }
  )
}

/**
 * GET /api/fiche-couturier/[token]/[file]
 *
 * Route PUBLIQUE, sans authentification : c'est l'URL que le proxy WhatsApp
 * télécharge. Le jeton aléatoire (192 bits) est la seule clé ; le segment
 * [file] ne sert qu'à donner un nom lisible au document dans WhatsApp.
 * Ne renvoie que la fiche couturier, régénérée depuis les données courantes,
 * sans aucun montant.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const share = await prisma.tailorBriefShare.findUnique({
      where: { token: params.token },
      select: { customOrderId: true, tailorId: true, note: true, revokedAt: true },
    })
    if (!share || share.revokedAt) return unavailable()

    const brief = await buildTailorBrief(share.customOrderId, share.tailorId, share.note)
    const pdf = Buffer.from(await generateTailorBriefPDF(brief))
    const filename = `fiche-couturier-${brief.orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdf.length.toString(),
        ...PRIVATE_HEADERS,
      },
    })
  } catch (error) {
    // Couturier désassigné, commande supprimée… : la fiche n'a plus d'objet.
    if (error instanceof TailorBriefError) return unavailable()
    console.error('Fiche couturier publique :', error)
    return new NextResponse('Erreur lors de la génération de la fiche', {
      status: 500,
      headers: PRIVATE_HEADERS,
    })
  }
}
